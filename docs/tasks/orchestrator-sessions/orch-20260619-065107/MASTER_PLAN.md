# EduClearance Production-Readiness Demo Cleanup

Session: `orch-20260619-065107`
Branch: `production-readiness-demo-cleanup`

## Objective
Take EduClearance out of demo mode and prepare it for production review while still using local development infrastructure. Remove public/demo language, replace demo-only auth/session/data with production-named local auth/session helpers and DB-backed flows, improve SEO/metadata, seed credible Abuja-oriented school data for verification, and verify with automated checks and browser smoke testing where practical.

## Stages
1. Runtime demo removal + production-named local auth/data foundation.
2. Transactional workflow/API hardening.
3. Production copy, SEO, and page polish.
4. Seed/local verification data + docs.
5. Final verification + PR readiness.

## Workflow
For every stage: implementation subagent → parent sanity check → reviewer subagent → fix loop if needed → stage exact files → commit subagent → verify commit.
