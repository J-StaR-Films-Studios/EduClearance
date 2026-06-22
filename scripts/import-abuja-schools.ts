import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { config as loadEnv } from 'dotenv';

const envArg = process.argv.find((arg) => arg.startsWith('--env='));
const envPath = envArg?.split('=')[1];

if (envPath) {
  loadEnv({ path: envPath, override: true });
} else {
  loadEnv({ path: '.env.local' });
  loadEnv();
}

type AbujaDirectorySeed = {
  schools: Array<{
    name: string;
    slug: string;
    area: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    source: string;
  }>;
};

const verificationEmail = (slug: string) => `verification+${slug}@educlearance.local`;

function schoolAddress(school: AbujaDirectorySeed['schools'][number]) {
  return school.latitude && school.longitude
    ? `${school.address}; source: ${school.source}; coordinates: ${school.latitude}, ${school.longitude}`
    : `${school.address}; source: ${school.source}`;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Use --env=.env.production.local or set DATABASE_URL before running.');
  }

  const { db, connection } = await import('../src/db/client');
  const { schools } = await import('../src/db/schema');

  const seed = JSON.parse(readFileSync('src/db/seed-data/abuja-osm-schools.json', 'utf8')) as AbujaDirectorySeed;
  const rows = seed.schools
    .filter((school) => !['wuse-local-academy', 'garki-local-college', 'lugbe-local-preparatory-school'].includes(school.slug))
    .map((school) => ({
      id: randomUUID(),
      name: school.name,
      slug: school.slug,
      address: schoolAddress(school),
      area: school.area,
      mainPhone: null,
      clearancePhone: null,
      contactEmail: verificationEmail(school.slug),
      contactPerson: null,
      logoUrl: null,
      status: school.slug === 'whiteplains-british-school-abuja' ? ('pending' as const) : ('unclaimed' as const),
    }));

  let inserted = 0;

  try {
    for (const row of rows) {
      const result = await db.insert(schools).values(row).onConflictDoNothing({ target: schools.slug }).returning({ id: schools.id });
      if (result.length > 0) {
        inserted += 1;
      }
    }
  } finally {
    await connection.end();
  }

  console.log(`Abuja directory import complete. Candidates: ${rows.length}. Inserted: ${inserted}. Existing/skipped: ${rows.length - inserted}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
