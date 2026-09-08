---
change_id: testing-click-ends-in-file
title: E2E — the download click a teacher makes ends in a file
status: implemented
created: 2026-09-08
updated: 2026-09-08
archived_at: null
---

## Notes

Phase 5 z `context/foundation/test-plan.md` §3 — "The click ends in a file".

- **Covers:** Risk #1, delivery half only. Phase 1
  (`context/changes/testing-pdf-input-space/`) closed the builder half at
  unit/component level; this phase proves the browser half — that the
  download a teacher actually clicks produces a file, and that the page
  stays free of uncaught exceptions on the way there.
- **Ceiling (§7, last exclusion):** no business logic restated at the e2e
  layer. Field ownership and the sex-driven remap → Phase 2; the access
  boundary → Phase 3; PDF fidelity → Phase 4. No visual/pixel diff, no
  vision/VLM (§4 keeps it unscheduled).
- **Harness already on disk:** `@playwright/test` 1.63, `playwright.config.ts`
  (deliberately no `webServer`), `test/e2e/seed.spec.ts`, `test/e2e/fixtures/`,
  `test/e2e/auth-session.mjs`. Needs `npm run emulators` + `npm start` running
  and a hand-captured session (`npm run e2e:auth:save` / `e2e:auth:restore`);
  `fullyParallel` is off because specs share one teacher account and roster.
  Run with `npm run e2e`.
- **Not a gate yet.** Wiring e2e into CI belongs to Phase 6 — this phase only
  builds the layer.
- **Scope settled after research (2026-09-08)** — see `research.md` §Decisions:
  `seed.spec.ts` counts as the *pattern*, not as coverage — and is excluded from
  runs by `testIgnore` in `playwright.config.ts` (applied 2026-09-08, ahead of the
  plan), keeping its name so ESLint and `tsc` still check it. So this phase writes
  **four** delivery specs, one per report type including semester. Each fills
  `studentName` and asserts the download; none writes to the roster, so none
  needs the picker or the `student` fixture. The Teddy Eddie download button
  renders `PDF` (a missing translate key, `[translateKey]="'PDF'"`) — specs are
  written against that name and the defect is left to a separate change.
- **On landing:** fill §6.7 "Writing an end-to-end test" and append a §6.6
  phase note; update the §3 Phase 5 row (Status + Change folder).
