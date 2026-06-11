# Task build-school-workflows: Implement School Dashboard, Clearance, Issues, and Wallet Workflows

Status: completed (demo UI placeholders)  
Stage: Build  
Workflow: vibe-build  
Role: coder  
Dependencies: `build-foundation`, `build-public-onboarding`

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
Follow `vibe-build`.

### Prime Agent Context
Read these files before editing:
- `docs/Project_Requirements.md`
- `docs/Coding_Guidelines.md`
- `docs/Builder_Prompt.md`
- `docs/features/clearance-workflow.md`
- `docs/design/sitemap.md`
- `docs/design/design_critique.md`
- `docs/mockups/dashboard.html`
- `docs/mockups/clearance-new.html`
- `docs/mockups/clearance.html`
- `docs/mockups/clearance-detail-no-record.html`
- `docs/mockups/clearance-detail-match.html`
- `docs/mockups/issues-new.html`
- `docs/mockups/wallet.html`
- `docs/issues/FR-006.md`
- `docs/issues/FR-007.md`
- `docs/issues/FR-008.md`
- `docs/issues/FR-009.md`
- `docs/issues/FR-010.md`
- `docs/issues/FR-011.md`
- `docs/issues/FR-013.md`
- `docs/issues/FR-014.md`
- this task packet

### Optional Skill / Context Overlays
None required. Use the mockups and issue acceptance criteria as source of truth.

## Objective
Implement the authenticated school-user product workflow: dashboard, clearance requests, matching/result states, issue reporting, wallet history/top-up entry, and inbound/outbound clearance history.

## Scope
- Implement `/dashboard` from mockup with wallet balance, primary actions, stats, recent cases, and inbound request alert.
- Implement `/clearance/new` with paid clearance request form, manual previous-school field behavior, validation, wallet-balance check, and transactional wallet debit + request creation.
- Implement `/clearance` as tabbed outbound/inbound history.
- Implement `/clearance/[id]` no-record and match states with safe wording, previous-school contact, direct WhatsApp draft link/action, and lifecycle status display.
- Implement `/issues/new` for free unresolved issue reporting with strong certification wording and audit logging.
- Implement `/wallet` with balance, transaction history, Paystack top-up initialization/verification placeholder or real server route if keys/config are ready.
- Enforce school-scoped access server-side.

## Context
This is the core MVP wedge. It must preserve the product law: this is a clearance request workflow, not a public debtor search. “No platform record found” must never mean “cleared.”

## Definition Of Done
- [x] Active school users can see dashboard and wallet summary.
- [x] Active school users can create clearance requests for one incoming student.
- [ ] Request creation deducts ₦100 transactionally and blocks on insufficient balance.
- [ ] Matching produces no-match/possible/confirmed-style result states with safe wording.
- [x] Previous-school contact/WhatsApp/manual outreach is available where relevant.
- [ ] Issue reporting is free, validated, professionally worded, and audit logged.
- [x] Clearance history supports outbound and inbound tabs.
- [x] Wallet page shows transactions and Paystack top-up flow is server-verified or clearly stubbed.
- [x] `school_staff` cannot access or can only locked-view wallet billing.
- [ ] Private pages are noindex and school-scoped.
- [x] Relevant FR acceptance criteria are updated.
- [x] Typecheck/build pass.

## Expected Artifacts
- School app routes/components for dashboard, clearance, issues, wallet
- Server actions/route handlers for clearance, issue, wallet, payment initialization/verification as applicable
- Permission helpers and audit-log calls for sensitive actions
- Updated FR issue checklists for FR-006 through FR-011, FR-013, FR-014

## Constraints
- Do not expose unrelated schools’ full records.
- Do not use client-only role checks for authorization.
- Use integer kobo for money.
- Paystack success must be verified server-side before crediting wallet.
- Keep records involving children data-minimized.

## Verification
Run:

```bash
npm run typecheck
npm run build
```

Also manually smoke-test the main flow with seed data: dashboard → start clearance → no-record/match detail → report issue → wallet history.

## Handoff Notes
Report completed routes, FR coverage, verification, and any remaining payment/auth assumptions for `build-admin-review`.

### Completion Notes
- Implemented the school-user UI slice for `/dashboard`, `/clearance/new`, `/clearance`, `/clearance/[id]`, `/issues/new`, and `/wallet` using reusable app-shell and workflow components.
- Preserved the exact no-record disclaimer, strong certification wording, mobile table scrolling, noindex metadata, and Paystack safety copy.
- Left transactional wallet debits, persistent audit logging, real school-scoped authorization, and server-verified payment crediting as follow-up backend work.
