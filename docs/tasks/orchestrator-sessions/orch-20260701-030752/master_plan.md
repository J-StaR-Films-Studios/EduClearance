# EduClearance Production Readiness Review

Goal: make the app safe, clean, SEO-ready, and Vercel-ready for real users.

Scope:
- Security/auth/session/API/payment review.
- SEO, metadata, robots/sitemap, accessibility and public-page readiness.
- Code quality, tests/build/lint/typecheck, dependency and config review.
- Database/schema/seed/base-state cleanup so no demo/prototype state leaks into production.
- Vercel deployment configuration and release runbook checks.

Execution model:
- Run parallel specialist audits first.
- Synthesize findings and apply critical/high-confidence fixes in this parent session.
- Verify with lint/typecheck/build and document any manual production actions that require secrets or external services.

Important constraints:
- Do not expose env secret values; only inspect variable names/config behavior.
- Avoid destructive database actions unless explicitly safe and documented.
- Treat production auth/payment/data integrity issues as blockers, not polish.
