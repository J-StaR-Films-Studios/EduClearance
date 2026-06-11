# EduClearance Coding Guidelines

Created: 2026-06-11  
Stage: Genesis

## 1. Scope Law

EduClearance is an inter-school transfer clearance network. Do **not** turn the MVP into a full school ERP. Avoid building results, attendance, report cards, class management, or AI tutoring unless a future task explicitly adds Meloschool integration.

## 2. Product Language Rules

Use professional, legally safer wording:

- Use: “clearance request,” “outstanding balance,” “unresolved issue,” “transfer verification,” “no platform record found.”
- Avoid: “blacklist,” “debtor database,” “bad parent,” “cleared” when there is only no match.

Required no-match wording:

> No unresolved record was found on EduClearance. This does not confirm that the student has cleared the previous school. Please contact the previous school directly or wait for their response.

## 3. Recommended Stack Conventions

- Next.js App Router with TypeScript.
- Tailwind CSS + shadcn/ui for UI.
- PostgreSQL through Drizzle ORM migrations.
- Neon for production database.
- Local PostgreSQL for development:

```env
DATABASE_URL="postgresql://postgres:password@localhost:54321/edu_clearance"
```

- Paystack for top-ups and payment verification.
- Store all secrets in `.env.local` or deployment environment variables; never commit real production secrets.

## 4. TypeScript Rules

- Prefer explicit domain types for statuses, roles, and transaction types.
- Avoid `any`; if unavoidable, isolate and document why.
- Validate server inputs using a schema library such as Zod.
- Keep server-only code out of client components.
- Keep database access in server actions, route handlers, or server-side modules.

## 5. Database Rules

- Use migrations for schema changes; do not hand-edit production schema.
- Represent money in integer kobo (`balance_kobo`, `amount_kobo`) rather than floats.
- Use transactions for wallet debits/credits and clearance request creation.
- Make payment verification idempotent using unique provider references.
- Normalize searchable names into separate fields where useful.
- Add timestamps to all important tables.
- Add audit logs for sensitive reads/writes.

## 6. Auth and Access Control

- Platform admin access must be separate from school access.
- School users must only mutate records belonging to their school unless a workflow explicitly permits a previous-school response.
- Suspended schools must be blocked from starting clearance requests and creating reports.
- Unapproved/pending schools must not access sensitive clearance data.
- Never trust client-side role checks alone; enforce permissions server-side.

## 7. Privacy and Safety Rules

- Store only the minimum student/parent data needed for a clearance case.
- Do not expose clearance records publicly or to search engines.
- Avoid public profile pages for children or parents.
- Provide dispute and correction paths.
- Log who searched or viewed sensitive case data.
- Do not show unnecessary details when there is no confirmed match.

## 8. Paystack Rules

- Initialize payments server-side.
- Verify Paystack responses server-side before crediting wallets.
- Verify webhook signatures before processing webhooks.
- Make wallet credits idempotent by `provider_reference`.
- Keep manual admin wallet adjustments clearly marked as `manual` with audit logs.

## 9. UI Rules

- Mobile-first layout; school owners may use phones during admissions.
- Make primary actions obvious: Start Clearance Request, Report Issue, Top Up Wallet.
- Display wallet balance and checks remaining clearly.
- Show sensitive disclaimers in result states.
- Use calm, official visual language; avoid shame-based UX.

## 10. Verification Commands

Use the strongest available checks for the eventual app. Recommended scripts once the Next.js project exists:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

If no dedicated typecheck script exists, use:

```bash
npx tsc --noEmit
```

Database verification should include:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Exact scripts may change after the project is initialized, but build tasks must update this file when they do.

## 11. Definition of Done for Build Tasks

A task is not complete unless:

- The implementation matches the relevant `docs/issues/FR-XXX.md` acceptance criteria.
- Permissions are enforced server-side.
- Money operations are transactional/idempotent where relevant.
- UI states include loading, empty, success, and error states where practical.
- Verification commands were run or the reason they could not run is documented.
