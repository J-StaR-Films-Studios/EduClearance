# Task stage-3-seo-production-copy: Production copy, SEO, and page polish
## 🔧 Agent Setup (DO THIS FIRST)
### Workflow to Follow
Read the `vibe-build` workflow before starting this task.
### Prime Agent Context
Prime the task with the current session plan, related feature docs, and the context below before taking action.
### Optional Skill / Context Overlays
No explicit skill/context overlays are required for this task; rely on the harness defaults and repo source of truth.
## Objective
Production copy, SEO, and page polish
## Scope
- src/app
- src/lib
## Context
Parent session: orch-20260619-065107

Task title: Production copy, SEO, and page polish
## Definition Of Done
- Public SEO metadata and structured data added
- Private routes remain noindex/nofollow
- Robots/sitemap expose public routes only and disallow private routes
- Public copy avoids unsupported trust/demo claims
- pnpm typecheck and pnpm lint pass
## Expected Artifacts
- SEO/copy source changes
- Verification summary
## Dependencies
- stage-2-transactional-workflows
## Constraints
- Use production-facing wording from the PRD.
- Do not ask clarification questions.
- Do not commit.