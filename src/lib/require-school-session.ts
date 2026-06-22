import { redirect } from 'next/navigation';

import { resolveLocalSchoolActor } from '@/lib/local-actor';
import { buildSchoolLoginPageHref } from '@/lib/local-session';

export async function requireSchoolSession(redirectPath: string) {
  const actor = await resolveLocalSchoolActor();

  if (!actor) {
    redirect(buildSchoolLoginPageHref(redirectPath));
  }

  if (actor.schoolStatus !== 'active') {
    redirect('/claim-school');
  }

  return actor.sessionRole;
}
