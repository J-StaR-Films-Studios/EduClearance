import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, caseTimelineEntries, clearanceIssues, clearanceRequests } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';

const responseSchema = z.object({
  clearanceRequestId: z.string().trim().min(1),
  response: z.enum(['no_outstanding_issue']),
});

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Please sign in with an active school account.' }, { status: 401 });
  }

  if (actor.schoolStatus !== 'active') {
    return NextResponse.json({ ok: false, message: 'Your school must be verified before it can answer clearance requests.' }, { status: 403 });
  }

  const payload = responseSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid clearance response.', issues: payload.error.flatten() }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const result = await db.transaction(async (tx) => {
    const resolvedAt = new Date();
    const [request] = await tx
      .select({ id: clearanceRequests.id, searchResult: clearanceRequests.searchResult })
      .from(clearanceRequests)
      .where(and(eq(clearanceRequests.id, payload.data.clearanceRequestId), eq(clearanceRequests.previousSchoolId, actor.schoolId)))
      .limit(1);

    if (!request) {
      return null;
    }

    if (request.searchResult === 'possible_match') {
      return { kind: 'potential_match' as const };
    }

    const [updated] = await tx
      .update(clearanceRequests)
      .set({
        status: 'cleared_by_previous_school',
        searchResult: 'no_match',
        notificationStatus: 'dashboard',
        updatedAt: resolvedAt,
      })
      .where(and(eq(clearanceRequests.id, payload.data.clearanceRequestId), eq(clearanceRequests.previousSchoolId, actor.schoolId)))
      .returning({ id: clearanceRequests.id });

    if (!updated) {
      return null;
    }

    const resolvedIssues = await tx
      .update(clearanceIssues)
      .set({ status: 'resolved', resolvedAt })
      .where(and(eq(clearanceIssues.clearanceRequestId, updated.id), eq(clearanceIssues.reportingSchoolId, actor.schoolId)))
      .returning({ id: clearanceIssues.id });

    if (resolvedIssues.length > 0) {
      await tx.insert(caseTimelineEntries).values(resolvedIssues.map((issue) => ({
        id: makeEntityId('case_timeline'),
        entityType: 'clearance_issue' as const,
        entityId: issue.id,
        authorUserId: actor.userId,
        authorSchoolId: actor.schoolId,
        entryType: 'status_change' as const,
        body: 'Previous school confirmed that no outstanding obligation remains. Linked clearance request marked cleared.',
        attachmentFileName: null,
        attachmentFileType: null,
        attachmentFileSize: null,
        attachmentDataUrl: null,
      })));
    }

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: actor.schoolId,
      action: 'clearance_no_outstanding_issue_confirmed',
      entityType: 'clearance_request',
      entityId: updated.id,
      metadataJson: { response: payload.data.response, resolvedIssueIds: resolvedIssues.map((issue) => issue.id) },
      ipAddress,
    });

    return updated;
  });

  if (!result) {
    return NextResponse.json({ ok: false, message: 'Clearance request was not found for your school.' }, { status: 404 });
  }

  if ((result as { kind?: string }).kind === 'potential_match') {
    return NextResponse.json({ ok: false, message: 'This is a potential fuzzy match. Open the case review before clearing it.' }, { status: 409 });
  }

  return NextResponse.json({ ok: true, clearanceRequestId: (result as { id: string }).id });
}
