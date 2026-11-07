# The Click Ends In A File — Plan Brief

> Full plan: `context/changes/testing-click-ends-in-file/plan.md`
> Research: `context/changes/testing-click-ends-in-file/research.md`

## What & Why

Four Playwright specs, one per report type, each proving that the download control a teacher
actually clicks ends in a real PDF file and that the page stays free of uncaught exceptions
getting there. This is the **delivery half of Risk #1** — "a teacher fills a complete report,
clicks download, and no PDF appears… the error reaches the browser console only." Phase 1 closed
the builder half at the unit layer; this closes the half no cheaper layer can see.

## Starting Point

The unit harness **replaces `pdfMake.createPdf` wholesale** (`render-pdf.ts:29-36`) — its
`download()` is an inert stub, and every report spec stops at `.getBlob()`. So the click wiring,
the real `.download()` call, and the browser's file delivery have never executed in any test, for
any of the four report types. The Playwright harness exists (config, fixtures, session capture)
but `npx playwright test --list` reports **zero tests**: `seed.spec.ts` was excluded from runs on
2026-09-08 because it is the exemplar, not coverage.

## Desired End State

`npm run e2e` runs four green specs covering the download path of every report type this product
ships. Each one fails if its report's download click stops producing a file, confirmed by a
deliberate break rather than assumed. `test-plan.md` §6.7 records how to write the fifth.

## Key Decisions Made

| Decision | Choice | Why | Source |
|---|---|---|---|
| What e2e may assert | Delivery, never generation | §7's ceiling — Phase 1's fixtures own every input-state claim | Research |
| `seed.spec.ts` status | Pattern, not coverage; `testIgnore`d | It is the quality lever generated specs are modelled on | User |
| Spec count | Four — one per report type | Each type wires its click differently; semester included since seed isn't coverage | User |
| File layout | Four files, one test each | Matches the skill default; failure names the report from the filename | User |
| Filename assertion | Full equality, with a per-run stamp | The name is also the evidence the file belongs to this run | User |
| Shared helper | None — duplicate per spec | Each spec reads standalone, which matters for an exemplar-driven layer | User |
| Teddy Eddie button | Write against `'PDF'`, don't fix | Fixing changes the accessible name; defect gets its own change folder | User |
| Roster writes | None; no `student` fixture | Only semester has the picker, so no spec needs it — designs out the isolation hazard | Research |
| Picker coverage | Accepted gap, recorded | Risk #2 territory, owned by §3 Phase 2 at a cheaper layer | User |
| Docs | Separate final phase | `lessons.md`: a phase after a documentation phase falsifies it | User |

## Scope

**In scope:** four delivery specs; a change folder recording the Teddy Eddie translate-key defect;
§6.7 cookbook entry, §6.6 phase note, §3 Phase 5 row.

**Out of scope:** any production code change; Phase 1's input-space claims; the untouched-form
`null` filename (Risk #2); picker/quick-add; PDF content, layout or fidelity (Phase 4); field
ownership and the sex remap (Phase 2); the access boundary (Phase 3); CI wiring (Phase 6).

## Architecture / Approach

Phases group reports by **gate shape**, because the gate and the click wiring vary together:

```
GATED     semester, Cambridge   (ngSubmit) + [type]=submit + [disabled]="form.invalid"
                                → fill validator floor → wait toBeEnabled() → click → catch download
UNGATED   year-end, Teddy Eddie  no validators, no [disabled]
                                → fill studentName → click → catch download
                                  (Teddy Eddie: no <form> at all, (clicked)="downloadPDF()")
```

Everything else is uniform: tab-based navigation (no routes per report), `app-button`, and the
same `nameAndLastNameStudent` → "Imię i nazwisko ucznia" label in all four.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Gated reports | `semester-download.spec.ts`, `cambridge-download.spec.ts` | Semester's `sex`-before-marks ordering — `markOptions()` rewrites the six marks when `sex` changes |
| 2. Ungated reports | `year-end-download.spec.ts`, `teddy-eddie-download.spec.ts`, defect change folder | Teddy Eddie's button is named `PDF`; a carried-over `'Generuj PDF'` locator finds nothing. Filename shape with spaces + `ń` is unproven against a real download |
| 3. Documentation | §6.7 entry, §6.6 note, §3 Phase 5 row, picker-gap record | Editing one section of `test-plan.md` leaves another contradicting it |

**Prerequisites:** `npm run emulators` and `npm start` both running; a hand-captured signed-in
session (`npm run e2e:auth:save`). The config starts neither on purpose.

**Estimated effort:** ~2-3 sessions across 3 phases; Phase 1 is the largest because it establishes
the shape the other specs copy.

## Open Risks & Assumptions

- **The year-end / Teddy Eddie filename is asserted before it is observed.** Their names retain
  spaces and a diacritic, unlike the semester shape `seed.spec.ts` proved. The plan requires
  reading the real `suggestedFilename()` during VERIFY and recording any transformation — never
  weakening the assertion to a substring to make it pass.
- **The suite cannot run unattended.** Two processes plus a hand-captured session; §5 already
  records that it "cannot be lifted into CI naively." Phase 6 owns that problem.
- **One shared teacher account, `fullyParallel: false`.** These specs write nothing to the roster,
  so the hazard in `lessons.md` is designed out rather than managed — but that holds only as long
  as no future spec starts writing.
- **Fixing the Teddy Eddie defect will break its spec.** That coupling is recorded in the new
  change folder so whoever fixes it updates both together.

## Success Criteria (Summary)

- Clicking download in any of the four report types produces a real PDF file, proven in a browser.
- Each spec goes red when the behaviour it protects is deliberately broken.
- A contributor can add a fifth spec from §6.7 without reading this plan.
