import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, caseTimelineEntries, clearanceIssues, disputes } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveOptionalLocalActor } from '@/lib/local-actor';

const disputeResolveSchema = z.object({
  disputeId: z.string().trim().min(1),
  action: z.enum(['resolved', 'rejected']),
});

export async function POST(request: Request) {
  const actor = await resolveOptionalLocalActor();

  if (!actor || actor.sessionRole !== 'platform_admin') {
    return NextResponse.json({ ok: false, message: 'Platform admin access required.' }, { status: 403 });
  }

  const payload = disputeResolveSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid dispute update.', issues: payload.error.flatten() }, { status: 400 });
  }

  const adminNote =
    payload.data.action === 'resolved'
      ? 'Record cleared after evidence review. Refund review noted for the admitting school wallet.'
      : 'Dispute rejected after evidence review. Existing issue record remains active.';
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(disputes)
      .set({ status: payload.data.action, adminNote, resolvedAt: new Date() })
      .where(eq(disputes.id, payload.data.disputeId))
      .returning({ id: disputes.id, clearanceIssueId: disputes.clearanceIssueId });

    if (!updated) {
      return null;
    }

    if (updated.clearanceIssueId) {
      await tx
        .update(clearanceIssues)
        .set({ status: payload.data.action === 'resolved' ? 'resolved' : 'disputed', resolvedAt: payload.data.action === 'resolved' ? new Date() : null })
        .where(eq(clearanceIssues.id, updated.clearanceIssueId));
    }

    await tx.insert(caseTimelineEntries).values({
      id: makeEntityId('case_timeline'),
      entityType: 'dispute',
      entityId: updated.id,
      authorUserId: actor.userId,
      authorSchoolId: null,
      entryType: 'status_change',
      body: adminNote,
      attachmentFileName: null,
      attachmentFileType: null,
      attachmentFileSize: null,
      attachmentDataUrl: null,
    });

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: null,
      action: 'admin_dispute_resolved',
      entityType: 'dispute',
      entityId: updated.id,
      metadataJson: { action: payload.data.action, clearanceIssueId: updated.clearanceIssueId, adminNote },
      ipAddress,
    });

    return updated;
  });

  if (!result) {
    return NextResponse.json({ ok: false, message: 'Dispute was not found.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, disputeId: result.id, status: payload.data.action, adminNote });
}
