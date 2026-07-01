import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, caseTimelineEntries, clearanceIssues, clearanceRequests } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { buildStudentDisplayName, isValidPhoneNumber, normalizePhoneNumber, normalizeSearchText } from '@/lib/text';

const issueReportSchema = z.object({
  studentName: z.string().trim().optional(),
  studentFirstName: z.string().trim().min(1).optional(),
  studentMiddleName: z.string().trim().optional(),
  studentLastName: z.string().trim().optional(),
  lastClass: z.string().trim().optional(),
  issueType: z.enum(['school_fees', 'books', 'uniform', 'transport', 'other']),
  amountNaira: z.number().positive().max(100_000_000),
  academicSession: z.string().trim().min(4),
  term: z.string().trim().min(3),
  parentName: z.string().trim().min(2),
  parentPhone: z.string().trim().min(7),
  note: z.string().trim().min(5, 'Official note must be at least 5 characters.'),
  evidenceUrl: z.string().trim().url().optional(),
  evidenceFileName: z.string().trim().min(1).optional(),
  evidenceFileType: z.string().trim().min(1).max(100).optional(),
  evidenceFileSize: z.number().int().positive().max(2_000_000).optional(),
  evidenceDataUrl: z.string().trim().min(1).max(3_000_000).optional(),
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
    const issues = payload.error.flatten();
    const firstIssue = Object.values(issues.fieldErrors).flat().find(Boolean);
    return NextResponse.json({ ok: false, message: firstIssue ?? 'Please complete the issue report before saving.', issues }, { status: 400 });
  }

  const studentName = buildStudentDisplayName(payload.data.studentFirstName ?? '', payload.data.studentMiddleName, payload.data.studentLastName) || payload.data.studentName?.trim() || '';

  if (!studentName) {
    return NextResponse.json({ ok: false, message: 'Enter at least the student first name before saving an issue report.' }, { status: 400 });
  }

  if (!isValidPhoneNumber(payload.data.parentPhone)) {
    return NextResponse.json({ ok: false, message: 'Enter a real parent phone number using digits, e.g. +234 803 123 4567.' }, { status: 400 });
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

    const hasEvidence = Boolean(payload.data.evidenceFileName && payload.data.evidenceFileType && payload.data.evidenceFileSize && payload.data.evidenceDataUrl);

    await tx.insert(clearanceIssues).values({
      id: issueId,
      clearanceRequestId: linkedClearanceRequestId,
      reportingSchoolId: actor.schoolId,
      studentName,
      studentNameNormalized: normalizeSearchText(studentName),
      parentName: payload.data.parentName,
      parentPhone: normalizePhoneNumber(payload.data.parentPhone),
      amountOwed,
      issueType: payload.data.issueType,
      academicSession: payload.data.academicSession,
      term: payload.data.term,
      note: payload.data.note,
      evidenceUrl: payload.data.evidenceUrl ?? (hasEvidence ? `case-timeline:${issueId}` : null),
      status: 'unresolved',
    });

    await tx.insert(caseTimelineEntries).values({
      id: makeEntityId('case_timeline'),
      entityType: 'clearance_issue',
      entityId: issueId,
      authorUserId: actor.userId,
      authorSchoolId: actor.schoolId,
      entryType: hasEvidence ? 'evidence' : 'message',
      body: payload.data.note,
      attachmentFileName: payload.data.evidenceFileName ?? null,
      attachmentFileType: payload.data.evidenceFileType ?? null,
      attachmentFileSize: payload.data.evidenceFileSize ?? null,
      attachmentDataUrl: payload.data.evidenceDataUrl ?? null,
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
        studentName,
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
