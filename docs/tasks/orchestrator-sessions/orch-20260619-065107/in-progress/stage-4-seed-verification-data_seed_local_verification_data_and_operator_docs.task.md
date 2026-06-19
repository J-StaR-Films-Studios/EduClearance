# Task stage-4-seed-verification-data: Seed/local verification data and operator docs
## 🔧 Agent Setup (DO THIS FIRST)
### Workflow to Follow
Read the `vibe-build` workflow before starting this task.
### Prime Agent Context
Prime the task with the current session plan, related feature docs, and the context below before taking action.
### Optional Skill / Context Overlays
No explicit skill/context overlays are required for this task; rely on the harness defaults and repo source of truth.
## Objective
Seed/local verification data and operator docs
## Scope
- src/db
- docs
## Context
Parent session: orch-20260619-065107

Task title: Seed/local verification data and operator docs
## Definition Of Done
- Seed has no demo-style references or .demo emails
- Abuja-oriented school directory candidates added with safe statuses
- Local workflow test actors remain available
- Location verification docs added
- pnpm db:seed if DB available, pnpm typecheck and pnpm lint pass
## Expected Artifacts
- Seed changes
- Verification docs
- Verification summary
## Dependencies
- stage-3-seo-production-copy
## Constraints
- Use production-safe local data. Do not ask questions. Do not commit.