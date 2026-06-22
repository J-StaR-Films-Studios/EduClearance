import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { cookies } from 'next/headers';
import { and, eq, gt } from 'drizzle-orm';

import { db } from '@/db/client';
import { schools, userSessions, users } from '@/db/schema';
import { makeEntityId } from '@/lib/ids';

export const AUTH_SESSION_COOKIE = 'ec_session';
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url');
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false,
    path: '/',
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
  };
}

export async function createUserSession(userId: string) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + AUTH_SESSION_MAX_AGE_SECONDS * 1000);

  await db.insert(userSessions).values({
    id: makeEntityId('session'),
    userId,
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function destroyCurrentUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) {
    return;
  }

  await db.delete(userSessions).where(eq(userSessions.tokenHash, hashSessionToken(token)));
}

export type AuthenticatedUser = {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'platform_admin' | 'school_owner' | 'school_admin' | 'school_staff';
  schoolId: string | null;
  schoolName: string | null;
  schoolStatus: 'unclaimed' | 'pending' | 'active' | 'suspended' | null;
  sessionId: string;
  expiresAt: Date;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const [session] = await db
    .select({
      sessionId: userSessions.id,
      expiresAt: userSessions.expiresAt,
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      schoolId: users.schoolId,
      schoolName: schools.name,
      schoolStatus: schools.status,
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .leftJoin(schools, eq(users.schoolId, schools.id))
    .where(and(eq(userSessions.tokenHash, hashSessionToken(token)), gt(userSessions.expiresAt, new Date())))
    .limit(1);

  return session ?? null;
}
