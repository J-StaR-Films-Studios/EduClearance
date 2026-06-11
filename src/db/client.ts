import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

import { getServerEnv } from '@/lib/env';

import * as schema from './schema';

export const connection = postgres(getServerEnv().DATABASE_URL, {
  max: 1,
  prepare: false,
});

export const db = drizzle(connection, { schema });
