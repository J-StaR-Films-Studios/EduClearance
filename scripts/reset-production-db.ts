import { existsSync } from 'node:fs';

import { config as loadEnv } from 'dotenv';
import { sql } from 'drizzle-orm';

const envFile = process.env.ENV_FILE || '.env.prod-reset';

if (!existsSync(envFile)) {
  throw new Error(`Env file not found: ${envFile}`);
}

loadEnv({ path: envFile, override: true });
loadEnv();

const CONFIRMATION = 'RESET_EDUCLEARANCE_PRODUCTION';

function required(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function assertResetIsExplicit() {
  const databaseUrl = required('DATABASE_URL');
  const confirmation = process.env.RESET_DATABASE_CONFIRM?.trim();
  const allow = process.env.ALLOW_DESTRUCTIVE_PRODUCTION_RESET === 'true';

  if (!allow || confirmation !== CONFIRMATION) {
    throw new Error(`Refusing to reset database. Set ALLOW_DESTRUCTIVE_PRODUCTION_RESET=true and RESET_DATABASE_CONFIRM=${CONFIRMATION}.`);
  }

  if (/localhost|127\.0\.0\.1/.test(databaseUrl)) {
    throw new Error('This reset script is for remote production/staging databases only. Use pnpm db:seed for local demo resets.');
  }
}

async function main() {
  assertResetIsExplicit();

  const [{ db, connection }, { users }, { hashPassword }, { makeEntityId }] = await Promise.all([
    import('../src/db/client'),
    import('../src/db/schema'),
    import('../src/lib/auth-password'),
    import('../src/lib/ids'),
  ]);

  try {
    await db.execute(sql`
      TRUNCATE TABLE
        "audit_logs",
        "disputes",
        "payments",
        "wallet_transactions",
        "wallets",
        "clearance_issues",
        "clearance_requests",
        "case_timeline_entries",
        "user_sessions",
        "school_claims",
        "users",
        "schools"
      RESTART IDENTITY CASCADE
    `);

    const adminEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.PLATFORM_ADMIN_PASSWORD?.trim();
    const adminName = process.env.PLATFORM_ADMIN_NAME?.trim() || 'EduClearance Admin';

    if (adminEmail && adminPassword) {
      if (adminPassword.length < 12) {
        throw new Error('PLATFORM_ADMIN_PASSWORD must be at least 12 characters.');
      }

      await db.insert(users).values({
        id: makeEntityId('user'),
        schoolId: null,
        name: adminName,
        email: adminEmail,
        phone: process.env.PLATFORM_ADMIN_PHONE?.trim() || null,
        role: 'platform_admin',
        passwordHash: await hashPassword(adminPassword),
      });

      console.log(`Database reset complete. Platform admin created: ${adminEmail}`);
    } else {
      console.log('Database reset complete. No admin created because PLATFORM_ADMIN_EMAIL/PASSWORD were not provided.');
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
