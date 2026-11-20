---
change_id: ci-quality-gates
title: Run the quality gates in GitHub Actions on every PR to develop and master
status: implemented
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Notes

Test-plan Phase 6: run lint, typecheck (both build configurations), unit suite, Firestore rules suite and e2e on every PR to develop/master in GitHub Actions

Decisions taken 2026-11-20 (docs/PLAN-AUTOMATYZACJI.md): staging is a second Firebase project; no per-PR preview channels; production deploys automatically on push to master; `/task` is a thin wrapper over the 10x flow. Deploy workflows are a separate change — this one is the gate only.
