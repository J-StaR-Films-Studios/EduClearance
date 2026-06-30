import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { caseTimelineEntries, clearanceIssues, clearanceRequests, disputes } from '@/db/schema';
import { isPlatformAdminActor, resolveOptionalLocalActor } from '@/lib/local-actor';

export const runtime = 'nodejs';

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], 'base64'),
  };
}

function safeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 120) || 'case-evidence';
}

async function canAccessEntry(entityType: string, entityId: string, schoolId: string) {
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
      .select({ id: clearanceIssues.id, clearanceRequestId: clearanceIssues.clearanceRequestId, reportingSchoolId: clearanceIssues.reportingSchoolId })
      .from(clearanceIssues)
      .where(eq(clearanceIssues.id, entityId))
      .limit(1);

    if (!issue) {
      return false;
    }

    if (issue.reportingSchoolId === schoolId) {
      return true;
    }

    if (!issue.clearanceRequestId) {
      return false;
    }

    return canAccessEntry('clearance_request', issue.clearanceRequestId, schoolId);
  }

  if (entityType === 'dispute') {
    const [dispute] = await db
      .select({
        id: disputes.id,
        clearanceRequestId: disputes.clearanceRequestId,
        clearanceIssueId: disputes.clearanceIssueId,
        raisedBySchoolId: disputes.raisedBySchoolId,
      })
      .from(disputes)
      .where(eq(disputes.id, entityId))
      .limit(1);

    if (!dispute) {
      return false;
    }

    if (dispute.raisedBySchoolId === schoolId) {
      return true;
    }

    if (dispute.clearanceRequestId && await canAccessEntry('clearance_request', dispute.clearanceRequestId, schoolId)) {
      return true;
    }

    if (dispute.clearanceIssueId && await canAccessEntry('clearance_issue', dispute.clearanceIssueId, schoolId)) {
      return true;
    }
  }

  return false;
}

export async function GET(request: Request) {
  const actor = await resolveOptionalLocalActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Sign in required.' }, { status: 401 });
  }

  const entryId = new URL(request.url).searchParams.get('entryId')?.trim();

  if (!entryId) {
    return NextResponse.json({ ok: false, message: 'Entry id is required.' }, { status: 400 });
  }

  const [entry] = await db
    .select({
      id: caseTimelineEntries.id,
      entityType: caseTimelineEntries.entityType,
      entityId: caseTimelineEntries.entityId,
      attachmentFileName: caseTimelineEntries.attachmentFileName,
      attachmentFileType: caseTimelineEntries.attachmentFileType,
      attachmentDataUrl: caseTimelineEntries.attachmentDataUrl,
    })
    .from(caseTimelineEntries)
    .where(eq(caseTimelineEntries.id, entryId))
    .limit(1);

  if (!entry || !entry.attachmentDataUrl || !entry.attachmentFileName) {
    return NextResponse.json({ ok: false, message: 'Attachment not found.' }, { status: 404 });
  }

  const allowed = isPlatformAdminActor(actor) || (actor.schoolId ? await canAccessEntry(entry.entityType, entry.entityId, actor.schoolId) : false);

  if (!allowed) {
    return NextResponse.json({ ok: false, message: 'You do not have access to this attachment.' }, { status: 403 });
  }

  const decoded = decodeDataUrl(entry.attachmentDataUrl);

  if (!decoded) {
    return NextResponse.json({ ok: false, message: 'Stored attachment is invalid.' }, { status: 500 });
  }

  return new Response(decoded.bytes, {
    headers: {
      'Content-Type': entry.attachmentFileType ?? decoded.contentType,
      'Content-Disposition': `inline; filename="${safeFilename(entry.attachmentFileName)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
