# Clone Production Database to Local

Use this when you want your local database to mirror production data for debugging or realistic testing.

## Safety model

- Production is read-only via `pg_dump`.
- Only the local database is overwritten.
- The script refuses to run unless:
  - production DB host is not local,
  - local DB host is `localhost`, `127.0.0.1`, or `::1`,
  - source and target are not the same host/database,
  - you pass an explicit confirmation flag.

## Requirements

Install PostgreSQL client tools so these commands exist in your terminal:

```bash
pg_dump --version
pg_restore --version
```

## Env files

Expected default files:

```text
.env.prod-migrate  # production DATABASE_URL only; ignored by git
.env.local         # local DATABASE_URL; ignored by git
```

Do not commit either file.

## Run

```bash
CLONE_CONFIRM=CLONE_PROD_TO_LOCAL pnpm db:clone-prod-to-local
```

Optional custom env paths:

```bash
PROD_ENV_FILE=.env.prod-migrate \
LOCAL_ENV_FILE=.env.local \
CLONE_CONFIRM=CLONE_PROD_TO_LOCAL \
pnpm db:clone-prod-to-local
```

## What it does

Internally it runs:

1. `pg_dump --format=custom --no-owner --no-privileges` against production.
2. `pg_restore --clean --if-exists --no-owner --no-privileges` against local.

That means the local database will be dropped/recreated table-by-table to match production at dump time.

## What it does not do

- It does not write to production.
- It does not change Vercel settings.
- It does not run app migrations.

If production schema is newer than local code, pull latest code before cloning.
