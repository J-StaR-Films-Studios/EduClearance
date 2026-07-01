import 'server-only';

import { getAuthenticatedUser } from '@/lib/auth-session';
import { type SchoolSessionRole, type SessionRole } from '@/lib/local-session';

export type LocalSchoolActor = {
  sessionRole: SchoolSessionRole;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  schoolId: string;
  schoolName: string;
  schoolStatus: string;
};

export type LocalActor =
  | LocalSchoolActor
  | {
      sessionRole: SessionRole;
      userId: string;
      userName: string;
      userEmail: string;
      userRole: string;
      schoolId: null;
      schoolName: null;
      schoolStatus: null;
    };

export async function resolveLocalSchoolActor(): Promise<LocalSchoolActor | null> {
  const user = await getAuthenticatedUser();

  if (!user || user.userRole === 'platform_admin' || !user.schoolId || !user.schoolName || !user.schoolStatus) {
    return null;
  }

  return {
    sessionRole: user.userRole,
    userId: user.userId,
    userName: user.userName,
    userEmail: user.userEmail,
    userRole: user.userRole,
    schoolId: user.schoolId,
    schoolName: user.schoolName,
    schoolStatus: user.schoolStatus,
  };
}

export function isActiveSchoolActor(actor: LocalActor | LocalSchoolActor | null): actor is LocalSchoolActor {
  return Boolean(actor && actor.schoolStatus === 'active' && actor.schoolId);
}

export function canManageSchoolWallet(actor: LocalActor | LocalSchoolActor | null): actor is LocalSchoolActor {
  return Boolean(isActiveSchoolActor(actor) && (actor.sessionRole === 'school_owner' || actor.sessionRole === 'school_admin'));
}

export function isPlatformAdminActor(actor: LocalActor | null) {
  return actor?.sessionRole === 'platform_admin';
}

export function canVerifyPaymentForSchool(actor: LocalActor | null, schoolId: string) {
  return isPlatformAdminActor(actor) || (canManageSchoolWallet(actor) && actor.schoolId === schoolId);
}

export async function resolveOptionalLocalActor(): Promise<LocalActor | null> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  if (user.userRole === 'platform_admin') {
    return {
      sessionRole: user.userRole,
      userId: user.userId,
      userName: user.userName,
      userEmail: user.userEmail,
      userRole: user.userRole,
      schoolId: null,
      schoolName: null,
      schoolStatus: null,
    };
  }

  return resolveLocalSchoolActor();
}
