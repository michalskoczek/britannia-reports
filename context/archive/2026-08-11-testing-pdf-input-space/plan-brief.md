# PDF generation survives the real input space — Plan Brief

> Full plan: `context/changes/testing-pdf-input-space/plan.md`
> Research: `context/changes/testing-pdf-input-space/research.md`

## What & Why

Phase 1 of the test rollout, covering Risk #1: a teacher fills a report, clicks download,
and no PDF appears because the builder throws on input they could legitimately enter.
Research confirmed two such crashes exist today in the year-end report — and the test suite
is green over both.

## Starting Point

The PDF-fidelity harness is stronger than the test plan credits it with: it intercepts
`pdfMake.createPdf`, restores it through `try/finally`, and renders eight fixtures through
real pdfmake to a `Blob`, asserting `%PDF` magic bytes. What is missing is not machinery but
inputs — the fixtures were hand-authored to reach states that work, and
`year-report.fixture.ts:9-11` documents the `class` crash in prose while stepping around it.

## Desired End State

Every state a teacher can reach through the UI produces a PDF, proven per report type. The
two confirmed crashes are fixed by guards narrow enough that no previously-working state
changes. The reachability argument that makes "untouched form" untestable on two of the four
forms is itself asserted rather than assumed in a comment.

## Key Decisions Made

| Decision | Choice | Why | Source |
|---|---|---|---|
| Remedy for the two throws | Null-safety in the builder | A crash cannot be the behaviour FR-015 was written to preserve; adding validators would change what a teacher may enter | Plan (user) |
| Scope of the fix | All four builders | Close the defect class product-wide, not only where research found a crash | Plan (user) |
| How the sweep is executed | Test-first; a guard lands only under a red test | Every line added to a guardrailed file has a named reachable state and a failing assertion behind it | Plan |
| Empty year-end detail table | Suppress the whole table node | Seven ticked checkboxes are an explicit "no rows"; a placeholder inserts content the teacher removed, a header row would change every state's PDF | Plan (user) |
| Edge fixtures | Separate `fixtures/edge/` modules | `yearFixtures` also feeds the capture harness, where `id` becomes a reference-PDF filename | Plan |
| Gated forms (Cambridge, semester) | Minimal-valid floor + explicit gate assertions | Specs bypass `[disabled]`, so an untouched-form test would assert an unreachable state | Plan (user) |
| Long text / non-ASCII | Test, asserting only that a PDF was produced | Risk #1 names both; no source sets any expectation, so a stronger assertion would invent a requirement | Plan (user) |
| Fidelity guardrail | Argued by invariant, no capture run | Guards change behaviour only in states that throw today, so every renderable state stays byte-identical | Plan (user) |
| `"null"` leakage, F2 hole, dead branches | Out of scope, recorded | A file *is* produced, so leakage is Risk #2; F2 belongs to the fidelity phase | Research + Plan |

## Scope

**In scope:** the two confirmed year-end crashes; edge-state coverage for all four report
types; gate assertions on the two gated forms; long-text and non-ASCII cases; §6.1 cookbook
and the §2 correction research surfaced.

**Out of scope:** the failure-UX half of Risk #1; `"null"` / `"undefined"` string leakage
(Risk #2); validators or submit gates on the year-end form; the dead branches at
`year-report.component.ts:348-365`; the F2 fixture-shrink hole; running the fidelity capture.

## Architecture / Approach

New `fixtures/edge/` modules record reachable states the fidelity fixtures deliberately
avoid, using the existing `ReportFixture` contract. Each report's spec gains a describe block
that applies them, captures the definition, and **renders** it — the rendering half is not
optional, because the empty-table crash happens inside pdfmake's measurement pass and a
capture-only assertion would pass straight over it. Guards then land in the builders, one red
test at a time.

## Phases at a Glance

| Phase | What it delivers | Key risk |
|---|---|---|
| 1. Edge seam + `class` guard | Fixture seam, red test for the untouched year-end form, guard at `:409` | A guard written wider than the crashing state silently breaks the fidelity invariant |
| 2. Empty detail table | Table node suppressed when every row is deleted | Expressing "no node" inside a pdfmake content array is not obvious; `null` is not it |
| 3. Reachability sweep | Edge coverage for Cambridge, semester, Teddy Eddie; guards only where red | Fixture floors must be derived per form; copying one across reports makes it unreachable |
| 4. Gate pinning | Untouched-is-invalid and control-is-disabled assertions | Overlaps slightly with what §3 Phase 6 will enforce via CI (written as Phase 5; the gates phase was renumbered to 6 by the 2026-09-08 test-plan refresh) |
| 5. Undocumented input classes | Long-text and non-ASCII cases | A pass proves no throw, not that diacritics rendered |
| 6. Documentation | §6.1 cookbook, §2 correction, invariant recorded, statuses closed | Prose that nothing verifies — the exact failure this phase is fixing |

**Prerequisites:** none. Everything lives in the default headless suite; no headed Chrome,
no emulator, no JDK.
**Estimated effort:** ~2–3 sessions. Phases 1–3 suit `/10x-tdd` — each has a first red test
nameable in one sentence. Phases 4–6 suit `/10x-implement`.

## Open Risks & Assumptions

- The fidelity invariant is checked by reading each guard, not by comparing files. One guard
  written more broadly than its crashing state breaks it without any test noticing.
- The scope is four builders but the licence to change code is a red test, so Phases 3 may
  legitimately end with tests and no builder changes on some reports. That outcome gets
  recorded rather than treated as a shortfall.
- Non-ASCII coverage asserts renderability only. Missing glyphs would render as blanks and
  pass — the real failure mode stays uncovered, deliberately, for want of a source.
- Edge fixtures roughly double the rendered cases in the default suite; each embeds the
  Roboto VFS and the banner, so suite runtime grows.

## Success Criteria (Summary)

- Opening the year-end tab and clicking download with nothing filled produces a PDF.
- Suppressing every detail row produces a PDF with no detail table.
- A filled year-end report produces a PDF identical to the one it produced before this change.
