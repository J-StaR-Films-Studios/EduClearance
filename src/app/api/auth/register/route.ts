import { NextResponse } from 'next/server';
import { isNotNull, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { users } from '@/db/schema';
import { hashPassword } from '@/lib/auth-password';
import { createUserSession, getAuthCookieOptions } from '@/lib/auth-session';
import { makeEntityId } from '@/lib/ids';
import { getSafeInternalPath } from '@/lib/local-session';
import { normalizePhoneNumber } from '@/lib/text';

export const runtime = 'nodejs';

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().min(6),
  password: z.string().min(8),
  redirect: z.string().optional(),
});

export async function POST(request: Request) {
  const payload = registerSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Enter valid registration details.' }, { status: 400 });
  }

  const email = payload.data.email.toLowerCase();
  const phone = normalizePhoneNumber(payload.data.phone);

  if (phone.length < 10) {
    return NextResponse.json({ ok: false, message: 'Enter a valid contact phone number.' }, { status: 400 });
  }

  const [existingEmailUser] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);

  if (existingEmailUser) {
    return NextResponse.json({ ok: false, message: 'An account already exists for this email.' }, { status: 409 });
  }

  const existingPhoneUsers = await db.select({ id: users.id, phone: users.phone }).from(users).where(isNotNull(users.phone));
  const existingPhoneUser = existingPhoneUsers.find((user) => normalizePhoneNumber(user.phone ?? '') === phone);

  if (existingPhoneUser) {
    return NextResponse.json({ ok: false, message: 'An account already exists for this phone number.' }, { status: 409 });
  }

  const passwordHash = await hashPassword(payload.data.password);
  const userId = makeEntityId('user');

  await db.insert(users).values({
    id: userId,
    schoolId: null,
    name: payload.data.name,
    email,
    phone,
    role: 'school_owner',
    passwordHash,
  });

  const session = await createUserSession(userId);
  const response = NextResponse.json({ ok: true, redirectTo: getSafeInternalPath(payload.data.redirect, '/claim-school') });
  response.cookies.set('ec_session', session.token, getAuthCookieOptions());
  response.cookies.delete('ec_local_role');

  return response;
}
