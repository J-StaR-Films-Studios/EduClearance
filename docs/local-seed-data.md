# Local Seed Data Reference

This reference documents the records created by `pnpm db:seed` for local development and operator verification.

## Safety notes

- School contacts under `educlearance.local` are local verification placeholders, not official school inboxes.
- Real Abuja school directory candidates are not activated by the seed script. They remain `unclaimed` or `pending` until an operator verifies ownership, location, and official contacts.
- Abuja/FCT directory candidates are sourced from `src/db/seed-data/abuja-osm-schools.json`, which currently contains 48 OpenStreetMap/manual candidate records with source attribution.
- Do not publish or activate any candidate record until the Abuja verification checklist is completed.

## Local sign-in actors

The seed creates password-backed users for local development. Use password `EduClearance!2026` for each account below. The app now creates database-backed sessions through `/api/auth/login`; direct role-cookie access is not used for production-shaped testing.

| Role | Seed actor | Email | School | Purpose |
| --- | --- | --- | --- | --- |
| `platform_admin` | John Oke | `john@jstarstudios.com` | Platform | Admin workspace review, school lifecycle review, wallet/payment verification checks. |
| `school_owner` | Tunde Adeyemi | `owner+wuse-local-academy@educlearance.local` | Wuse Local Academy | Active school owner flow with funded wallet. |
| `school_admin` | Ope Alabi | `admin+wuse-local-academy@educlearance.local` | Wuse Local Academy | Active school admin flow for clearance requests and issue review. |
| `school_staff` | Grace Okafor | `staff+wuse-local-academy@educlearance.local` | Wuse Local Academy | Active school staff flow with read/operations access. |
| `school_owner` | Zainab Musa | `owner+garki-local-college@educlearance.local` | Garki Local College | Second active school for matched clearance and dispute workflows. |
| `school_staff` | Chika Nwosu | `verification+lugbe-local-preparatory-school@educlearance.local` | Lugbe Local Preparatory School | Pending onboarding record for admin/operator review. |

## Local workflow records

| Area | Records |
| --- | --- |
| Active schools | Wuse Local Academy and Garki Local College. |
| Pending local onboarding | Lugbe Local Preparatory School. |
| Abuja/FCT directory candidates | 48 unverified candidate records inserted from `src/db/seed-data/abuja-osm-schools.json`; these populate search/directory flows without making real-school ownership claims. |
| Wallets | Wuse and Garki have balances for request testing; Lugbe has a zero balance while pending. |
| Payments | Two successful local Paystack-style records with `PSK-LOCAL-SEED-*` references. |
| Clearance requests | One no-record request against an unclaimed Abuja candidate and one confirmed-match request between active local schools. |
| Issues/disputes | One unresolved issue and one under-review dispute for local workflow testing. |

## Non-destructive production import

`pnpm db:seed` truncates local tables and is intended for disposable development databases.

To populate an existing production/staging database without wiping users/payments/test records, run the non-destructive importer instead:

```bash
pnpm db:import:abuja-schools -- --env=.env.prod-import
```

The importer inserts missing candidate schools by unique slug and skips records that already exist.

Related checklist: [`docs/abuja-school-verification-checklist.md`](./abuja-school-verification-checklist.md).
