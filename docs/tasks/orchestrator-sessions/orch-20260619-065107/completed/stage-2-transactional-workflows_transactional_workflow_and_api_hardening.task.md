# Task stage-2-transactional-workflows: Transactional workflow and API hardening
## 🔧 Agent Setup (DO THIS FIRST)
### Workflow to Follow
Read the `vibe-build` workflow before starting this task.
### Prime Agent Context
Prime the task with the current session plan, related feature docs, and the context below before taking action.
### Optional Skill / Context Overlays
No explicit skill/context overlays are required for this task; rely on the harness defaults and repo source of truth.
## Objective
Transactional workflow and API hardening
## Scope
- src/app/api
- src/lib
- src/components/workflows
## Context
Parent session: orch-20260619-065107

Task title: Transactional workflow and API hardening
## Definition Of Done
- Production-shaped local API behavior for clearance, wallet debit, Paystack initialize/verify
- Idempotent wallet/payment operations with audit logs
- No demo/mock/fake/placeholder-only runtime wording introduced
- pnpm typecheck and pnpm lint pass
## Expected Artifacts
- Source changes
- Verification summary
## Dependencies
- stage-1-runtime-foundation
## Constraints
- Implement against the existing Drizzle/Postgres schema.
- Use local DB/env; keep Paystack safe when secret keys are absent.
- Do not ask clarification questions.
- Do not commit.