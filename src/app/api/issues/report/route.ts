import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, clearanceIssues, clearanceRequests } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { normalizePhoneNumber, normalizeSearchText } from '@/lib/text';

const issueReportSchema = z.object({
  studentName: z.string().trim().min(2),
  lastClass: z.string().trim().optional(),
  issueType: z.enum(['school_fees', 'books', 'uniform', 'transport', 'other']),
  amountNaira: z.number().positive().max(100_000_000),
  academicSession: z.string().trim().min(4),
  term: z.string().trim().min(3),
  parentName: z.string().trim().min(2),
  parentPhone: z.string().trim().min(7),
  note: z.string().trim().min(10),
  evidenceUrl: z.string().trim().url().optional(),
  clearanceRequestId: z.string().trim().min(1).nullable().optional(),
  source: z.string().trim().optional(),
  certified: z.literal(true),
});

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Please sign in with an active school account.' }, { status: 401 });
  }

  const payload = issueReportSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Please complete the issue report before saving.', issues: payload.error.flatten() }, { status: 400 });
  }

  const issueId = makeEntityId('issue');
  const amountOwed = Math.round(payload.data.amountNaira * 100);
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  await db.transaction(async (tx) => {
    let linkedClearanceRequestId = payload.data.clearanceRequestId ?? null;

    if (linkedClearanceRequestId) {
      const [request] = await tx
        .select({ id: clearanceRequests.id })
        .from(clearanceRequests)
        .where(and(eq(clearanceRequests.id, linkedClearanceRequestId), eq(clearanceRequests.previousSchoolId, actor.schoolId)))
        .limit(1);

      linkedClearanceRequestId = request?.id ?? null;
    }

    await tx.insert(clearanceIssues).values({
      id: issueId,
      clearanceRequestId: linkedClearanceRequestId,
      reportingSchoolId: actor.schoolId,
      studentName: payload.data.studentName,
      studentNameNormalized: normalizeSearchText(payload.data.studentName),
      parentName: payload.data.parentName,
      parentPhone: normalizePhoneNumber(payload.data.parentPhone),
      amountOwed,
      issueType: payload.data.issueType,
      academicSession: payload.data.academicSession,
      term: payload.data.term,
      note: payload.data.note,
      evidenceUrl: payload.data.evidenceUrl ?? null,
      status: 'unresolved',
    });

    if (linkedClearanceRequestId) {
      await tx
        .update(clearanceRequests)
        .set({
          status: 'outstanding_balance_reported',
          searchResult: 'confirmed_match',
          notificationStatus: 'dashboard',
          updatedAt: new Date(),
        })
        .where(eq(clearanceRequests.id, linkedClearanceRequestId));
    }

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: actor.schoolId,
      action: 'clearance_issue_reported',
      entityType: 'clearance_issue',
      entityId: issueId,
      metadataJson: {
        studentName: payload.data.studentName,
        amountOwed,
        issueType: payload.data.issueType,
        source: payload.data.source ?? null,
        clearanceRequestId: linkedClearanceRequestId,
      },
      ipAddress,
    });
  });

  return NextResponse.json({ ok: true, issueId });
}
