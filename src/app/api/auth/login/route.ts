import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db/client';
import { schoolClaims, users } from '@/db/schema';
import { createUserSession, getAuthCookieOptions } from '@/lib/auth-session';
import { verifyPassword } from '@/lib/auth-password';
import { getSafeInternalPath } from '@/lib/local-session';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  redirect: z.string().optional(),
  audience: z.enum(['school', 'admin']).default('school'),
});

export async function POST(request: Request) {
  const payload = loginSchema.safeParse(await request.json().catch(() => null));

  if (!payload.success) {
    return NextResponse.json({ ok: false, message: 'Enter a valid email and password.' }, { status: 400 });
  }

  const email = payload.data.email.toLowerCase();
  const [user] = await db
    .select({ id: users.id, role: users.role, passwordHash: users.passwordHash, schoolId: users.schoolId })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);

  if (!user || !(await verifyPassword(payload.data.password, user.passwordHash))) {
    return NextResponse.json({ ok: false, message: 'Invalid email or password.' }, { status: 401 });
  }

  if (payload.data.audience === 'admin' && user.role !== 'platform_admin') {
    return NextResponse.json({ ok: false, message: 'Platform admin access is required.' }, { status: 403 });
  }

  if (payload.data.audience === 'school' && user.role === 'platform_admin') {
    return NextResponse.json({ ok: false, message: 'Use the platform admin sign-in page.' }, { status: 403 });
  }

  let unverifiedFallback = '/claim-school';

  if (user.role !== 'platform_admin' && !user.schoolId) {
    const [pendingClaim] = await db
      .select({ id: schoolClaims.id })
      .from(schoolClaims)
      .where(eq(schoolClaims.applicantUserId, user.id))
      .limit(1);
    unverifiedFallback = pendingClaim ? '/account/pending-verification' : '/claim-school';
  }

  const fallback = user.role === 'platform_admin' ? '/admin' : user.schoolId ? '/dashboard' : unverifiedFallback;
  const redirectTo = user.role !== 'platform_admin' && !user.schoolId ? unverifiedFallback : getSafeInternalPath(payload.data.redirect, fallback);
  const session = await createUserSession(user.id);
  const response = NextResponse.json({ ok: true, redirectTo });

  response.cookies.set('ec_session', session.token, getAuthCookieOptions());
  response.cookies.delete('ec_local_role');

  return response;
}
