# Stage 5 — Final Verification + PR Readiness

## Objective
Run final production-readiness verification, browser smoke testing where practical, and prepare a concise PR/review summary for the user.

## Scope
- Full checks: `pnpm db:seed`, `pnpm typecheck`, `pnpm lint`, `pnpm build`.
- Runtime smoke: start the built app locally and verify public/private SEO endpoints and representative pages using Chrome headless or equivalent local HTTP checks.
- Final forbidden-wording grep over runtime source.
- Git status/log review and PR-readiness notes.

## Definition of Done
- Full verification commands pass or documented blockers are explicit.
- Browser/local smoke confirms `/`, `/robots.txt`, `/sitemap.xml`, `/login`, and private noindex route behavior.
- Final source grep has no demo/mock/fake/sample/seeded/future-state placeholder wording in runtime source.
- Working tree is clean except expected final orchestrator bookkeeping, which is committed if appropriate.
- Final response summarizes commits, verification, production switch notes, and any residual risks.

## Expected Artifacts
- Final verification summary.
- Optional final docs-only commit for orchestration bookkeeping if generated task files changed.
