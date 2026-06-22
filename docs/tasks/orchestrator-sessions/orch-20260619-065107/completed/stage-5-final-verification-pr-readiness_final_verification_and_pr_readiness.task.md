# Task stage-5-final-verification-pr-readiness: Final verification and PR readiness
## 🔧 Agent Setup (DO THIS FIRST)
### Workflow to Follow
Read the `vibe-build` workflow before starting this task.
### Prime Agent Context
Prime the task with the current session plan, related feature docs, and the context below before taking action.
### Optional Skill / Context Overlays
No explicit skill/context overlays are required for this task; rely on the harness defaults and repo source of truth.
## Objective
Final verification and PR readiness
## Scope
- verification
- docs/tasks/orchestrator-sessions/orch-20260619-065107
## Context
Parent session: orch-20260619-065107

Task title: Final verification and PR readiness
## Definition Of Done
- db:seed, typecheck, lint, build pass or blockers documented
- Chrome/headless smoke covers core routes and SEO endpoints
- Forbidden runtime wording grep clean
- Git status/log reviewed
- Final summary ready
## Expected Artifacts
- Verification summary
- Optional docs-only commit
## Dependencies
- stage-4-seed-verification-data
## Constraints
- Run local verification directly. Do not ask questions.