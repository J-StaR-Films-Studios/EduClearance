# Stage 2 — Transactional Workflow/API Hardening

## Objective
Replace non-live local placeholder API responses with production-shaped server behavior backed by the existing local PostgreSQL/Drizzle schema wherever possible.

## Scope
- `src/app/api/clearance/start/route.ts`
- `src/app/api/wallet/debit/route.ts`
- `src/app/api/paystack/initialize/route.ts`
- `src/app/api/paystack/verify/route.ts`
- Supporting `src/lib` helpers for local actor/session resolution, IDs, audit logging, wallet operations, and Paystack adapter behavior.
- Client forms may be adjusted if needed to call the production-shaped endpoints instead of only routing locally.

## Definition of Done
- Clearance start validates input, resolves the current local school/user, checks active school membership, debits the wallet transactionally, creates a clearance request, links possible unresolved issue matches, and writes audit logs.
- Wallet debit is idempotent by reference, balance-checked, transactionally updates wallet + transaction + audit log.
- Paystack initialize creates a pending payment row; if a server secret is configured it calls Paystack, otherwise it returns a local-safe pending checkout response without pretending funds moved.
- Paystack verify is idempotent, verifies with Paystack when configured or verifies existing local pending references in local mode, then credits the wallet exactly once and audit logs.
- No `demo`, `mock`, `fake`, or placeholder-only runtime language is introduced.
- `pnpm typecheck` and `pnpm lint` pass.

## Expected Artifacts
- Source changes implementing production-shaped local workflows.
- Verification summary including API behavior and residual production-switch notes.
