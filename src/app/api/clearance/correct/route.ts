import { NextResponse } from 'next/server';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, clearanceIssues, clearanceRequests, schools } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { buildStudentDisplayName, getNameTokenOverlap, getNameTokens, normalizeNameSignature, normalizePhoneNumber, normalizeSearchText } from '@/lib/text';

const correctionSchema = z.object({
  clearanceRequestId: z.string().trim().min(1),
  studentFirstName: z.string().trim().min(1),
  studentMiddleName: z.string().trim().optional(),
  studentLastName: z.string().trim().optional(),
  previousSchoolId: z.string().trim().min(1).nullable().optional(),
  previousSchoolName: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Active school session required.' }, { status: 401 });
  }

  if (actor.schoolStatus !== 'active') {
    return NextResponse.json({ ok: false, message: 'Only verified schools can correct clearance requests.' }, { status: 403 });
  }

  const payload = correctionSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Enter the corrected student name and previous school.', issues: payload.error.flatten() }, { status: 400 });
  }

  const studentName = buildStudentDisplayName(payload.data.studentFirstName, payload.data.studentMiddleName, payload.data.studentLastName);

  if (!studentName) {
    return NextResponse.json({ ok: false, message: 'Enter the corrected student name.' }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  const studentNameNormalized = normalizeSearchText(studentName);
  const studentNameSignature = normalizeNameSignature(studentName);

  const result = await db.transaction(async (tx) => {
    const [existingRequest] = await tx
      .select({
        id: clearanceRequests.id,
        incomingSchoolId: clearanceRequests.incomingSchoolId,
        parentPhone: clearanceRequests.parentPhone,
        searchResult: clearanceRequests.searchResult,
        correctionCount: clearanceRequests.correctionCount,
        previousSchoolNameSnapshot: clearanceRequests.previousSchoolNameSnapshot,
        studentName: clearanceRequests.studentName,
      })
      .from(clearanceRequests)
      .where(and(eq(clearanceRequests.id, payload.data.clearanceRequestId), eq(clearanceRequests.incomingSchoolId, actor.schoolId)))
      .limit(1);

    if (!existingRequest) {
      return { kind: 'not_found' as const };
    }

    if (existingRequest.searchResult !== 'possible_match') {
      return { kind: 'not_correctable' as const };
    }

    if (existingRequest.correctionCount >= 1) {
      return { kind: 'limit_reached' as const };
    }

    const [selectedPreviousSchool] = payload.data.previousSchoolId
      ? await tx
          .select({ id: schools.id, name: schools.name, status: schools.status })
          .from(schools)
          .where(eq(schools.id, payload.data.previousSchoolId))
          .limit(1)
      : await tx
          .select({ id: schools.id, name: schools.name, status: schools.status })
          .from(schools)
          .where(ilike(schools.name, `%${payload.data.previousSchoolName}%`))
          .limit(1);

    const parentPhoneNormalized = normalizePhoneNumber(existingRequest.parentPhone);
    const unresolvedIssues = await tx
      .select({
        id: clearanceIssues.id,
        reportingSchoolId: clearanceIssues.reportingSchoolId,
        studentName: clearanceIssues.studentName,
        studentNameNormalized: clearanceIssues.studentNameNormalized,
        parentPhone: clearanceIssues.parentPhone,
      })
      .from(clearanceIssues)
      .where(eq(clearanceIssues.status, 'unresolved'))
      .limit(100);

    const submittedTokenCount = getNameTokens(studentName).length;
    const candidateIssues = unresolvedIssues
      .map((issue) => {
        const exactName = issue.studentNameNormalized === studentNameNormalized;
        const signatureMatch = normalizeNameSignature(issue.studentName) === studentNameSignature && studentNameSignature.length > 0;
        const overlap = getNameTokenOverlap(issue.studentName, studentName);
        const enoughOverlap = submittedTokenCount <= 1 ? overlap >= 1 : overlap >= 2;
        const phoneMatch = normalizePhoneNumber(issue.parentPhone) === parentPhoneNormalized;
        const schoolMatch = selectedPreviousSchool ? issue.reportingSchoolId === selectedPreviousSchool.id : true;
        const qualifies = exactName || signatureMatch || enoughOverlap;
        const score = (exactName ? 30 : 0) + (signatureMatch ? 25 : 0) + (phoneMatch ? 20 : 0) + (schoolMatch ? 10 : 0) + overlap;

        return { ...issue, exactName, signatureMatch, phoneMatch, schoolMatch, qualifies, score };
      })
      .filter((issue) => issue.qualifies)
      .sort((a, b) => b.score - a.score);

    const confirmedIssue = candidateIssues.find((issue) => issue.phoneMatch && issue.schoolMatch && (issue.exactName || issue.signatureMatch)) ?? null;
    const possibleIssue = confirmedIssue ? null : candidateIssues[0] ?? null;
    const issueSchoolId = confirmedIssue?.reportingSchoolId ?? possibleIssue?.reportingSchoolId ?? null;
    const [matchedIssueSchool] = issueSchoolId && issueSchoolId !== selectedPreviousSchool?.id
      ? await tx
          .select({ id: schools.id, name: schools.name, status: schools.status })
          .from(schools)
          .where(eq(schools.id, issueSchoolId))
          .limit(1)
      : [null];
    const previousSchool = matchedIssueSchool ?? selectedPreviousSchool ?? null;
    const searchResult = confirmedIssue ? 'confirmed_match' : possibleIssue ? 'possible_match' : 'no_match';
    const status = confirmedIssue
      ? 'outstanding_balance_reported'
      : possibleIssue
        ? 'pending_verification'
        : previousSchool?.status === 'active'
          ? 'previous_school_notified'
          : 'no_platform_record_found';
    const notificationStatus = confirmedIssue || previousSchool?.status === 'active' ? 'dashboard' : possibleIssue ? 'not_sent' : 'whatsapp_generated';
    const linkedIssue = confirmedIssue ?? possibleIssue;

    await tx
      .update(clearanceIssues)
      .set({ clearanceRequestId: null })
      .where(eq(clearanceIssues.clearanceRequestId, existingRequest.id));

    if (linkedIssue) {
      await tx
        .update(clearanceIssues)
        .set({ clearanceRequestId: existingRequest.id })
        .where(eq(clearanceIssues.id, linkedIssue.id));
    }

    await tx
      .update(clearanceRequests)
      .set({
        previousSchoolId: issueSchoolId ?? previousSchool?.id ?? null,
        previousSchoolNameSnapshot: previousSchool?.name ?? payload.data.previousSchoolName,
        studentName,
        studentNameNormalized,
        status,
        searchResult,
        notificationStatus,
        correctionCount: sql`${clearanceRequests.correctionCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(clearanceRequests.id, existingRequest.id));

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: actor.schoolId,
      action: 'clearance_request_corrected_once',
      entityType: 'clearance_request',
      entityId: existingRequest.id,
      metadataJson: {
        fromStudentName: existingRequest.studentName,
        toStudentName: studentName,
        fromPreviousSchoolName: existingRequest.previousSchoolNameSnapshot,
        toPreviousSchoolName: previousSchool?.name ?? payload.data.previousSchoolName,
        searchResult,
        status,
        linkedIssueId: linkedIssue?.id ?? null,
      },
      ipAddress,
    });

    return { kind: 'success' as const, requestId: existingRequest.id, searchResult, status };
  });

  if (result.kind === 'not_found') {
    return NextResponse.json({ ok: false, message: 'Clearance request was not found for your school.' }, { status: 404 });
  }

  if (result.kind === 'not_correctable') {
    return NextResponse.json({ ok: false, message: 'Only possible-match requests can be corrected from this action.' }, { status: 409 });
  }

  if (result.kind === 'limit_reached') {
    return NextResponse.json({ ok: false, message: 'This request has already used its one allowed correction. Start a new check if the details are still wrong.' }, { status: 409 });
  }

  return NextResponse.json({ ok: true, requestId: result.requestId, searchResult: result.searchResult, status: result.status, routeUrl: `/clearance/${result.requestId}` });
}
