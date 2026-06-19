import { cookies } from 'next/headers';

export const LOCAL_SESSION_COOKIE = 'ec_local_role';

export const sessionRoles = ['school_owner', 'school_admin', 'school_staff', 'platform_admin'] as const;
export const schoolSessionRoles = ['school_owner', 'school_admin', 'school_staff'] as const;

export type SessionRole = (typeof sessionRoles)[number];
export type SchoolSessionRole = (typeof schoolSessionRoles)[number];

function isSessionRole(value: string | null | undefined): value is SessionRole {
  return sessionRoles.includes(value as SessionRole);
}

function isSchoolSessionRole(value: string | null | undefined): value is SchoolSessionRole {
  return schoolSessionRoles.includes(value as SchoolSessionRole);
}

export function getSafeInternalPath(redirect: string | null | undefined, fallback = '/dashboard') {
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }

  return fallback;
}

export function buildLocalAccessHref(role: SessionRole, redirect = '/dashboard') {
  const redirectPath = getSafeInternalPath(redirect);
  const params = new URLSearchParams({ role, redirect: redirectPath });
  return `/auth/local-access?${params.toString()}`;
}

export function buildSchoolLoginPageHref(redirect = '/dashboard') {
  const redirectPath = getSafeInternalPath(redirect);
  const params = new URLSearchParams({ redirect: redirectPath });
  return `/login?${params.toString()}`;
}

export async function getLocalSessionRole() {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCAL_SESSION_COOKIE)?.value;

  return isSessionRole(value) ? value : null;
}

export async function getSchoolSessionRole() {
  const role = await getLocalSessionRole();
  return isSchoolSessionRole(role) ? role : null;
}

export async function isPlatformAdminSession() {
  return (await getLocalSessionRole()) === 'platform_admin';
}
