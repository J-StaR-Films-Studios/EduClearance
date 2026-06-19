import { cookies } from 'next/headers';

import { AUTH_SESSION_COOKIE, getAuthCookieOptions, getAuthenticatedUser } from '@/lib/auth-session';

export const LEGACY_LOCAL_SESSION_COOKIE = 'ec_local_role';

export const sessionRoles = ['school_owner', 'school_admin', 'school_staff', 'platform_admin'] as const;
export const schoolSessionRoles = ['school_owner', 'school_admin', 'school_staff'] as const;

export type SessionRole = (typeof sessionRoles)[number];
export type SchoolSessionRole = (typeof schoolSessionRoles)[number];

function isSchoolSessionRole(value: string | null | undefined): value is SchoolSessionRole {
  return schoolSessionRoles.includes(value as SchoolSessionRole);
}

export function getSafeInternalPath(redirect: string | null | undefined, fallback = '/dashboard') {
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }

  return fallback;
}

export function buildLoginHref(role: SessionRole = 'school_admin', redirect = '/dashboard') {
  const redirectPath = getSafeInternalPath(redirect, role === 'platform_admin' ? '/admin' : '/dashboard');
  const params = new URLSearchParams({ redirect: redirectPath });

  if (role === 'platform_admin') {
    params.set('role', 'admin');
  }

  return `/login?${params.toString()}`;
}

export const buildLocalAccessHref = buildLoginHref;

export function buildSchoolLoginPageHref(redirect = '/dashboard') {
  const redirectPath = getSafeInternalPath(redirect);
  const params = new URLSearchParams({ redirect: redirectPath });
  return `/login?${params.toString()}`;
}

export async function getLocalSessionRole() {
  const user = await getAuthenticatedUser();
  return user?.userRole ?? null;
}

export async function getSchoolSessionRole() {
  const role = await getLocalSessionRole();
  return isSchoolSessionRole(role) ? role : null;
}

export async function isPlatformAdminSession() {
  return (await getLocalSessionRole()) === 'platform_admin';
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE);
  cookieStore.delete(LEGACY_LOCAL_SESSION_COOKIE);
}

export { AUTH_SESSION_COOKIE, getAuthCookieOptions };
