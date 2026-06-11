import { cookies } from 'next/headers';

export const DEMO_SESSION_COOKIE = 'ec_demo_role';

export const demoSessionRoles = ['school_owner', 'school_admin', 'school_staff', 'platform_admin'] as const;
export const demoSchoolSessionRoles = ['school_owner', 'school_admin', 'school_staff'] as const;

export type DemoSessionRole = (typeof demoSessionRoles)[number];
export type DemoSchoolSessionRole = (typeof demoSchoolSessionRoles)[number];

function isDemoSessionRole(value: string | null | undefined): value is DemoSessionRole {
  return demoSessionRoles.includes(value as DemoSessionRole);
}

function isDemoSchoolSessionRole(value: string | null | undefined): value is DemoSchoolSessionRole {
  return demoSchoolSessionRoles.includes(value as DemoSchoolSessionRole);
}

export function getSafeInternalPath(redirect: string | null | undefined, fallback = '/dashboard') {
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect;
  }

  return fallback;
}

export function buildDemoLoginHref(role: DemoSessionRole, redirect = '/dashboard') {
  const redirectPath = getSafeInternalPath(redirect);
  const params = new URLSearchParams({ role, redirect: redirectPath });
  return `/auth/demo-login?${params.toString()}`;
}

export function buildSchoolLoginPageHref(redirect = '/dashboard') {
  const redirectPath = getSafeInternalPath(redirect);
  const params = new URLSearchParams({ redirect: redirectPath });
  return `/login?${params.toString()}`;
}

export async function getDemoSessionRole() {
  const cookieStore = await cookies();
  const value = cookieStore.get(DEMO_SESSION_COOKIE)?.value;

  return isDemoSessionRole(value) ? value : null;
}

export async function getSchoolSessionRole() {
  const role = await getDemoSessionRole();
  return isDemoSchoolSessionRole(role) ? role : null;
}

export async function isPlatformAdminSession() {
  return (await getDemoSessionRole()) === 'platform_admin';
}
