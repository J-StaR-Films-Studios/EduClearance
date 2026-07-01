import { asc, desc, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

import { ClaimSchoolFlow } from '@/components/public/claim-school-flow';
import { db } from '@/db/client';
import { schoolClaims, schools } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/auth-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Claim / Register School | ${APP_NAME}`, 'Claim an existing school directory profile or request a new school listing.');

export default async function ClaimSchoolPage() {
  const currentUser = await getAuthenticatedUser();

  if (currentUser?.userRole === 'platform_admin') {
    redirect('/admin');
  }

  if (currentUser?.schoolId) {
    redirect('/dashboard');
  }

  if (currentUser) {
    const latestClaims = await db
      .select({ status: schoolClaims.status })
      .from(schoolClaims)
      .where(eq(schoolClaims.applicantUserId, currentUser.userId))
      .orderBy(desc(schoolClaims.createdAt))
      .limit(10);

    const hasClaimUnderReview = latestClaims.some((claim) => claim.status !== 'rejected');

    if (hasClaimUnderReview) {
      redirect('/account/pending-verification');
    }
  }

  const directorySchools = await db
    .select({
      id: schools.id,
      name: schools.name,
      area: schools.area,
      address: schools.address,
      status: schools.status,
    })
    .from(schools)
    .orderBy(asc(schools.name))
    .limit(250);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8 text-navy-800">
      <ClaimSchoolFlow
        currentUser={currentUser ? {
          name: currentUser.userName,
          email: currentUser.userEmail,
          role: currentUser.userRole,
          schoolId: currentUser.schoolId,
          schoolName: currentUser.schoolName,
          schoolStatus: currentUser.schoolStatus,
        } : null}
        directorySchools={directorySchools.map((school) => ({
          id: school.id,
          name: school.name,
          location: school.area || school.address || 'Location pending verification',
          area: school.area,
          address: school.address,
          status: school.status,
        }))}
      />
    </main>
  );
}
