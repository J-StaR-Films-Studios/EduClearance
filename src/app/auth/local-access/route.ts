import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { LOCAL_SESSION_COOKIE, getSafeInternalPath, sessionRoles, type SessionRole } from '@/lib/local-session';

function isAllowedRole(value: string | null): value is SessionRole {
  return sessionRoles.includes(value as SessionRole);
}

function getSafeRedirect(redirect: string | null, role: SessionRole) {
  return getSafeInternalPath(redirect, role === 'platform_admin' ? '/admin' : '/dashboard');
}

export async function GET(request: NextRequest) {
  const roleParam = request.nextUrl.searchParams.get('role');
  const role: SessionRole = isAllowedRole(roleParam) ? roleParam : 'school_admin';
  const redirectPath = getSafeRedirect(request.nextUrl.searchParams.get('redirect'), role);
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  response.cookies.set(LOCAL_SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
