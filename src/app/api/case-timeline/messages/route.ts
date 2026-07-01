import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { caseTimelineEntries, clearanceIssues, clearanceRequests, disputes, schools } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { isActiveSchoolActor, isPlatformAdminActor, resolveOptionalLocalActor } from '@/lib/local-actor';
import { isSafeUploadDataUrl } from '@/lib/upload-security';

export const runtime = 'nodejs';

const messageSchema = z.object({
  entityType: z.enum(['clearance_request', 'clearance_issue', 'dispute']),
  entityId: z.string().trim().min(1),
  body: z.string().trim().min(1),
  attachmentFileName: z.string().trim().min(1).optional(),
  attachmentFileType: z.string().trim().min(1).max(100).optional(),
  attachmentFileSize: z.number().int().positive().max(2_000_000).optional(),
  attachmentDataUrl: z.string().trim().min(1).max(3_000_000).optional(),
});

async function canAccessEntity(entityType: string, entityId: string, schoolId: string): Promise<boolean> {
  if (entityType === 'clearance_request') {
    const [request] = await db
      .select({ id: clearanceRequests.id })
      .from(clearanceRequests)
      .where(and(eq(clearanceRequests.id, entityId), eq(clearanceRequests.incomingSchoolId, schoolId)))
      .limit(1);

    if (request) {
      return true;
    }

    const [previousRequest] = await db
      .select({ id: clearanceRequests.id })
      .from(clearanceRequests)
      .where(and(eq(clearanceRequests.id, entityId), eq(clearanceRequests.previousSchoolId, schoolId)))
      .limit(1);

    return Boolean(previousRequest);
  }

  if (entityType === 'clearance_issue') {
    const [issue] = await db
      .select({ id: clearanceIssues.id, reportingSchoolId: clearanceIssues.reportingSchoolId, clearanceRequestId: clearanceIssues.clearanceRequestId })
      .from(clearanceIssues)
      .where(eq(clearanceIssues.id, entityId))
      .limit(1);

    if (!issue) {
      return false;
    }

    if (issue.reportingSchoolId === schoolId) {
      return true;
    }

    return issue.clearanceRequestId ? canAccessEntity('clearance_request', issue.clearanceRequestId, schoolId) : false;
  }

  if (entityType === 'dispute') {
    const [dispute] = await db
      .select({ clearanceRequestId: disputes.clearanceRequestId, clearanceIssueId: disputes.clearanceIssueId, raisedBySchoolId: disputes.raisedBySchoolId })
      .from(disputes)
      .where(eq(disputes.id, entityId))
      .limit(1);

    if (!dispute) {
      return false;
    }

    if (dispute.raisedBySchoolId === schoolId) {
      return true;
    }

    if (dispute.clearanceRequestId && await canAccessEntity('clearance_request', dispute.clearanceRequestId, schoolId)) {
      return true;
    }

    return dispute.clearanceIssueId ? canAccessEntity('clearance_issue', dispute.clearanceIssueId, schoolId) : false;
  }

  return false;
}

export async function POST(request: Request) {
  const actor = await resolveOptionalLocalActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  const payload = messageSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Please add a message or valid evidence file.', issues: payload.error.flatten() }, { status: 400 });
  }

  if (!isPlatformAdminActor(actor) && !isActiveSchoolActor(actor)) {
    return NextResponse.json({ ok: false, message: 'Only active schools can add case messages or evidence.' }, { status: 403 });
  }

  if (payload.data.attachmentDataUrl && !isSafeUploadDataUrl(payload.data.attachmentDataUrl, payload.data.attachmentFileType)) {
    return NextResponse.json({ ok: false, message: 'Evidence files must be valid PDF, PNG, or JPEG files.' }, { status: 400 });
  }

  const allowed = isPlatformAdminActor(actor) || (actor.schoolId ? await canAccessEntity(payload.data.entityType, payload.data.entityId, actor.schoolId) : false);

  if (!allowed) {
    return NextResponse.json({ ok: false, message: 'You do not have access to this case.' }, { status: 403 });
  }

  const hasAttachment = Boolean(payload.data.attachmentFileName && payload.data.attachmentFileType && payload.data.attachmentFileSize && payload.data.attachmentDataUrl);
  const entryId = makeEntityId('case_timeline');

  await db.insert(caseTimelineEntries).values({
    id: entryId,
    entityType: payload.data.entityType,
    entityId: payload.data.entityId,
    authorUserId: actor.userId,
    authorSchoolId: actor.schoolId,
    entryType: hasAttachment ? 'evidence' : 'message',
    body: payload.data.body,
    attachmentFileName: payload.data.attachmentFileName ?? null,
    attachmentFileType: payload.data.attachmentFileType ?? null,
    attachmentFileSize: payload.data.attachmentFileSize ?? null,
    attachmentDataUrl: payload.data.attachmentDataUrl ?? null,
  });

  const authorLabel = isPlatformAdminActor(actor)
    ? 'Platform admin'
    : actor.schoolId
      ? await db.select({ name: schools.name }).from(schools).where(eq(schools.id, actor.schoolId)).limit(1).then((rows) => rows[0]?.name ?? actor.userName)
      : actor.userName;

  return NextResponse.json({
    ok: true,
    entry: {
      id: entryId,
      entryType: hasAttachment ? 'evidence' : 'message',
      body: payload.data.body,
      authorLabel,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      attachmentFileName: payload.data.attachmentFileName ?? null,
      attachmentFileSize: payload.data.attachmentFileSize ?? null,
    },
  });
}
