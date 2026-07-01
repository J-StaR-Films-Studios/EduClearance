import { asc } from 'drizzle-orm';

import { ClaimSchoolFlow } from '@/components/public/claim-school-flow';
import { db } from '@/db/client';
import { schools } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/auth-session';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Claim / Register School | ${APP_NAME}`, 'Claim an existing school directory profile or request a new school listing.');

export default async function ClaimSchoolPage() {
  const [directorySchools, currentUser] = await Promise.all([
    db
      .select({
        id: schools.id,
        name: schools.name,
        area: schools.area,
        address: schools.address,
        status: schools.status,
      })
      .from(schools)
      .orderBy(asc(schools.name))
      .limit(250),
    getAuthenticatedUser(),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8 text-navy-800">
      <ClaimSchoolFlow
        currentUser={currentUser ? { name: currentUser.userName, email: currentUser.userEmail, role: currentUser.userRole } : null}
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
