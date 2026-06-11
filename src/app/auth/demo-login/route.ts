import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { DEMO_SESSION_COOKIE, demoSessionRoles, getSafeInternalPath, type DemoSessionRole } from '@/lib/demo-session';

function isAllowedRole(value: string | null): value is DemoSessionRole {
  return demoSessionRoles.includes(value as DemoSessionRole);
}

function getSafeRedirect(redirect: string | null, role: DemoSessionRole) {
  return getSafeInternalPath(redirect, role === 'platform_admin' ? '/admin' : '/dashboard');
}

export async function GET(request: NextRequest) {
  const roleParam = request.nextUrl.searchParams.get('role');
  const role: DemoSessionRole = isAllowedRole(roleParam) ? roleParam : 'school_admin';
  const redirectPath = getSafeRedirect(request.nextUrl.searchParams.get('redirect'), role);
  const response = NextResponse.redirect(new URL(redirectPath, request.url));

  response.cookies.set(DEMO_SESSION_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
