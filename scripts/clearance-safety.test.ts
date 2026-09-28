import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getTableName } = require('drizzle-orm');
const { PgDialect } = require('drizzle-orm/pg-core');
const dialect = new PgDialect();
const actor = { userId: 'user-one', schoolId: 'school-one', schoolStatus: 'active' };
const previousSchool = { id: 'school-previous', name: 'Previous School', status: 'active' };
const otherSchoolIssue = {
  id: 'wrong-school', reportingSchoolId: 'school-other', status: 'unresolved',
  studentName: 'Ada Obi', studentNameNormalized: 'ada obi', parentPhone: '08031234567',
};
const issues = [
  otherSchoolIssue,
  ...Array.from({ length: 101 }, (_, i) => ({
    id: `unrelated-${i}`, reportingSchoolId: previousSchool.id, status: 'unresolved',
    studentName: `Other Student ${i}`, studentNameNormalized: `other student ${i}`, parentPhone: '08030000000',
  })),
  { ...otherSchoolIssue, id: 'late-match', reportingSchoolId: previousSchool.id },
];
let balanceKobo = 20_000;
let requestRow: Record<string, unknown> | null = null;
let debitCount = 0;

function rowsFor(table: string, predicate?: unknown) {
  switch (table) {
    case 'wallets': return [{ id: 'wallet-one', balanceKobo }];
    case 'clearance_requests': return requestRow ? [requestRow] : [];
    case 'schools': {
      if (predicate) {
        const query = dialect.sqlToQuery(predicate);
        if (query.params.includes('%')) {
          assert.match(query.sql, /lower\(.+\) = lower\(/);
          return [];
        }
      }
      return [previousSchool];
    }
    case 'clearance_issues': {
      assert.ok(predicate, 'Issue reads must be scoped to a previous school');
      const query = dialect.sqlToQuery(predicate);
      assert.match(query.sql, /reporting_school_id/);
      assert.ok(query.params.includes(previousSchool.id));
      assert.match(query.sql, /status/);
      return issues.filter((issue) => issue.reportingSchoolId === previousSchool.id && issue.status === 'unresolved');
    }
    default: throw new Error(`Unexpected read: ${table}`);
  }
}

const tx = {
  select() {
    let table = '';
    let predicate: unknown;
    const query = {
      from(value: unknown) { table = getTableName(value); return query; },
      where(value: unknown) { predicate = value; return query; },
      limit(n: number) { return Promise.resolve(rowsFor(table, predicate).slice(0, n)); },
      then(resolve: (rows: unknown[]) => unknown) { return Promise.resolve(rowsFor(table, predicate)).then(resolve); },
    };
    return query;
  },
  insert(value: unknown) {
    const table = getTableName(value);
    return {
      values(row: Record<string, unknown>) {
        if (table === 'clearance_requests') {
          return {
            onConflictDoNothing() {
              return { returning: async () => {
                if (requestRow) return [];
                requestRow = { ...row, correctionCount: 0 };
                return [{ id: row.id }];
              } };
            },
          };
        }
        if (table === 'wallet_transactions') debitCount++;
        return Promise.resolve();
      },
    };
  },
  update(value: unknown) {
    const table = getTableName(value);
    return {
      set(row: Record<string, unknown>) {
        const query = {
          where() {
            if (table === 'clearance_requests' && requestRow) {
              requestRow = { ...requestRow, ...row, correctionCount: 1 };
            }
            return query;
          },
          returning: async () => {
            if (table !== 'wallets' || balanceKobo < 10_000) return [];
            balanceKobo -= 10_000;
            return [{ balanceKobo }];
          },
          then(resolve: (value: unknown) => unknown) { return Promise.resolve(undefined).then(resolve); },
        };
        return query;
      },
    };
  },
};

for (const [path, exports] of [
  ['../src/db/client.ts', { db: { transaction: async (handler: (transaction: typeof tx) => unknown) => handler(tx) } }],
  ['../src/lib/local-actor.ts', { resolveLocalSchoolActor: async () => actor }],
] as const) {
  const filename = require.resolve(path);
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

const { POST: start } = require('../src/app/api/clearance/start/route.ts');
const { POST: correct } = require('../src/app/api/clearance/correct/route.ts');
const requestKey = '322ddff5-91aa-4e40-b438-f5035fa7e33b';
function post(path: string, body: object) {
  return new Request(`http://localhost${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
const payload = {
  requestKey, studentFirstName: 'Ada', studentLastName: 'Obi', parentName: 'Obi',
  parentPhone: '08031234567', previousSchoolId: previousSchool.id, previousSchoolName: previousSchool.name,
};

test('school-scoped matching finds issue after row 100 and retries charge once', async () => {
  const first = await start(post('/api/clearance/start', payload));
  assert.equal(first.status, 200);
  const firstBody = await first.json();
  assert.equal(firstBody.searchResult, 'confirmed_match');
  assert.equal(firstBody.matchedIssueId, 'late-match');
  assert.equal(firstBody.possibleIssueId, null);
  assert.equal(balanceKobo, 10_000);

  const retry = await start(post('/api/clearance/start', payload));
  const retryBody = await retry.json();
  assert.equal(retryBody.requestId, firstBody.requestId);
  assert.equal(retryBody.idempotent, true);
  assert.equal(debitCount, 1);
  assert.equal(balanceKobo, 10_000);

  const changed = await start(post('/api/clearance/start', { ...payload, studentLastName: 'Other' }));
  assert.equal(changed.status, 409);
  assert.equal(debitCount, 1);
});

test('name-only match stays unconfirmed and never links another child\'s debt', async () => {
  requestRow = null;
  balanceKobo = 20_000;
  const response = await start(post('/api/clearance/start', { ...payload, requestKey: '634e590c-2bba-4ad6-a4f5-a3676868baee', parentPhone: '08038888888' }));
  const body = await response.json();
  assert.equal(body.searchResult, 'possible_match');
  assert.equal(body.matchedIssueId, null);
  assert.equal(body.possibleIssueId, null);

  const correction = await correct(post('/api/clearance/correct', {
    clearanceRequestId: body.requestId, studentFirstName: 'Ada', studentLastName: 'Obi',
    previousSchoolId: previousSchool.id, previousSchoolName: previousSchool.name,
  }));
  assert.equal(correction.status, 200);
  assert.equal((await correction.json()).searchResult, 'possible_match');
});

test('free-text school name cannot use SQL wildcards to select another school', async () => {
  requestRow = null;
  balanceKobo = 20_000;
  const response = await start(post('/api/clearance/start', {
    ...payload, requestKey: 'e43ef6aa-7ca2-40ee-97e1-7725288a1561',
    previousSchoolId: null, previousSchoolName: '%',
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.searchResult, 'no_match');
  assert.equal(body.matchedIssueId, null);
});

test('correction can confirm a matching issue after row 100', async () => {
  requestRow = null;
  balanceKobo = 20_000;
  const initial = await start(post('/api/clearance/start', {
    ...payload, requestKey: '05230ff8-f4fd-40e0-baea-6721876ceacd', studentLastName: 'Obi Jr',
  }));
  const initialBody = await initial.json();
  assert.equal(initialBody.searchResult, 'possible_match');
  assert.equal(initialBody.possibleIssueId, null);

  const correction = await correct(post('/api/clearance/correct', {
    clearanceRequestId: initialBody.requestId, studentFirstName: 'Ada', studentLastName: 'Obi',
    previousSchoolId: previousSchool.id, previousSchoolName: previousSchool.name,
  }));
  assert.equal(correction.status, 200);
  assert.equal((await correction.json()).searchResult, 'confirmed_match');
});
