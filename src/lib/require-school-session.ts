import { redirect } from 'next/navigation';

import { buildSchoolLoginPageHref, getSchoolSessionRole } from '@/lib/demo-session';

export async function requireSchoolSession(redirectPath: string) {
  const role = await getSchoolSessionRole();

  if (!role) {
    redirect(buildSchoolLoginPageHref(redirectPath));
  }

  return role;
}
