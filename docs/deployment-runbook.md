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

Only set `PAYSTACK_WEBHOOK_SECRET` if it matches the secret Paystack uses to sign webhook payloads. If it is absent, the app falls back to `PAYSTACK_SECRET_KEY` for optional webhook signature verification.

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

Payment confirmation uses the code-controlled callback flow:

1. The app creates a local payment row with a unique reference.
2. The app initializes Paystack with a dynamic `callback_url` for this deployment.
3. Paystack redirects the browser back to `/wallet?payment_reference=...`.
4. The app verifies the reference server-side through Paystack's transaction verify API.
5. The wallet is credited only after the backend confirms status, amount, local record, and ownership.

The optional receiver `/api/paystack/webhook` still exists for future use, but do not replace an existing Paystack account-level webhook URL if other products depend on it.

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
   - clearance debit
   - issue report
   - dispute/admin resolution

## Recovery notes

If a deployment fails during migration:

1. Do not repeatedly redeploy blindly.
2. Check Vercel build logs for the Drizzle error.
3. Check whether the target `DATABASE_URL` is correct.
4. Run/repair migration manually only after identifying the failed migration point.

If Paystack return verification fails:

1. Check that `NEXT_PUBLIC_APP_URL` matches the deployed app URL.
2. Check that `PAYSTACK_SECRET_KEY` matches the Paystack mode used for checkout.
3. Confirm the returned `payment_reference` exists in the local `payments` table.
4. Confirm the Paystack transaction amount matches the local payment amount.

If optional webhook verification is later enabled and fails:

1. Check that `PAYSTACK_WEBHOOK_SECRET` is absent or exactly matches the signing secret.
2. Check that `PAYSTACK_SECRET_KEY` is the key for the same Paystack mode as the dashboard webhook.
3. Confirm Paystack is sending `x-paystack-signature`.
