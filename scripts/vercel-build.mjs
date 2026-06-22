#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const truthy = new Set(['1', 'true', 'yes', 'on']);
const shouldRunMigrations = truthy.has(String(process.env.RUN_DB_MIGRATIONS ?? '').toLowerCase());
const npmExecPath = process.env.npm_execpath;

function run(label, command, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runPackageManager(label, args) {
  if (npmExecPath) {
    run(label, process.execPath, [npmExecPath, ...args]);
    return;
  }

  run(label, 'pnpm', args);
}

console.log('Vercel build bootstrap');
console.log(`VERCEL_ENV=${process.env.VERCEL_ENV ?? 'not set'}`);
console.log(`RUN_DB_MIGRATIONS=${process.env.RUN_DB_MIGRATIONS ?? 'not set'}`);

if (shouldRunMigrations) {
  if (!process.env.DATABASE_URL) {
    console.error('RUN_DB_MIGRATIONS is enabled, but DATABASE_URL is not set. Refusing to deploy without a database target.');
    process.exit(1);
  }

  runPackageManager('Running database migrations', ['run', 'db:migrate']);
} else {
  console.log('Skipping database migrations. Set RUN_DB_MIGRATIONS=true in the target Vercel environment to enable them.');
}

runPackageManager('Building Next.js app', ['exec', 'next', 'build']);
