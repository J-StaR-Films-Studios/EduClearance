import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { auditLogs, clearanceRequests } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';
import { resolveLocalSchoolActor } from '@/lib/local-actor';

const responseSchema = z.object({
  clearanceRequestId: z.string().trim().min(1),
  response: z.enum(['no_outstanding_issue']),
});

export async function POST(request: Request) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    return NextResponse.json({ ok: false, message: 'Please sign in with an active school account.' }, { status: 401 });
  }

  const payload = responseSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Invalid clearance response.', issues: payload.error.flatten() }, { status: 400 });
  }

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? request.headers.get('x-real-ip');

  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(clearanceRequests)
      .set({
        status: 'cleared_by_previous_school',
        searchResult: 'no_match',
        notificationStatus: 'dashboard',
        updatedAt: new Date(),
      })
      .where(and(eq(clearanceRequests.id, payload.data.clearanceRequestId), eq(clearanceRequests.previousSchoolId, actor.schoolId)))
      .returning({ id: clearanceRequests.id });

    if (!updated) {
      return null;
    }

    await tx.insert(auditLogs).values({
      id: makeEntityId('audit'),
      actorUserId: actor.userId,
      actorSchoolId: actor.schoolId,
      action: 'clearance_no_outstanding_issue_confirmed',
      entityType: 'clearance_request',
      entityId: updated.id,
      metadataJson: { response: payload.data.response },
      ipAddress,
    });

    return updated;
  });

  if (!result) {
    return NextResponse.json({ ok: false, message: 'Clearance request was not found for your school.' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, clearanceRequestId: result.id });
}
