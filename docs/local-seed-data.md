# Local Seed Data Reference

This reference documents the records created by `pnpm db:seed` for local development and operator verification.

## Safety notes

- Seeded school contacts under `educlearance.local` are local verification placeholders, not official school inboxes.
- Real Abuja school directory candidates are not activated by the seed script. They remain `unclaimed` or `pending` until an operator verifies ownership, location, and official contacts.
- Do not publish or activate any candidate record until the Abuja verification checklist is completed.

## Local access actors

The local access flow sets a role cookie and then resolves the first matching seeded user for that role. No password is created by the seed script.

| Role | Seed actor | Email | School | Purpose |
| --- | --- | --- | --- | --- |
| `platform_admin` | Amina Bello | `admin@educlearance.local` | Platform | Admin workspace review, school lifecycle review, wallet/payment verification checks. |
| `school_owner` | Tunde Adeyemi | `owner+wuse-local-academy@educlearance.local` | Wuse Local Academy | Active school owner flow with funded wallet. |
| `school_admin` | Ope Alabi | `admin+wuse-local-academy@educlearance.local` | Wuse Local Academy | Active school admin flow for clearance requests and issue review. |
| `school_staff` | Grace Okafor | `staff+wuse-local-academy@educlearance.local` | Wuse Local Academy | Active school staff flow with read/operations access. |
| `school_owner` | Zainab Musa | `owner+garki-local-college@educlearance.local` | Garki Local College | Second active school for matched clearance and dispute workflows. |
| `school_staff` | Chika Nwosu | `verification+lugbe-local-preparatory-school@educlearance.local` | Lugbe Local Preparatory School | Pending onboarding record for admin/operator review. |

## Seeded workflow records

| Area | Records |
| --- | --- |
| Active schools | Wuse Local Academy and Garki Local College. |
| Pending local onboarding | Lugbe Local Preparatory School. |
| Wallets | Wuse and Garki have balances for request testing; Lugbe has a zero balance while pending. |
| Payments | Two successful local Paystack-style records with `PSK-LOCAL-SEED-*` references. |
| Clearance requests | One no-record request against an unclaimed Abuja candidate and one confirmed-match request between active local schools. |
| Issues/disputes | One unresolved issue and one under-review dispute for local workflow testing. |

Related checklist: [`docs/abuja-school-verification-checklist.md`](./abuja-school-verification-checklist.md).
