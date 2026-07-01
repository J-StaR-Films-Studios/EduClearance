# EduClearance

EduClearance is a private school-to-school student transfer clearance network.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui scaffold
- PostgreSQL + Drizzle ORM
- Paystack-ready env structure

## Local setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy env placeholders:
   ```bash
   cp .env.example .env.local
   ```
3. Start local PostgreSQL at:
   `postgresql://postgres:password@localhost:54321/edu_clearance`
4. Generate migrations if needed:
   ```bash
   pnpm db:generate
   ```
5. Run seed data:
   ```bash
   pnpm db:seed
   ```
6. Start the app:
   ```bash
   pnpm dev
   ```

## Scripts

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:seed`

## Notes

- `pnpm db:seed` is destructive local/demo setup only and refuses non-local databases unless `ALLOW_DESTRUCTIVE_SEED=true` is explicitly set.
- Private routes are configured with `noindex, nofollow` metadata and `X-Robots-Tag` headers.
- Wallet values are stored in kobo.
- Uploaded proof/evidence files are restricted to PDF, PNG, and JPEG and served as attachments with `nosniff`.

## Production launch notes

- Keep production secrets only in Vercel environment variables; do not store live credentials in `.env.production.local`.
- Use `pnpm db:migrate` for production schema setup. Do **not** run `pnpm db:seed` against production.
- Create the first production platform admin with `pnpm db:create-admin` and the `PLATFORM_ADMIN_*` env vars from `.env.production.example`.
- Vercel should use `pnpm vercel-build` (codified in `vercel.json`). Set `RUN_DB_MIGRATIONS=true` only for the Vercel Production environment.
- Confirm production uses live Paystack keys, `NEXT_PUBLIC_APP_URL=https://educlearance.meloschool.com`, and a production database before publishing.
