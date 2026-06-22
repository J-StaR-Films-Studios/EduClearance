# Task stage-1-runtime-foundation: Runtime demo removal + local auth/data foundation
## 🔧 Agent Setup (DO THIS FIRST)
### Workflow to Follow
Read the `vibe-build` workflow before starting this task.
### Prime Agent Context
Prime the task with the current session plan, related feature docs, and the context below before taking action.
### Optional Skill / Context Overlays
No explicit skill/context overlays are required for this task; rely on the harness defaults and repo source of truth.
## Objective
Runtime demo removal + local auth/data foundation
## Scope
- src/app
- src/components
- src/lib
## Context
Parent session: orch-20260619-065107

Task title: Runtime demo removal + local auth/data foundation
## Definition Of Done
- No runtime demo-mode references remain for auth/session/static app data
- Access gates continue to work for school and platform-admin areas
- Login/register copy is production-appropriate for local development
- Verification commands run or documented
## Expected Artifacts
- Source changes
- Verification summary
## Dependencies
- none
## Constraints
- Follow the user-approved implement/review/commit workflow.
- Do not ask clarification questions.
- Use local DB/env only.