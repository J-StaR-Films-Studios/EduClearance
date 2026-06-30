import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, caseTimelineEntries, clearanceIssues, clearanceRequests, disputes } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';

const disputeReportSchema = z.object({
  clearanceRequestId: z.string().trim().min(1),
  reason: z.string().trim().min(5),
  evidenceFileName: z.string().trim().min(1).optional(),
  evidenceFileType: z.string().trim().min(1).max(100).optional(),
  evidenceFileSize: z.number().int().positive().max(2_000_000).optional(),
  evidenceDataUrl: z.string().trim().min(1).max(3_000_000).optional(),
});

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Please sign in with an active school account.' }, { status: 401 });
  }

  const payload = disputeReportSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Please enter a dispute reason.', issues: payload.error.flatten() }, { status: 400 });
  }

  const disputeId = makeEntityId('dispute');
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const result = await db.transaction(async (tx) => {
    const [clearance] = await tx
      .select({ id: clearanceRequests.id, incomingSchoolId: clearanceRequests.incomingSchoolId })
      .from(clearanceRequests)
      .where(and(eq(clearanceRequests.id, payload.data.clearanceRequestId), eq(clearanceRequests.incomingSchoolId, actor.schoolId)))
      .limit(1);

    if (!clearance) {
      return null;
    }

    const [issue] = await tx
      .select({ id: clearanceIssues.id })
      .from(clearanceIssues)
      .where(eq(clearanceIssues.clearanceRequestId, clearance.id))
      .limit(1);

    await tx.insert(disputes).values({
      id: disputeId,
      clearanceRequestId: clearance.id,
      clearanceIssueId: issue?.id ?? null,
      raisedBySchoolId: actor.schoolId,
      reason: payload.data.reason,
      status: 'under_review',
      adminNote: 'New dispute submitted by admitting school. Evidence review pending.',
    });

    await tx.update(clearanceRequests).set({ status: 'disputed', updatedAt: new Date() }).where(eq(clearanceRequests.id, clearance.id));

    if (issue) {
      await tx.update(clearanceIssues).set({ status: 'disputed' }).where(eq(clearanceIssues.id, issue.id));
    }

    const hasEvidence = Boolean(payload.data.evidenceFileName && payload.data.evidenceFileType && payload.data.evidenceFileSize && payload.data.evidenceDataUrl);

    await tx.insert(caseTimelineEntries).values({
      id: makeEntityId('case_timeline'),
      entityType: 'dispute',
      entityId: disputeId,
      authorUserId: actor.userId,
      authorSchoolId: actor.schoolId,
      entryType: hasEvidence ? 'evidence' : 'message',
      body: payload.data.reason,
      attachmentFileName: payload.data.evidenceFileName ?? null,
      attachmentFileType: payload.data.evidenceFileType ?? null,
      attachmentFileSize: payload.data.evidenceFileSize ?? null,
      attachmentDataUrl: payload.data.evidenceDataUrl ?? null,
    });

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: actor.schoolId,
      action: 'dispute_reported',
      entityType: 'dispute',
      entityId: disputeId,
      metadataJson: { clearanceRequestId: clearance.id, clearanceIssueId: issue?.id ?? null, reason: payload.data.reason },
      ipAddress,
    });

    return { disputeId };
  });

  if (!result) {
    return NextResponse.json({ ok: false, message: 'Clearance request was not found for your school.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, disputeId: result.disputeId });
}
