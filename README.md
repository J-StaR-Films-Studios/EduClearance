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

- Fake demo data only.
- Private routes are configured with `noindex, nofollow` metadata and `X-Robots-Tag` headers.
- Wallet values are stored in kobo.

## Demo limitations / production follow-up

- School and admin private routes currently use demo cookie-based session guards. Replace them with real authentication and active school membership checks before production.
- Clearance creation, wallet debit, and Paystack flows in the UI are prototype simulations only. Client callbacks do **not** credit wallets.
- Server placeholder endpoints now exist at `/api/clearance/start`, `/api/wallet/debit`, `/api/paystack/initialize`, and `/api/paystack/verify`. They intentionally return `501` until real transactional and idempotent implementations are added.
- Production payment work must initialize Paystack server-side, verify references or signed webhooks server-side, and credit/debit wallets only after successful verification.
