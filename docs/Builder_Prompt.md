# EduClearance Builder Prompt

Created: 2026-06-11  
Recommended next stage: Vibe Design, then Vibe Build

## Product Focus

Build **EduClearance**, not Meloschool. The MVP is a standalone transfer-clearance network for local schools.

The core product action is:

> Start a paid clearance request for one incoming student.

Not:

> Run a passive one-off lookup.

## Stack to Use

- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL
- Neon for production
- Local PostgreSQL for development
- Drizzle ORM recommended
- Paystack for wallet top-ups

Local development database:

```env
DATABASE_URL="postgresql://postgres:password@localhost:54321/edu_clearance"
```

Production secrets must come from environment variables:

```env
DATABASE_URL="<neon-postgres-url>"
PAYSTACK_SECRET_KEY="<server-only>"
PAYSTACK_PUBLIC_KEY="<client-safe-public-key>"
PAYSTACK_WEBHOOK_SECRET="<if configured>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Build Priority Order

1. Initialize app, styling, auth scaffold, database/migrations.
2. Create schema for schools, users, clearance requests, issues, wallets, transactions, payments, disputes, audit logs.
3. Build platform admin login/protection and seeded admin user strategy.
4. Build school directory and claim/approval flow.
5. Build school dashboard with wallet balance.
6. Build Start Clearance Request flow with safe result wording.
7. Implement matching against unresolved issues.
8. Deduct wallet credit transactionally when a request starts.
9. Build unresolved issue reporting; reporting must be free.
10. Build previous-school notification/contact UX, with WhatsApp/manual message generation for MVP.
11. Build Paystack top-up initialization and verification/webhook path.
12. Build admin views for schools, wallets, requests, issues, disputes.
13. Add seed/demo data for a local school-cluster pitch.
14. Polish mobile UI and landing page copy.

## Must-Not-Build Yet

Do not build these unless a future issue explicitly changes scope:

- Full result management
- Report cards
- Attendance
- Class/subject setup
- Parent portal beyond future dispute planning
- AI learning recommendations
- School fees collection outside wallet top-ups
- Revenue sharing/split settlement
- Inter-school penalties

## Critical Product Details

- “No record found” must never be presented as “cleared.”
- Reporting an unresolved issue is free.
- Starting a clearance request costs wallet credit.
- Previous school contact details should use official school clearance contact, not private staff numbers unless intentionally provided.
- Use statuses from `docs/Project_Requirements.md`.
- All sensitive access should be logged.

## Demo Target

Prepare a demo that shows:

1. Admin has seeded schools in a local area.
2. A school claims/registers and gets approved.
3. Admin credits or Paystack tops up wallet.
4. School starts a clearance request for an incoming student.
5. No-match case shows safe disclaimer and previous-school contact.
6. Match case shows an unresolved issue professionally.
7. Previous school can report/resolve/dispute.
8. Admin can monitor and intervene.

## Mandatory Mockup-Driven Implementation
The `/docs/mockups` folder is the **UNQUESTIONABLE source of truth** for all front-end UI/UX.
You must NOT deviate from the layout, color palette, typography, or component structure defined in the mockups.
Before implementing any page, open the corresponding mockup file and replicate it exactly.

## Design Critique Refinements Locked for Build
Also preserve the refinements from `docs/design/design_critique.md`:

- Private/authenticated pages must use `noindex, nofollow` metadata and production routes should send `X-Robots-Tag: noindex, nofollow` where applicable.
- `/clearance` must include tabs for outbound checks and inbound clearance requests.
- If previous school is not listed in `/clearance/new`, show a manual previous-school name field.
- WhatsApp outreach should use a direct `wa.me` share link or equivalent generated message action.
- Issue reporting must use strong certification wording and the label “Unresolved Balance Owed by Parent/Student (₦)”.
- Wallet billing must be hidden or locked for `school_staff` users.
- Dispute resolution that clears an inaccurate record should refund the admitting school’s ₦100 check credit.
- Tables must be horizontally scrollable on narrow mobile screens.

