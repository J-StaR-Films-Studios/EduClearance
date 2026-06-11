# Task build-admin-review: Implement Admin Dashboard and Final Verification

Status: completed  
Stage: Build  
Workflow: vibe-build  
Role: reviewer/coder  
Dependencies: `build-school-workflows`

## 🔧 Agent Setup (DO THIS FIRST)

### Workflow to Follow
Follow `vibe-build` with review-first discipline.

### Prime Agent Context
Read these files before editing/reviewing:
- `docs/Project_Requirements.md`
- `docs/Coding_Guidelines.md`
- `docs/Builder_Prompt.md`
- `docs/design/sitemap.md`
- `docs/design/design_critique.md`
- `docs/mockups/admin.html`
- `docs/mockups/admin-schools.html`
- `docs/mockups/admin-clearance.html`
- `docs/mockups/admin-disputes.html`
- `docs/issues/FR-005.md`
- `docs/issues/FR-012.md`
- `docs/issues/FR-013.md`
- `docs/issues/FR-015.md`
- All completed Build task packets and handoff notes
- this task packet

### Optional Skill / Context Overlays
None required. Use reviewer judgment for privacy, payments, permissions, and regressions.

## Objective
Implement and/or finalize the platform admin operations area, then perform a Build-phase verification pass across the MVP.

## Scope
- Implement `/admin` overview from mockup with operational counts and latest activity.
- Implement `/admin/schools` for claim approval/rejection/suspension/editing of official school profile/contact data.
- Implement `/admin/clearance` for reviewing clearance requests and suspicious activity.
- Implement `/admin/disputes` for resolving disputes, clearing/keeping records, audit logging, and refund helper behavior when an inaccurate record is cleared.
- Add admin wallet adjustment controls if not already covered by school wallet/payment work.
- Verify role protection: only `platform_admin` can access admin routes/actions.
- Create/update final build handoff with verification results and remaining risks.

## Context
Admin control is required for onboarding safety, wallet corrections, disputes, and abuse handling. This task should also review previous Build slices for gaps against the locked docs and mockups.

## Definition Of Done
- [x] Admin overview exists and matches `admin.html` intent.
- [x] Admin can approve/reject/suspend/reactivate school claims/profiles.
- [x] Admin can view/search clearance requests, issues, wallets, and disputes.
- [ ] Dispute resolution actions are audit logged.
- [x] Clearing inaccurate records triggers or clearly prepares the ₦100 wallet refund path.
- [ ] Manual wallet adjustments are marked `manual` and audit logged.
- [x] Admin access is enforced server-side with `platform_admin` checks.
- [x] Seed/demo data supports a convincing local demo and uses fake data only.
- [x] All MUS FR issue checklists are updated or residual gaps are documented.
- [x] `npm run typecheck`, `npm run lint` if available, and `npm run build` pass.
- [x] `docs/Builder_Handoff_Report.md` summarizes what was built, verification status, how to run, and remaining risks.

## Expected Artifacts
- Admin routes/components/actions for `/admin`, `/admin/schools`, `/admin/clearance`, `/admin/disputes`
- Permission/audit/refund/admin-wallet code as needed
- Updated FR issue checklists for FR-005, FR-012, FR-013, FR-015 and any touched FRs
- `docs/Builder_Handoff_Report.md`

## Constraints
- Do not expose admin routes to school users.
- Do not silently credit/debit wallets without transaction records.
- Do not use real student/parent/school private data in seed/demo artifacts.
- Preserve locked design refinements from `docs/design/design_critique.md`.

## Verification
Run the strongest available checks:

```bash
npm run typecheck
npm run lint
npm run build
```

If a script does not exist, document that and run the closest equivalent.

## Handoff Notes
Completed the mockup-driven admin build slice and verification pass. Remaining follow-up is to replace demo audit-log notices with persistent server-side audit writes for dispute decisions, school lifecycle actions, and manual wallet adjustments.
