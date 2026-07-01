import { existsSync } from 'node:fs';

import { config as loadEnv } from 'dotenv';
import { sql } from 'drizzle-orm';

const envFile = process.env.ENV_FILE || '.env.local';

if (!existsSync(envFile)) {
  throw new Error(`Env file not found: ${envFile}`);
}

loadEnv({ path: envFile, override: true });
loadEnv();

function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function databaseTargetLabel() {
  const databaseUrl = required('DATABASE_URL');

  try {
    const parsed = new URL(databaseUrl);
    return `${parsed.hostname}${parsed.pathname}`;
  } catch {
    return '<unparseable DATABASE_URL>';
  }
}

async function main() {
  const target = databaseTargetLabel();
  const name = required('PLATFORM_ADMIN_NAME');
  const email = required('PLATFORM_ADMIN_EMAIL').toLowerCase();
  const password = required('PLATFORM_ADMIN_PASSWORD');

  if (password.length < 12) {
    throw new Error('PLATFORM_ADMIN_PASSWORD must be at least 12 characters.');
  }

  const [{ db, connection }, { users }, { hashPassword }, { makeEntityId }] = await Promise.all([
    import('../src/db/client'),
    import('../src/db/schema'),
    import('../src/lib/auth-password'),
    import('../src/lib/ids'),
  ]);

  const passwordHash = await hashPassword(password);
  const phone = process.env.PLATFORM_ADMIN_PHONE?.trim() || null;

  try {
    await db
      .insert(users)
      .values({
        id: makeEntityId('user'),
        schoolId: null,
        name,
        email,
        phone,
        role: 'platform_admin',
        passwordHash,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name,
          phone,
          role: sql`'platform_admin'::user_role`,
          schoolId: null,
          passwordHash,
        },
      });

    console.log(`Platform admin ready: ${email}`);
    console.log(`Database target: ${target}`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
