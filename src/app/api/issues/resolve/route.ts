import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, caseTimelineEntries, clearanceIssues, clearanceRequests } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';

const issueResolveSchema = z.object({
  issueId: z.string().trim().min(1),
  confirmed: z.literal(true),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Please sign in with an active school account.' }, { status: 401 });
  }

  const payload = issueResolveSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Confirm that payment was received or no outstanding issue remains.', issues: payload.error.flatten() }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  const resolvedAt = new Date();
  const note = payload.data.note?.trim() || 'Reporting school confirmed payment received / no outstanding issue remains.';

  const result = await db.transaction(async (tx) => {
    const [issue] = await tx
      .select({
        id: clearanceIssues.id,
        clearanceRequestId: clearanceIssues.clearanceRequestId,
        reportingSchoolId: clearanceIssues.reportingSchoolId,
        status: clearanceIssues.status,
        studentName: clearanceIssues.studentName,
      })
      .from(clearanceIssues)
      .where(and(eq(clearanceIssues.id, payload.data.issueId), eq(clearanceIssues.reportingSchoolId, actor.schoolId)))
      .limit(1);

    if (!issue) {
      return null;
    }

    if (issue.status === 'resolved') {
      return { issueId: issue.id, clearanceRequestId: issue.clearanceRequestId, alreadyResolved: true };
    }

    await tx
      .update(clearanceIssues)
      .set({ status: 'resolved', resolvedAt })
      .where(eq(clearanceIssues.id, issue.id));

    if (issue.clearanceRequestId) {
      await tx
        .update(clearanceRequests)
        .set({
          status: 'cleared_by_previous_school',
          searchResult: 'no_match',
          notificationStatus: 'dashboard',
          updatedAt: resolvedAt,
        })
        .where(eq(clearanceRequests.id, issue.clearanceRequestId));
    }

    await tx.insert(caseTimelineEntries).values({
      id: makeEntityId('case_timeline'),
      entityType: 'clearance_issue',
      entityId: issue.id,
      authorUserId: actor.userId,
      authorSchoolId: actor.schoolId,
      entryType: 'status_change',
      body: note,
      attachmentFileName: null,
      attachmentFileType: null,
      attachmentFileSize: null,
      attachmentDataUrl: null,
    });

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: actor.schoolId,
      action: 'clearance_issue_confirmed_resolved',
      entityType: 'clearance_issue',
      entityId: issue.id,
      metadataJson: { clearanceRequestId: issue.clearanceRequestId, studentName: issue.studentName, note },
      ipAddress,
    });

    return { issueId: issue.id, clearanceRequestId: issue.clearanceRequestId, alreadyResolved: false };
  });

  if (!result) {
    return NextResponse.json({ ok: false, message: 'Issue record was not found for your school.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...result });
}
