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
CRON_SECRET=
```

Only set `PAYSTACK_WEBHOOK_SECRET` if it matches the secret Paystack uses to sign webhook payloads. If it is absent, the app falls back to `PAYSTACK_SECRET_KEY` for webhook signature verification.

Set `CRON_SECRET` in Vercel Production if scheduled payment reconciliation is enabled. Vercel sends it as `Authorization: Bearer <CRON_SECRET>` for cron requests.

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

## Paystack payment confirmation

EduClearance does not require changing the Paystack dashboard webhook setting when this Paystack account is shared by multiple projects.

Payment confirmation has three layers:

1. Browser return verification: Paystack redirects back to `/wallet?payment_reference=...`, and the app verifies the payment directly through Paystack's transaction verify API.
2. Scheduled reconciliation: Vercel cron calls `/api/cron/paystack-reconcile`, which checks initialized Paystack payments and credits successful ones even if the browser return failed.
3. Optional webhook receiver: `/api/paystack/webhook` still exists for future use, but do not replace an existing Paystack account-level webhook URL if other products depend on it.

For staging/test mode, Paystack test keys can be used, but remember test payments can still mutate whichever database the deployed app is connected to.

## Pre-merge checklist

Before merging a PR into `master`:

1. Confirm Vercel Production env vars are present.
2. Confirm Build Command is `pnpm vercel-build`.
3. Confirm `RUN_DB_MIGRATIONS=true` is enabled only for the intended environment.
4. Confirm `CRON_SECRET` is set for scheduled payment reconciliation.
5. Confirm the production DB is backed up or disposable enough for the migration.
6. Run locally on the branch:

   ```bash
   pnpm typecheck
   pnpm lint
   pnpm build
   ```

7. Merge PR.
8. Wait for Vercel deployment to finish.
9. Smoke test:
   - home page loads
   - login/register
   - admin login
   - school approval/edit
   - wallet top-up initialize
   - Paystack return verification
   - scheduled Paystack reconciliation
   - clearance debit
   - issue report
   - dispute/admin resolution

## Recovery notes

If a deployment fails during migration:

1. Do not repeatedly redeploy blindly.
2. Check Vercel build logs for the Drizzle error.
3. Check whether the target `DATABASE_URL` is correct.
4. Run/repair migration manually only after identifying the failed migration point.

If scheduled reconciliation fails:

1. Check `CRON_SECRET` is set in Vercel Production.
2. Check Vercel cron logs for `/api/cron/paystack-reconcile`.
3. Check that `PAYSTACK_SECRET_KEY` matches the Paystack mode used for checkout.
4. Confirm initialized payments are still in the `initialized` status before reconciliation runs.

If optional webhook verification is later enabled and fails:

1. Check that `PAYSTACK_WEBHOOK_SECRET` is absent or exactly matches the signing secret.
2. Check that `PAYSTACK_SECRET_KEY` is the key for the same Paystack mode as the dashboard webhook.
3. Confirm Paystack is sending `x-paystack-signature`.
