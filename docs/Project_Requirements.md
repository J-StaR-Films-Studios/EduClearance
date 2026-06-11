# EduClearance Project Requirements

Created: 2026-06-11  
Stage: Genesis  
Primary source: `00_Notes/Idea.md`

## 1. Project Overview

**EduClearance** is a private school-to-school student transfer clearance network for local school clusters. It helps an admitting school open a clearance request for an incoming student, check whether any unresolved clearance or outstanding-balance issue exists, notify the previous school, and keep a traceable case history.

The MVP must stay focused on the wedge: **student transfer clearance**, not full school management. Meloschool remains a separate product and can integrate later.

## 2. Mission

Help schools avoid admitting transfer students blindly by giving approved schools a structured, private, auditable way to verify whether an incoming student has unresolved obligations at a previous school.

Core positioning:

> Protect your school before admitting a new student.

## 3. MVP Product Principles

1. **Clearance request, not simple search** — every check opens a single-student verification window.
2. **No record found does not mean cleared** — the UI must say: “No unresolved record was found on EduClearance. This does not confirm clearance. Please verify with the previous school.”
3. **Private professional wording** — avoid “debtor database” and “blacklist.” Use “clearance,” “outstanding balance,” “transfer verification,” and “unresolved issue.”
4. **Contribution should be free** — reporting an unresolved issue is free so schools are encouraged to contribute useful records.
5. **Consumption is paid** — the admitting school pays credits to start a clearance request.
6. **Human review remains possible** — schools can contact one another and admin can handle disputes, duplicates, and abuse.
7. **Data minimization** — store clearance cases and unresolved issue reports, not a permanent database of every child.

## 4. Tech Stack

| Area | Decision |
| :--- | :--- |
| Frontend | Next.js App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| Production DB | Neon |
| Local DB | PostgreSQL on Windows: `localhost:54321`, database `edu_clearance`, user `postgres` |
| ORM / migrations | Drizzle ORM recommended for a lightweight Postgres-first MVP |
| Auth | Email/password auth with school-scoped roles; implementation may use Better Auth or an equivalent Next.js-compatible auth layer |
| Payments | Paystack for wallet top-ups and payment verification/webhooks |
| Notifications | MVP: dashboard notification + generated WhatsApp/manual message; later: SMS/email automation |
| Deployment | Vercel or similar Next.js host, connected to Neon |

## 5. Local Development Database

Local PostgreSQL connection for development:

```env
DATABASE_URL="postgresql://postgres:password@localhost:54321/edu_clearance"
```

Rules:
- This is local-only and must not be reused for production.
- Production Neon credentials and Paystack keys must live in environment variables and must not be committed.
- Migrations should run cleanly against both local PostgreSQL and Neon.

## 6. Business Model

MVP pricing should remain simple:

- School wallet starts with **₦5,000 credit**.
- Public sales message: **₦5,000 gives 50 student checks**.
- Internal product action: one paid **clearance request** per incoming student.
- Each clearance request deducts **₦100** initially.
- Reporting unresolved issues is free.
- Paystack manages wallet top-ups.
- Admin can still manually credit wallets when needed for demos, corrections, or offline payments.

Future monetization can add reward credits, verified claims, SMS fees, or Meloschool integrations, but not in the MVP.

## 7. Core Roles

| Role | Description |
| :--- | :--- |
| Platform Admin | Owns EduClearance operations, approves schools, credits wallets, resolves disputes, monitors abuse. |
| School Owner/Admin | Claims a school, manages school profile, starts clearance requests, reports issues, views wallet/history. |
| School Staff | Optional delegated school user with restricted ability to start requests/report issues. |
| Previous School Contact | Receives request notification and can respond to/resolve a clearance case when active. |

## 8. Core Data Model Draft

```txt
schools
- id
- name
- slug
- address
- area
- main_phone
- clearance_phone
- contact_email
- contact_person
- logo_url
- status: unclaimed | pending | active | suspended
- created_at
- updated_at

users
- id
- school_id
- name
- email
- phone
- role: platform_admin | school_owner | school_admin | school_staff
- created_at

clearance_requests
- id
- incoming_school_id
- previous_school_id nullable
- previous_school_name_snapshot
- student_name
- student_name_normalized
- gender nullable
- last_class nullable
- parent_name
- parent_phone
- status: pending_verification | no_platform_record_found | previous_school_notified | cleared_by_previous_school | outstanding_balance_reported | disputed | no_response | previous_school_not_on_platform | closed
- search_result: no_match | possible_match | confirmed_match
- amount_charged
- notification_status: not_sent | dashboard | whatsapp_generated | sent | failed
- expires_at
- created_by_user_id
- created_at
- updated_at

clearance_issues
- id
- clearance_request_id nullable
- reporting_school_id
- student_name
- student_name_normalized
- parent_name
- parent_phone
- amount_owed
- issue_type: school_fees | books | uniform | transport | other
- academic_session
- term
- note
- evidence_url nullable
- status: unresolved | resolved | disputed | withdrawn
- created_at
- resolved_at nullable

wallets
- id
- school_id
- balance_kobo
- created_at
- updated_at

wallet_transactions
- id
- school_id
- type: credit | debit | refund | adjustment
- amount_kobo
- description
- reference
- provider: paystack | manual | system
- created_by_user_id nullable
- created_at

payments
- id
- school_id
- provider: paystack
- provider_reference
- amount_kobo
- status: initialized | successful | failed | abandoned
- metadata_json
- created_at
- verified_at nullable

disputes
- id
- clearance_request_id nullable
- clearance_issue_id nullable
- raised_by_school_id nullable
- reason
- status: open | under_review | resolved | rejected
- admin_note nullable
- created_at
- resolved_at nullable

audit_logs
- id
- actor_user_id nullable
- actor_school_id nullable
- action
- entity_type
- entity_id
- metadata_json
- ip_address nullable
- created_at
```

## 9. MVP Pages

Highest-priority MVP pages:

```txt
/
/login
/register
/claim-school
/dashboard
/clearance/new
/clearance/[id]
/clearance
/issues/new
/issues
/wallet
/admin
/admin/schools
/admin/wallets
/admin/clearance
/admin/issues
/admin/disputes
```

## 10. Functional Requirements

| FR ID | Description | User Story | Status |
| :--- | :--- | :--- | :--- |
| FR-001 | Landing page explains EduClearance, pricing, privacy framing, and calls schools to claim/register. | As a school owner, I want to quickly understand the product, so that I know why to join. | MUS |
| FR-002 | School directory stores manually seeded local schools with unclaimed/pending/active/suspended status. | As an admin, I want schools listed before onboarding, so that the network feels real and local. | MUS |
| FR-003 | School claim and registration flow lets a school request access to an existing profile or create a new claim. | As a school owner, I want to claim my school, so that I can use the platform officially. | MUS |
| FR-004 | Authentication and role-based authorization protect platform admin and school-only areas. | As a platform operator, I want secure role-based access, so that only approved users see sensitive data. | MUS |
| FR-005 | Admin can approve, reject, suspend, and edit school profiles and school users. | As an admin, I want onboarding control, so that fake or abusive schools cannot join unchecked. | MUS |
| FR-006 | A school can start a paid clearance request for one incoming student. | As an admitting school, I want to open a transfer clearance window, so that I can verify before admitting. | MUS |
| FR-007 | Clearance request matching returns no-match, possible-match, or confirmed-match wording with safe disclaimers. | As a school user, I want careful result language, so that I do not mistake “no record” for “cleared.” | MUS |
| FR-008 | Previous school notification/contact flow provides dashboard notification and generated WhatsApp/manual message. | As a school user, I want the previous school contacted, so that verification can continue outside a one-time search. | MUS |
| FR-009 | Schools can report unresolved clearance issues for free, with structured fields and professional wording. | As a previous school, I want to report unresolved obligations, so that other schools are warned. | MUS |
| FR-010 | Clearance requests and issues support statuses for pending, notified, cleared, unresolved, disputed, no response, and closed. | As all parties, I want clear statuses, so that each case has an understandable lifecycle. | MUS |
| FR-011 | Wallet credits are deducted for clearance requests, can be topped up through Paystack, and can be adjusted by admin. | As a school owner, I want to pay for checks through wallet credits, so that pricing stays simple. | MUS |
| FR-012 | Admin dashboard manages schools, wallets, clearance requests, issues, disputes, and suspicious activity. | As a platform admin, I want operational control, so that I can run the MVP safely. | MUS |
| FR-013 | Audit logs and privacy controls record sensitive actions and enforce data-minimizing, school-only access. | As the platform owner, I want accountability, so that the product is safer and more defensible. | MUS |
| FR-014 | The UI is mobile-friendly and fast for school owners using phones. | As a proprietor or staff member, I want to use the app on my phone, so that it works during admissions. | MUS |
| FR-015 | Seed/demo data supports a convincing local demo with schools, wallets, and sample clearance cases. | As the builder, I want demo data, so that I can show the MVP quickly. | MUS |
| FR-016 | Automated SMS/email notification sends previous-school requests without manual WhatsApp. | As a school user, I want automated notifications, so that follow-up is easier. | Future |
| FR-017 | Advanced fuzzy matching improves name/phone matching and duplicate detection. | As a school user, I want stronger matching, so that spelling variations do not hide cases. | Future |
| FR-018 | Reward credits or trust levels incentivize high-quality reports without revenue sharing complexity. | As a participating school, I want recognition for useful reporting, so that contribution feels valuable. | Future |
| FR-019 | Meloschool integration lets Meloschool admissions open EduClearance checks directly. | As a Meloschool user, I want clearance checks inside admissions, so that the products work together later. | Future |
| FR-020 | Parent-facing dispute/clearance portal allows parents to view and challenge records safely. | As a parent, I want a clear dispute path, so that inaccurate records can be corrected. | Future |

## 11. Non-Functional Requirements

- Sensitive pages must require authentication.
- School users must only access their own school data plus minimum necessary clearance result data.
- Paystack webhook verification must validate signatures before crediting wallets.
- Wallet debits must be transactional/idempotent; duplicate requests must not double-charge accidentally.
- Records involving children must be minimized, purpose-bound, and not publicly indexed.
- The app must be usable on mobile screens first.
- Database migrations must be repeatable against local PostgreSQL and Neon.
- Important actions must be audit logged.

## 12. MVP Acceptance Summary

The MVP is acceptable when:

1. Admin can seed schools and approve claims.
2. Active schools can log in and see their wallet.
3. Active schools can start a clearance request and get safe result wording.
4. Starting a clearance request deducts credit.
5. Active schools can report unresolved issues for free.
6. Previous-school contact/notification guidance is visible.
7. Admin can review schools, wallets, requests, issues, and disputes.
8. Paystack top-up flow credits wallets after verified payment.
9. The app is mobile-friendly and has demo data for a local school-cluster pitch.
