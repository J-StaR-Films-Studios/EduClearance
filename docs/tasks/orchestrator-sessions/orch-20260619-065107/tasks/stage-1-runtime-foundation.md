# Stage 1 — Runtime Demo Removal + Production-Named Local Auth/Data Foundation

## Objective
Remove demo-mode runtime surfaces and establish production-named local development auth/session/data helpers that are safe to use until real production auth and Neon are connected.

## Scope
- Rename/replace `demo-session`, `demo-school-data`, `demo-admin-data`, `/auth/demo-login`, and `AuthDemoForm` concepts with development/local session and database-oriented helpers.
- Runtime UI must not present the app as a demo, mockup, placeholder, or fake environment.
- Use the existing Drizzle/Postgres schema and local DB where practical.
- Maintain access gates for school and platform-admin areas.

## Definition of Done
- No runtime source file names/imports/classes/routes use `demo` semantics unless clearly in docs/history or migration comments.
- Login/register pages offer production-appropriate local development access copy, not "demo login" copy.
- Dashboard/admin/wallet/clearance pages consume production-named data helpers or DB-backed view models.
- Lint/typecheck are not worsened.

## Expected Artifacts
- Code changes in `src/app`, `src/components`, `src/lib`, and any helper files.
- Short implementation summary with changed files and verification commands.
