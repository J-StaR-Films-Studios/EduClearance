# Deployment Runbook

Use this before merging production branches or changing Vercel environment variables.

## Branch and deployment model

- Production domain: `https://educlearance.meloschool.com/`
- Production branch target: `master`
- Feature/readiness branch example: `production-readiness-demo-cleanup`
- Merge the PR only after the target database and Vercel env vars are ready.

## Local vs Vercel database

Local development does **not** need to point at production.

Recommended setup:

- Local `.env.local`: local or disposable development database.
- Vercel Preview env: preview/staging database, if available.
- Vercel Production env: production database.

Do not commit `.env.local` or secret values.

## Required environment variables

Set these in Vercel for the environment you are deploying:

```env
DATABASE_URL=
NEXT_PUBLIC_APP_URL=https://educlearance.meloschool.com
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
```

Optional:

```env
PAYSTACK_WEBHOOK_SECRET=
```

Only set `PAYSTACK_WEBHOOK_SECRET` if it matches the secret Paystack uses to sign webhook payloads. If it is absent, the app falls back to `PAYSTACK_SECRET_KEY` for webhook signature verification.

## Automatic migrations on Vercel

This project includes a guarded Vercel build script:

```bash
pnpm vercel-build
```

The script:

1. Runs `pnpm db:migrate` only when `RUN_DB_MIGRATIONS=true`.
2. Refuses to deploy if migrations are enabled but `DATABASE_URL` is missing.
3. Runs `next build` after the migration gate.

### Vercel setup

In Vercel project settings:

1. Set **Build Command** to:

   ```bash
   pnpm vercel-build
   ```

2. Add this environment variable in **Production**:

   ```env
   RUN_DB_MIGRATIONS=true
   ```

3. Do not enable `RUN_DB_MIGRATIONS=true` for Preview unless Preview has its own safe database.

Drizzle migrations are intended to be idempotent: already-applied migration files are tracked by Drizzle and should not rerun on every deployment.

## Paystack webhook

In Paystack dashboard, configure webhook URL:

```txt
https://educlearance.meloschool.com/api/paystack/webhook
```

Required event:

```txt
charge.success
```

For staging/test mode, Paystack test keys can be used, but remember test payments can still mutate whichever database the deployed app is connected to.

## Pre-merge checklist

Before merging a PR into `master`:

1. Confirm Vercel Production env vars are present.
2. Confirm Build Command is `pnpm vercel-build`.
3. Confirm `RUN_DB_MIGRATIONS=true` is enabled only for the intended environment.
4. Confirm the production DB is backed up or disposable enough for the migration.
5. Run locally on the branch:

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm build
   ```

6. Merge PR.
7. Wait for Vercel deployment to finish.
8. Smoke test:
   - home page loads
   - login/register
   - admin login
   - school approval/edit
   - wallet top-up initialize
   - Paystack return verification
   - Paystack webhook delivery
   - clearance debit
   - issue report
   - dispute/admin resolution

## Recovery notes

If a deployment fails during migration:

1. Do not repeatedly redeploy blindly.
2. Check Vercel build logs for the Drizzle error.
3. Check whether the target `DATABASE_URL` is correct.
4. Run/repair migration manually only after identifying the failed migration point.

If webhook verification fails:

1. Check that `PAYSTACK_WEBHOOK_SECRET` is absent or exactly matches the signing secret.
2. Check that `PAYSTACK_SECRET_KEY` is the key for the same Paystack mode as the dashboard webhook.
3. Confirm Paystack is sending `x-paystack-signature`.
