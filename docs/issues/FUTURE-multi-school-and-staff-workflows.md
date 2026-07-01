# Future: Multi-School, Staff Invites, and Claim Appeals

## Why this exists

Current launch behavior is intentionally conservative:

- One user account can claim/manage one school.
- A user with an active/pending school claim is redirected to `/account/pending-verification` instead of starting another claim.
- Rejected-only users can resubmit updated proof for the same school until the appeal limit is reached.
- The database schema can support multiple users attached to the same school through `users.schoolId`, but the product/UI flow for inviting and managing staff is not built yet.

## Future build goals

### 1. Staff/team management for a school

Add a verified-school admin area where a school owner/admin can:

- Invite staff by email/phone.
- Assign roles: `school_owner`, `school_admin`, `school_staff`.
- Remove/deactivate staff access.
- Transfer owner role safely.
- View audit history for staff changes.

Important constraints:

- `school_staff` should not manage billing/top-ups.
- `school_staff` should have limited workflow access based on the existing role rules.
- All staff must be attached to exactly one `schoolId` unless a deliberate multi-school model is later designed.

### 2. Multi-school ownership, if needed

If proprietors need to manage multiple schools, do not hack around one `users.schoolId`.
Design a proper membership model first, for example:

- `school_memberships`
  - `id`
  - `user_id`
  - `school_id`
  - `role`
  - `status`
  - timestamps

Then update auth/session resolution to select an active school context.

Questions to answer before building:

- Can one login switch between schools?
- Should wallet balances remain school-specific? Probably yes.
- Should clearance/audit records always include active `schoolId` context? Yes.
- Can one email own multiple schools? Only after membership model exists.

### 3. Claim appeal workflow polish

Current behavior:

- Active/pending claim redirects to `/account/pending-verification`.
- Rejected claims can be resubmitted from `/claim-school` if under the appeal limit.
- After the limit, user must contact support.

Future improvements:

- Add a dedicated “Update proof / appeal rejection” form directly on `/account/pending-verification`.
- Pre-fill previous claim details.
- Explain exactly why the claim was rejected using admin note.
- Let user upload corrected proof without repeating the entire search flow.
- Show clear state labels: Pending review, Rejected — action needed, Approved, Appeal limit reached.

### 4. Copy and UX rules

Avoid text like:

- “Claim another school”
- “Submit another claim”

Unless multi-school support exists.

Use:

- “Resubmit verification” for rejected same-school claims.
- “Switch account” if the user is trying to claim a different school.
- “Contact support” after appeal limit is reached.

## Current implementation notes

Files touched during the launch cleanup:

- `src/app/claim-school/page.tsx`
- `src/app/account/pending-verification/page.tsx`
- `src/components/public/claim-school-flow.tsx`
- `src/app/api/school-claims/route.ts`

Current verified checks after changes:

- `pnpm lint`
- `pnpm typecheck`
