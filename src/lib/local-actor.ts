import 'server-only';

import { asc, eq, inArray, and } from 'drizzle-orm';

import { db } from '@/db/client';
import { schools, users } from '@/db/schema';
import { getLocalSessionRole, getSchoolSessionRole, schoolSessionRoles, type SchoolSessionRole, type SessionRole } from '@/lib/local-session';

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

const actorSelection = {
  userId: users.id,
  userName: users.name,
  userEmail: users.email,
  userRole: users.role,
  schoolId: schools.id,
  schoolName: schools.name,
  schoolStatus: schools.status,
};

export async function resolveLocalSchoolActor(): Promise<LocalSchoolActor | null> {
  const sessionRole = await getSchoolSessionRole();

  if (!sessionRole) {
    return null;
  }

  const [matchingRole] = await db
    .select(actorSelection)
    .from(users)
    .innerJoin(schools, eq(users.schoolId, schools.id))
    .where(and(eq(users.role, sessionRole), eq(schools.status, 'active')))
    .orderBy(asc(schools.createdAt), asc(users.createdAt))
    .limit(1);

  const actor = matchingRole ?? (await resolveAnyActiveSchoolUser());

  if (!actor) {
    return null;
  }

  return {
    sessionRole,
    userId: actor.userId,
    userName: actor.userName,
    userEmail: actor.userEmail,
    userRole: actor.userRole,
    schoolId: actor.schoolId,
    schoolName: actor.schoolName,
    schoolStatus: actor.schoolStatus,
  };
}

export function canManageSchoolWallet(actor: LocalActor | LocalSchoolActor | null): actor is LocalSchoolActor {
  return Boolean(actor && (actor.sessionRole === 'school_owner' || actor.sessionRole === 'school_admin'));
}

export function isPlatformAdminActor(actor: LocalActor | null) {
  return actor?.sessionRole === 'platform_admin';
}

export function canVerifyPaymentForSchool(actor: LocalActor | null, schoolId: string) {
  return isPlatformAdminActor(actor) || (canManageSchoolWallet(actor) && actor.schoolId === schoolId);
}

export async function resolveOptionalLocalActor(): Promise<LocalActor | null> {
  const role = await getLocalSessionRole();

  if (!role) {
    return null;
  }

  if (role !== 'platform_admin') {
    return resolveLocalSchoolActor();
  }

  const [admin] = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
    })
    .from(users)
    .where(eq(users.role, 'platform_admin'))
    .orderBy(asc(users.createdAt))
    .limit(1);

  if (!admin) {
    return null;
  }

  return {
    sessionRole: role,
    userId: admin.userId,
    userName: admin.userName,
    userEmail: admin.userEmail,
    userRole: admin.userRole,
    schoolId: null,
    schoolName: null,
    schoolStatus: null,
  };
}

async function resolveAnyActiveSchoolUser() {
  const [actor] = await db
    .select(actorSelection)
    .from(users)
    .innerJoin(schools, eq(users.schoolId, schools.id))
    .where(and(inArray(users.role, [...schoolSessionRoles]), eq(schools.status, 'active')))
    .orderBy(asc(schools.createdAt), asc(users.createdAt))
    .limit(1);

  return actor ?? null;
}
