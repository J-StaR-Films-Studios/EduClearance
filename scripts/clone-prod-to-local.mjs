#!/usr/bin/env node
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

import { config as loadEnv } from 'dotenv';

const PROD_ENV_FILE = process.env.PROD_ENV_FILE || '.env.prod-migrate';
const LOCAL_ENV_FILE = process.env.LOCAL_ENV_FILE || '.env.local';
const CONFIRMATION = 'CLONE_PROD_TO_LOCAL';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function loadEnvFile(path) {
  const result = loadEnv({ path, override: false });

  if (result.error) {
    fail(`Unable to load ${path}: ${result.error.message}`);
  }

  return result.parsed ?? {};
}

function parseDatabaseUrl(label, value) {
  if (!value) {
    fail(`${label} DATABASE_URL is missing.`);
  }

  try {
    return new URL(value);
  } catch {
    fail(`${label} DATABASE_URL is not a valid URL.`);
  }
}

function targetLabel(url) {
  return `${url.hostname}${url.pathname}`;
}

function isLocalTarget(url) {
  return ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
}

function run(label, command, args, options = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.error) {
    fail(`${label} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const prodEnv = loadEnvFile(PROD_ENV_FILE);
const localEnv = loadEnvFile(LOCAL_ENV_FILE);
const prodDatabaseUrl = prodEnv.DATABASE_URL;
const localDatabaseUrl = localEnv.DATABASE_URL;
const prodUrl = parseDatabaseUrl('Production', prodDatabaseUrl);
const localUrl = parseDatabaseUrl('Local', localDatabaseUrl);

console.log('Production source:', targetLabel(prodUrl));
console.log('Local target:', targetLabel(localUrl));
console.log('Production will only be read with pg_dump. Local target will be dropped/recreated by pg_restore --clean.');

if (isLocalTarget(prodUrl)) {
  fail('Refusing: production source appears to be local. Check PROD_ENV_FILE.');
}

if (!isLocalTarget(localUrl)) {
  fail('Refusing: local target is not localhost/127.0.0.1. This script may only overwrite a local database.');
}

if (targetLabel(prodUrl) === targetLabel(localUrl)) {
  fail('Refusing: production source and local target resolve to the same host/database.');
}

if (process.env.CLONE_CONFIRM !== CONFIRMATION) {
  fail(`Refusing to overwrite local DB. Re-run with CLONE_CONFIRM=${CONFIRMATION}.`);
}

const tempDir = mkdtempSync(join(tmpdir(), 'educlearance-prod-clone-'));
const dumpFile = join(tempDir, 'prod.dump');

try {
  run('Dumping production database', 'pg_dump', [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    '--file', dumpFile,
    prodDatabaseUrl,
  ]);

  run('Restoring into local database', 'pg_restore', [
    '--clean',
    '--if-exists',
    '--no-owner',
    '--no-privileges',
    '--dbname', localDatabaseUrl,
    dumpFile,
  ]);

  console.log('\nClone complete. Local database now mirrors production data at dump time.');
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
