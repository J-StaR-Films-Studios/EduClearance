import { asc } from 'drizzle-orm';

import { ClaimSchoolFlow } from '@/components/public/claim-school-flow';
import { db } from '@/db/client';
import { schools } from '@/db/schema';
import { APP_NAME } from '@/lib/site';
import { noIndexMetadata } from '@/lib/seo';

export const metadata = noIndexMetadata(`Claim / Register School | ${APP_NAME}`, 'Claim an existing school directory profile or request a new school listing.');

export default async function ClaimSchoolPage() {
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
    <main className="min-h-screen bg-background px-4 py-10 text-navy-800">
      <ClaimSchoolFlow
        directorySchools={directorySchools.map((school) => ({
          id: school.id,
          name: school.name,
          location: school.area || school.address || 'Location pending verification',
          status: school.status,
        }))}
      />
    </main>
  );
}
