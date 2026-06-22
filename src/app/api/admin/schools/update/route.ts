import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, schools } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveOptionalLocalActor } from '@/lib/local-actor';

const schoolUpdateSchema = z.object({
  schoolId: z.string().trim().min(1),
  status: z.enum(['unclaimed', 'pending', 'active', 'suspended']).optional(),
  clearancePhone: z.string().trim().optional(),
  contactEmail: z.string().trim().email().optional(),
  contactPerson: z.string().trim().optional(),
  adminNote: z.string().trim().optional(),
});

export async function POST(request: Request) {
  const actor = await resolveOptionalLocalActor();

  if (!actor || actor.sessionRole !== 'platform_admin') {
    return NextResponse.json({ ok: false, message: 'Platform admin access required.' }, { status: 403 });
  }

  const payload = schoolUpdateSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid school update.', issues: payload.error.flatten() }, { status: 400 });
  }

  const updates = {
    ...(payload.data.status ? { status: payload.data.status } : {}),
    ...(payload.data.clearancePhone !== undefined ? { clearancePhone: payload.data.clearancePhone } : {}),
    ...(payload.data.contactEmail !== undefined ? { contactEmail: payload.data.contactEmail } : {}),
    ...(payload.data.contactPerson !== undefined ? { contactPerson: payload.data.contactPerson } : {}),
    updatedAt: new Date(),
  };

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const [updated] = await db.update(schools).set(updates).where(eq(schools.id, payload.data.schoolId)).returning({ id: schools.id, status: schools.status });

  if (!updated) {
    return NextResponse.json({ ok: false, message: 'School was not found.' }, { status: 404 });
  }

  await db.insert(auditLogs).values({
    id: makeEntityId('audit'),
    actorUserId: actor.userId,
    actorSchoolId: null,
    action: 'admin_school_profile_updated',
    entityType: 'school',
    entityId: updated.id,
    metadataJson: {
      status: payload.data.status ?? null,
      clearancePhone: payload.data.clearancePhone ?? null,
      contactEmail: payload.data.contactEmail ?? null,
      contactPerson: payload.data.contactPerson ?? null,
      adminNote: payload.data.adminNote ?? null,
    },
    ipAddress,
  });

  return NextResponse.json({ ok: true, schoolId: updated.id, status: updated.status });
}
