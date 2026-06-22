import { NextResponse } from 'next/server';

import { destroyCurrentUserSession, getAuthCookieOptions } from '@/lib/auth-session';
import { clearAuthCookies } from '@/lib/local-session';

export const runtime = 'nodejs';

export async function POST() {
  await destroyCurrentUserSession();
  await clearAuthCookies();

  const response = NextResponse.json({ ok: true });
  response.cookies.set('ec_session', '', { ...getAuthCookieOptions(), maxAge: 0 });
  response.cookies.set('ec_local_role', '', { path: '/', maxAge: 0 });

  return response;
}
