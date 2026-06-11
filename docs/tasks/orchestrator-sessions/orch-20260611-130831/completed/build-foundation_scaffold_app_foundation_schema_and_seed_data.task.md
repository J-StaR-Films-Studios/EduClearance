# Task build-foundation: Scaffold App Foundation, Schema, and Seed Data

Status: completed  
Stage: Build  
Workflow: vibe-build  
Role: coder  
Dependencies: none

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
Follow `vibe-build`.

### Prime Agent Context
Read these files before editing:
- `docs/Project_Requirements.md`
- `docs/Coding_Guidelines.md`
- `docs/Builder_Prompt.md`
- `docs/design/sitemap.md`
- `docs/design/design_critique.md`
- `docs/design/ux_strategy.md`
- `docs/mockups/home.html`
- this task packet

### Optional Skill / Context Overlays
None required. Use repo source of truth.

## Objective
Initialize the EduClearance Next.js foundation and create the database/auth/payment-ready structure needed by later Build tasks.

## Scope
- Initialize a Next.js App Router + TypeScript + Tailwind project in the repo root.
- Add `package.json` scripts for lint, typecheck, build, dev, and Drizzle DB flow.
- Add Drizzle/Postgres config and MVP schema from the PRD: schools, users, clearance requests, clearance issues, wallets, wallet transactions, payments, disputes, and audit logs.
- Add `.env.example` with local PostgreSQL and Paystack placeholders only.
- Add fake-only seed/demo data for local school cluster demo.
- Add base app layout, global CSS/design tokens, shared utilities, and a noindex metadata/header pattern for private routes.
- Keep UI implementation minimal; full pages happen in later tasks.

## Context
The repo currently started as docs/mockups only. Design is locked and mockup-driven. The local DB target is:

```env
DATABASE_URL="postgresql://postgres:password@localhost:54321/edu_clearance"
```

Production DB is Neon. Payments are Paystack. Do not create `.env` with secrets.

## Definition Of Done
- [ ] `package.json` exists with working scripts.
- [ ] TypeScript/Tailwind app scaffold exists.
- [ ] Drizzle config and schema compile.
- [ ] Schema mirrors PRD MVP tables and key enum/status fields.
- [ ] Money fields use integer kobo.
- [ ] `.env.example` documents local DB and Paystack placeholders.
- [ ] Seed script uses fake demo names and fake contact data only.
- [ ] No private route pattern is indexable by default.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes, or exact blockers are documented.

## Expected Artifacts
- `package.json`
- `next.config.*`, `tsconfig.json`, lint config
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.*`
- `src/db/seed.ts` or equivalent seed script
- `.env.example`
- README/dev setup notes if setup commands differ from docs

## Constraints
- Preserve all docs and mockups.
- Use npm unless the scaffold has a clear reason otherwise.
- If `create-next-app` fails due to network/environment, manually create the minimal scaffold.
- Follow `docs/Builder_Prompt.md`; do not invent a different UI stack.
- Do not implement all product pages here.

## Verification
Run:

```bash
npm run typecheck
npm run build
```

If scripts are unavailable until scaffold completion, document the reason and add them before handoff.

## Handoff Notes
Report changed files, commands run, verification result, blockers, and recommended next task: `build-public-onboarding`.

## Completion Notes
- Next.js foundation, Tailwind tokens, Drizzle schema/config, env example, and fake seed data were added.
- `npm run typecheck` and `npm run build` passed.
- `npm run lint` passes with the new flat ESLint config and build linting is skipped in production build in favor of the standalone lint script.
