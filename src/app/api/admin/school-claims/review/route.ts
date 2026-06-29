import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, schoolClaims, schools, users } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveOptionalLocalActor } from '@/lib/local-actor';
import { slugify } from '@/lib/text';

export const runtime = 'nodejs';

const reviewSchema = z.object({
  claimId: z.string().trim().min(1),
  action: z.enum(['approve', 'reject']),
  adminNote: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const actor = await resolveOptionalLocalActor();

  if (!actor || actor.sessionRole !== 'platform_admin') {
    return NextResponse.json({ ok: false, message: 'Platform admin access required.' }, { status: 403 });
  }

  const payload = reviewSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid claim review action.', issues: payload.error.flatten() }, { status: 400 });
  }

  const reviewedAt = new Date();
  const adminNote = payload.data.adminNote?.trim() || null;
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const response = await db.transaction(async (tx) => {
    const [claim] = await tx
      .select({
        id: schoolClaims.id,
        schoolId: schoolClaims.schoolId,
        requestedSchoolName: schoolClaims.requestedSchoolName,
        requestedArea: schoolClaims.requestedArea,
        requestedAddress: schoolClaims.requestedAddress,
        applicantUserId: schoolClaims.applicantUserId,
        officialContactName: schoolClaims.officialContactName,
        officialEmail: schoolClaims.officialEmail,
        officialPhone: schoolClaims.officialPhone,
        type: schoolClaims.type,
        status: schoolClaims.status,
      })
      .from(schoolClaims)
      .where(eq(schoolClaims.id, payload.data.claimId))
      .limit(1);

    if (!claim) {
      return NextResponse.json({ ok: false, message: 'The requested claim was not found.' }, { status: 404 });
    }

    const canApprove = claim.status === 'pending' || claim.status === 'rejected';
    const canReject = claim.status === 'pending';

    if (payload.data.action === 'approve' && !canApprove) {
      return NextResponse.json({ ok: false, message: 'Only pending or rejected claims can be approved from this action.' }, { status: 409 });
    }

    if (payload.data.action === 'reject' && !canReject) {
      return NextResponse.json({ ok: false, message: 'Only pending claims can be rejected from this action.' }, { status: 409 });
    }

    if (payload.data.action === 'reject') {
      await tx.update(schoolClaims).set({ status: 'rejected', adminNote: adminNote ?? 'Claim rejected by platform admin.', reviewedAt }).where(eq(schoolClaims.id, claim.id));

      await tx.insert(auditLogs).values({
        id: makeEntityId('audit'),
        actorUserId: actor.userId,
        actorSchoolId: null,
        action: 'school_claim_rejected',
        entityType: 'school_claim',
        entityId: claim.id,
        metadataJson: {
          claimType: claim.type,
          schoolId: claim.schoolId,
          requestedSchoolName: claim.requestedSchoolName,
          adminNote: adminNote ?? 'Claim rejected by platform admin.',
        },
        ipAddress,
      });

      return NextResponse.json({ ok: true, claimId: claim.id, status: 'rejected' as const });
    }

    const schoolStatus = claim.type === 'new_school' ? 'pending' : 'active';
    let schoolId = claim.schoolId;

    if (claim.type === 'existing_school') {
      if (!claim.schoolId) {
        return NextResponse.json({ ok: false, message: 'Existing school claims must reference a directory school.' }, { status: 400 });
      }

      const [school] = await tx
        .select({ id: schools.id })
        .from(schools)
        .where(eq(schools.id, claim.schoolId))
        .limit(1);

      if (!school) {
        return NextResponse.json({ ok: false, message: 'The linked school record was not found.' }, { status: 404 });
      }

      schoolId = school.id;

      await tx.update(schools).set({
        status: 'active',
        clearancePhone: claim.officialPhone,
        contactEmail: claim.officialEmail,
        contactPerson: claim.officialContactName,
        updatedAt: reviewedAt,
      }).where(eq(schools.id, school.id));
    } else {
      const createdSchoolId = makeEntityId('school');
      const slugBase = slugify(claim.requestedSchoolName) || 'school';

      schoolId = createdSchoolId;

      await tx.insert(schools).values({
        id: createdSchoolId,
        name: claim.requestedSchoolName,
        slug: `${slugBase}-${claim.id.slice(-8)}`,
        address: claim.requestedAddress,
        area: claim.requestedArea,
        mainPhone: null,
        clearancePhone: claim.officialPhone,
        contactEmail: claim.officialEmail,
        contactPerson: claim.officialContactName,
        logoUrl: null,
        status: schoolStatus,
        createdAt: reviewedAt,
        updatedAt: reviewedAt,
      });
    }

    if (claim.applicantUserId) {
      await tx.update(users).set({ schoolId }).where(eq(users.id, claim.applicantUserId));
    }

    await tx.update(schoolClaims).set({
      schoolId,
      status: 'approved',
      adminNote: adminNote ?? null,
      reviewedAt,
    }).where(eq(schoolClaims.id, claim.id));

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: null,
      action: 'school_claim_approved',
      entityType: 'school_claim',
      entityId: claim.id,
      metadataJson: {
        claimType: claim.type,
        schoolId,
        schoolStatus,
        requestedSchoolName: claim.requestedSchoolName,
        requestedArea: claim.requestedArea,
        requestedAddress: claim.requestedAddress,
        adminNote,
      },
      ipAddress,
    });

    return NextResponse.json({ ok: true, claimId: claim.id, status: 'approved' as const, schoolId, schoolStatus });
  });

  return response;
}
