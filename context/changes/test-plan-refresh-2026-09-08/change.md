---
change_id: test-plan-refresh-2026-09-08
title: Refresh test-plan.md for the e2e layer, local gates, and stack drift
status: implemented
created: 2026-09-08
updated: 2026-09-08
archived_at: null
---

## Notes

A `--refresh` of `context/foundation/test-plan.md` (guide last updated 2026-08-14; strategy last reviewed 2026-08-04). Refresh trigger is a tech-stack change plus a §4/§5 drift from disk — **NOT** the 3-month staleness rule (only 5 weeks elapsed).

### Refresh evidence (Phase 1 + Phase 2 of /10x-test-plan, run 2026-09-08)

- Hot-spot scan, scope `src/ test/ firestore.rules`: 6 commits in 30 days, every hot file belonging to the test rollout itself (`fixtures/edge/*`, `year-report.component.ts`, semestr + cambridge specs). Product code frozen since 2026-08-04.
- Test-base profile: meaningful — Karma + 23 specs in `src/` (unchanged since 2026-08-04), 2 rules files, 1 e2e spec.
- Interview Q1: top worry is still "fills the report, clicks download, nothing happens, error only in console" (Risk #1).
- Interview Q2: two lived burns — the untouched form crashing with a green suite (Risk #1), and a template pre-filling a mark silently in production (Risk #2).
- Interview Q3: nothing changed without confidence — only tests, hooks and gates were touched.
- Interview Q4: under-tested = the three writers together (Risk #2 / Phase 2), the rules suite nothing runs (Risk #3 / Phase 3), and the browser path.
- Interview Q5: re-confirms the three §7 exclusions (UI snapshots/pixel diff, PL/EN translation parity, the three non-templated reports beyond what exists). E2E was offered as a fourth exclusion and deliberately **NOT** chosen.

### What this refresh must change, and nothing beyond it

1. §4 e2e row and §5 "e2e on critical flows" row currently read "none — and none planned". Contradicted on disk: `playwright.config.ts`, `@playwright/test`, `@playwright/cli`, `test/e2e/seed.spec.ts`, `test/e2e/fixtures/app.ts`, `npm run e2e`. Rewrite both to the real state.
2. §5 quality gates: three rows say "required after §3 Phase 5", but lint + typecheck are already enforced locally by the per-edit hook (`.claude/hooks/eslint-edited-file.js`) and lefthook pre-commit (`npx tsc --noEmit`, `npx eslint {staged_files}`). Split the table into what is enforced locally today versus what still needs CI. The "post-edit hook — optional" row understates what is wired.
3. §2 Likelihood column was calibrated 2026-08-04 on a 30-day window containing S-02/S-03/S-04 feature work; that evidence no longer reproduces. Add a dated calibration note and re-source Risks #1 and #2 to interview Q1/Q2, which are now the strongest evidence. Do **NOT** demote any row: a frozen codebase lowers near-term likelihood, but the risks are about what happens when it thaws.
4. §3 gets a **NEW** rollout phase for a narrow e2e layer on critical flows (user decision 2026-09-08: its own phase, not folded into Phase 2 and not left as seed-only). It carries its own change folder and its own gate. `test/e2e/seed.spec.ts` is the reference shape it builds on.
5. §3 Phase 5 "Quality gates wired" assumed nothing local existed; half of it landed out-of-band via the m3l3 lesson. Rewrite its goal to what is left: CI, the rules suite on a gate, deploy preconditions.
6. §4 Stack grounding block (all four lines checked: 2026-08-04) is factually wrong for the current session: a Firebase MCP is now connected (`firestore_*`, `auth_get_users`, `firebase_validate_security_rules`, `developerknowledge_*`) and is directly relevant to Risks #3/#4; the GitHub MCP is configured but fails to connect; browser automation is now an installed project dependency rather than an ad-hoc tool. Re-date all four lines.
7. §7 gains an entry stating where e2e stops, so "none planned" plus a spec on disk stops being ambiguous. Keep the three existing exclusions — Q5 re-confirmed all three.
8. §8 freshness ledger re-dated.
9. Consider extending Risk #5 (not adding a new row) to cover the new local gates failing silently: lefthook's `skip: [merge, rebase]`, the deliberately disabled prettier job, and a per-edit hook that only fires inside an agent session. This is the same "converts a known risk into a believed-safe one" failure mode §5's guidance already names.

### Challenger decisions already taken — do not reopen without new evidence

- No new §2 risk row for "the browser path is untested". E2E is a layer, not a failure scenario; such a row would duplicate Risk #1 and break §1 principle #1 (cost × signal).
- No new abuse row. §2 #3 and #4 already carry the authorization and untrusted-data-at-rest lens; neither the interview nor the diff opens a new abuse surface.
- §1 principle #3 still holds throughout: evidence in Source columns, never `file:line` anchors.
