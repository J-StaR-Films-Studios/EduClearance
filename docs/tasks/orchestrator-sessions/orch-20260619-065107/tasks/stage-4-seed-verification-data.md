# Stage 4 — Seed / Local Verification Data + Operator Docs

## Objective
Replace remaining demo-style local seed data with production-safe local onboarding/verification data and make Abuja school locations easy to review before production import.

## Scope
- `src/db/seed.ts`
- Any local data labels that still imply toy/demo records.
- Add documentation under `docs/` for local seed credentials/roles and Abuja location verification checklist.

## Definition of Done
- Seed records use production-safe local development naming and no `.demo` emails, `DEMO` references, or demo-only audit actions.
- Seed includes a useful Abuja-oriented school directory subset with real-world school/location candidates marked in safe statuses (`unclaimed`/`pending` unless needed for local workflow testing).
- Local active school/user/wallet records still support app testing.
- Verification docs make it easy to review school names, areas, and location confidence before production activation.
- `pnpm db:seed` runs successfully against the local database if available, plus `pnpm typecheck` and `pnpm lint` pass.

## Expected Artifacts
- Updated seed/local data.
- Location verification docs.
- Verification summary with any DB availability notes.
