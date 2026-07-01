import { NextResponse } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, schoolClaims, schools } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { getAuthenticatedUser } from '@/lib/auth-session';
import { SUPPORT_EMAIL } from '@/lib/site';
import { isValidPhoneNumber, normalizeSearchText } from '@/lib/text';

export const runtime = 'nodejs';

const MAX_SCHOOL_CLAIM_APPEALS = 3;

function supportMessage(schoolName: string) {
  const subject = encodeURIComponent(`EduClearance school claim support: ${schoolName}`);
  return `This school has reached the three online claim attempts allowed for this account. If you are the authorized owner, contact support at ${SUPPORT_EMAIL} or mailto:${SUPPORT_EMAIL}?subject=${subject}.`;
}

const schoolClaimSchema = z.object({
  claimType: z.enum(['existing_school', 'new_school']),
  schoolId: z.string().trim().min(1).optional(),
  requestedSchoolName: z.string().trim().min(2),
  requestedArea: z.string().trim().min(2),
  requestedAddress: z.string().trim().min(2),
  officialContactName: z.string().trim().min(2),
  officialEmail: z.string().trim().email(),
  officialPhone: z.string().trim().min(6),
  officialWhatsappPhone: z.string().trim().min(6).optional(),
  proofFileName: z.string().trim().min(1),
  proofFileType: z.string().trim().min(1).max(100),
  proofFileSize: z.number().int().positive().max(2_000_000),
  proofFileDataUrl: z.string().trim().min(1).max(3_000_000),
  proofNote: z.string().trim().min(10),
});

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Please sign in before submitting a school claim.' }, { status: 401 });
  }

  if (user.userRole === 'platform_admin') {
    return NextResponse.json({ ok: false, message: 'Platform admin accounts cannot submit school claims.' }, { status: 403 });
  }

  if (user.schoolId) {
    return NextResponse.json({ ok: false, message: 'This account is already linked to a school. Use a separate account if you need to claim a different school.' }, { status: 409 });
  }

  const payload = schoolClaimSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Please complete the school claim form before submitting.', issues: payload.error.flatten() }, { status: 400 });
  }

  if (!isValidPhoneNumber(payload.data.officialPhone)) {
    return NextResponse.json({ ok: false, message: 'Enter a real official phone number using digits, e.g. +234 803 123 4567.' }, { status: 400 });
  }

  if (payload.data.officialWhatsappPhone && !isValidPhoneNumber(payload.data.officialWhatsappPhone)) {
    return NextResponse.json({ ok: false, message: 'Enter a real WhatsApp phone number using digits, e.g. +234 803 123 4567.' }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');
  const claimId = makeEntityId('school_claim');

  const result = await db.transaction(async (tx) => {
    if (payload.data.claimType === 'existing_school') {
      if (!payload.data.schoolId) {
        return NextResponse.json({ ok: false, message: 'Select a school to claim.' }, { status: 400 });
      }

      const [school] = await tx
        .select({ id: schools.id, name: schools.name, area: schools.area, address: schools.address, status: schools.status })
        .from(schools)
        .where(eq(schools.id, payload.data.schoolId))
        .limit(1);

      if (!school) {
        return NextResponse.json({ ok: false, message: 'The selected school was not found.' }, { status: 404 });
      }

      if (school.status !== 'unclaimed') {
        return NextResponse.json({ ok: false, message: 'Only unclaimed directory schools can be claimed from this page.' }, { status: 409 });
      }

      const existingSchoolClaims = await tx
        .select({ id: schoolClaims.id, status: schoolClaims.status, applicantUserId: schoolClaims.applicantUserId })
        .from(schoolClaims)
        .where(eq(schoolClaims.schoolId, school.id))
        .orderBy(desc(schoolClaims.createdAt))
        .limit(50);

      const blockingClaim = existingSchoolClaims.find((claim) => claim.status !== 'rejected');

      if (blockingClaim) {
        return NextResponse.json({ ok: false, message: 'That school already has a submitted claim under review or approved.' }, { status: 409 });
      }

      const applicantAttempts = existingSchoolClaims.filter((claim) => claim.applicantUserId === user.userId).length;

      if (applicantAttempts >= MAX_SCHOOL_CLAIM_APPEALS) {
        return NextResponse.json({ ok: false, message: supportMessage(school.name) }, { status: 429 });
      }

      await tx.insert(schoolClaims).values({
        id: claimId,
        schoolId: school.id,
        requestedSchoolName: school.name,
        requestedArea: school.area ?? payload.data.requestedArea,
        requestedAddress: school.address ?? payload.data.requestedAddress,
        applicantUserId: user.userId,
        applicantName: user.userName,
        applicantEmail: user.userEmail,
        officialContactName: payload.data.officialContactName,
        officialEmail: payload.data.officialEmail.toLowerCase(),
        officialPhone: payload.data.officialPhone,
        officialWhatsappPhone: payload.data.officialWhatsappPhone ?? payload.data.officialPhone,
        proofFileName: payload.data.proofFileName,
        proofFileType: payload.data.proofFileType,
        proofFileSize: payload.data.proofFileSize,
        proofFileDataUrl: payload.data.proofFileDataUrl,
        proofNote: payload.data.proofNote,
        type: 'existing_school',
        status: 'pending',
        adminNote: null,
      });
    } else {
      const existingClaims = await tx
        .select({ id: schoolClaims.id, status: schoolClaims.status, requestedSchoolName: schoolClaims.requestedSchoolName })
        .from(schoolClaims)
        .where(and(eq(schoolClaims.applicantUserId, user.userId), eq(schoolClaims.type, 'new_school')))
        .orderBy(desc(schoolClaims.createdAt))
        .limit(20);

      const normalizedRequestedName = normalizeSearchText(payload.data.requestedSchoolName);
      const sameSchoolAttempts = existingClaims.filter((claim) => normalizeSearchText(claim.requestedSchoolName) === normalizedRequestedName);

      if (sameSchoolAttempts.length >= MAX_SCHOOL_CLAIM_APPEALS) {
        return NextResponse.json({ ok: false, message: supportMessage(payload.data.requestedSchoolName) }, { status: 429 });
      }

      const duplicatePending = sameSchoolAttempts.some((claim) => claim.status !== 'rejected');

      if (duplicatePending) {
        return NextResponse.json({ ok: false, message: 'You already submitted a request for this school name.' }, { status: 409 });
      }

      await tx.insert(schoolClaims).values({
        id: claimId,
        schoolId: null,
        requestedSchoolName: payload.data.requestedSchoolName,
        requestedArea: payload.data.requestedArea,
        requestedAddress: payload.data.requestedAddress,
        applicantUserId: user.userId,
        applicantName: user.userName,
        applicantEmail: user.userEmail,
        officialContactName: payload.data.officialContactName,
        officialEmail: payload.data.officialEmail.toLowerCase(),
        officialPhone: payload.data.officialPhone,
        officialWhatsappPhone: payload.data.officialWhatsappPhone ?? payload.data.officialPhone,
        proofFileName: payload.data.proofFileName,
        proofFileType: payload.data.proofFileType,
        proofFileSize: payload.data.proofFileSize,
        proofFileDataUrl: payload.data.proofFileDataUrl,
        proofNote: payload.data.proofNote,
        type: 'new_school',
        status: 'pending',
        adminNote: null,
      });
    }

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: user.userId,
      actorSchoolId: user.schoolId,
      action: 'school_claim_submitted',
      entityType: 'school_claim',
      entityId: claimId,
      metadataJson: {
        claimType: payload.data.claimType,
        schoolId: payload.data.schoolId ?? null,
        requestedSchoolName: payload.data.requestedSchoolName,
        requestedArea: payload.data.requestedArea,
        requestedAddress: payload.data.requestedAddress,
        officialContactName: payload.data.officialContactName,
        officialEmail: payload.data.officialEmail,
        officialPhone: payload.data.officialPhone,
        officialWhatsappPhone: payload.data.officialWhatsappPhone ?? payload.data.officialPhone,
        proofFileName: payload.data.proofFileName,
        proofFileType: payload.data.proofFileType,
        proofFileSize: payload.data.proofFileSize,
      },
      ipAddress,
    });

    return NextResponse.json({ ok: true, claimId, status: 'pending' as const });
  });

  return result;
}
