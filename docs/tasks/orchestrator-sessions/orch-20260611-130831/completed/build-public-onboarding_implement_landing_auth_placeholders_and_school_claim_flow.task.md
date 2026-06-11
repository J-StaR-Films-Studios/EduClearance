# Task build-public-onboarding: Implement Landing, Auth Placeholders, and School Claim Flow

Status: pending  
Stage: Build  
Workflow: vibe-build  
Role: coder  
Dependencies: `build-foundation`

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
Follow `vibe-build`.

### Prime Agent Context
Read these files before editing:
- `docs/Project_Requirements.md`
- `docs/Coding_Guidelines.md`
- `docs/Builder_Prompt.md`
- `docs/design/sitemap.md`
- `docs/design/ux_strategy.md`
- `docs/design/design_critique.md`
- `docs/mockups/home.html`
- `docs/mockups/login.html`
- `docs/mockups/register.html`
- `docs/mockups/claim-school.html`
- `docs/issues/FR-001.md`
- `docs/issues/FR-003.md`
- `docs/issues/FR-004.md`
- `docs/issues/FR-014.md`
- this task packet

### Optional Skill / Context Overlays
None required. Use the locked mockups as the UI source of truth.

## Objective
Implement the public onboarding slice: landing page, auth placeholder routes, registration entry, and school claim/verification flow.

## Scope
- Implement `/` from `home.html` and preserve locked copy, pricing, trust/privacy framing, and mobile layout.
- Implement `/login` and `/register` from mockups as functional placeholders wired to the app shell/auth strategy created in `build-foundation`.
- Implement `/claim-school` from `claim-school.html`, including school search, claim existing school, request new school, verification upload UI, and pending approval state.
- Add server/client boundaries cleanly for forms and future auth integration.
- Add noindex metadata for auth/claim pages.
- Ensure school claim records/users remain pending until admin approval.

## Context
This task covers the first usable product entry path. It should not implement full admin approval logic; it should create the school/user claim flow and hand off pending claims to the admin task.

## Definition Of Done
- [ ] `/` matches `docs/mockups/home.html` closely.
- [ ] `/login` and `/register` exist and are styled from mockups.
- [ ] `/claim-school` matches mockup flow and can represent existing-school claim and new-school request.
- [ ] Pending claim state is represented in DB/actions or a safe placeholder if auth is not fully active yet.
- [ ] Private/auth pages include noindex metadata.
- [ ] Copy avoids blacklist/debtor wording.
- [ ] Mobile layout matches mockup intent.
- [ ] Relevant FR acceptance criteria are checked or notes added in issue files.
- [ ] Typecheck/build pass.

## Expected Artifacts
- Route files for `/`, `/login`, `/register`, `/claim-school`
- Shared marketing/auth/claim components as needed
- Server actions or placeholders for claim submission
- Updated issue checklists for FR-001, FR-003, FR-004, FR-014 where applicable

## Constraints
- Do not implement school dashboard, wallet, clearance workflow, or admin approval here.
- Preserve mockup layout/color/typography unless a build constraint requires a documented adaptation.
- Do not commit real secrets or real school/student data.

## Verification
Run:

```bash
npm run typecheck
npm run build
```

If auth is placeholder-only, clearly document what remains for production auth.

## Handoff Notes
Report changed files, implemented FR coverage, verification result, and any auth/claim limitations for `build-school-workflows` and `build-admin-review`.
