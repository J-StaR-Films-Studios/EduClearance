import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getSafeInternalPath } from '@/lib/local-session';

export async function GET(request: NextRequest) {
  const redirectPath = getSafeInternalPath(request.nextUrl.searchParams.get('redirect'), '/dashboard');
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', redirectPath);

  return NextResponse.redirect(loginUrl);
}
