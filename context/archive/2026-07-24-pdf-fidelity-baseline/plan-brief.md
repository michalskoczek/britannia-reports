# PDF Fidelity Baseline — Plan Brief

> Full plan: `context/changes/pdf-fidelity-baseline/plan.md`

## What & Why

The PRD's hardest guardrail says all four report types must keep producing PDFs a reader would consider visually equivalent, and `src/CLAUDE.md` already declares this a hard rule — but there are no recorded form inputs and no reference PDFs, so the rule has nothing to compare against and the guardrail is unfalsifiable. This change builds that missing barrier before `S-01` (sign-in gating, which touches all four forms) and `S-02` (template apply, which writes into the trimester/semester form's state) start leaning on it.

## Starting Point

Four standalone components each build a `pdfmake` document definition inline and end with `pdfMake.createPdf(dd).download(fileName)`; none has any test coverage. Three of them grow their `FormArray`s through user interaction via component-specific methods, so form state is not reconstructible by `patchValue` alone. pdfmake 0.3.9's `download()` is `async` and every call site ignores the returned promise, which means a document definition that cannot render fails silently in front of the teacher. Five call sites format dates with `toLocaleDateString()` and no locale argument, so identical form input yields different PDFs on differently-configured machines.

## Desired End State

A developer about to touch a report component runs `npm test` and sees eight smoke cases confirm every report type still renders; opens `docs/pdf-fidelity-check.md` and follows a numbered procedure to produce "before" and "after" PDFs from recorded inputs; and compares the trimester/semester output against two PDFs committed in the repository. `src/CLAUDE.md`'s hard rule points at that procedure instead of saying "compare visually" and leaving the reader to invent a method.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Automated layer strength | Smoke only — renders without throwing, no content assertions | Chosen deliberately over a structural snapshot; layout regressions are left to the manual procedure |
| Input replay mechanism | Typed fixture modules consumed by specs; no dev loader in the app | Keeps every line of this change out of the components under the hard rule |
| Fixture format | `.ts` modules, not JSON | `resolveJsonModule` is off in `tsconfig.json`; `shared/testing/translate-testing.ts` is the established helper pattern |
| Reaching array state | Fixtures call the component's own builder methods, then patch | Hand-built rows can diverge from what the UI produces, and a reference PDF of an unreachable state is worse than none |
| Baseline scope | Four report types; rating-scale PDF excluded | Matches F-02 and FR-015–FR-017 literally |
| Fixture coverage | Two per type — minimal and maximal | Covers both sides of the conditional branches; one fixture never catches the "section absent" path |
| Reference PDF storage | Trimester/semester committed; other three regenerated on demand | Concentrates versioned artifacts on the form `S-02` will change; the capture harness makes regeneration one command |
| Date non-determinism | Fix the five call sites to `toLocaleDateString('pl-PL')` | Removes the environment dependency at the root instead of documenting a precondition nobody will honor |
| Procedure location | `docs/pdf-fidelity-check.md`, pointed at from `src/CLAUDE.md` | Agents read `src/CLAUDE.md` first, and the hard rule is already there — it gains a destination rather than a rewrite |
| Dogfooding | Locale fix only; no lint cleanup in `year-report.component.ts` | Keeps the barrier's construction separable from unrelated maintenance |

## Scope

**In scope:** eight fixture modules (4 types × minimal/maximal); a shared interception helper; four smoke specs; a capture harness with its own `angular.json` configuration and npm script; two committed reference PDFs; `docs/pdf-fidelity-check.md`; a `src/CLAUDE.md` hard-rule pointer and folder-map correction; the five-call-site locale fix.

**Out of scope:** structural or value snapshots of the document definition; pixel-diff, text extraction, byte or hash comparison; a dev-only fixture loader; the rating-scale PDF; lint cleanup in `year-report.component.ts`; fixing the unhandled `download()` rejection; any CI gate.

## Architecture / Approach

`pdfMake` is a mutable module object — the components already prove it by assigning `pdfMake.vfs`. A spec can therefore save the original `createPdf`, install a spy that captures the document definition and returns a stub whose `download()` is a no-op, run `generatePDF`, restore, and then call the saved original to render for real. **No production seam is needed.** The capture harness reuses that same interception, differing only in that it calls the real `download()` with a filename derived from the fixture id. That shared mechanism is why phase 2 is cheap once phase 1 lands, and why regenerating the three uncommitted report types is one command rather than forty fields of retyping.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Fixtures, rehydration, smoke | Eight recorded form states + eight passing smoke cases | Reaching array state faithfully in the year-end and Teddy Eddie forms, whose rows carry derived disabled controls |
| 2. Capture, references, procedure | `npm run test:capture`, two committed PDFs, the runbook, the `src/CLAUDE.md` pointer | Capture needs headed Chrome; downloads are discarded under headless |
| 3. Locale fix under the barrier | Five call sites pinned to `pl-PL`, validated through the procedure | Must not start before the reference PDFs are committed, or "before" and "after" describe the same state |

**Prerequisites:** none — F-02 is a foundation with no dependencies. Requires a Chrome running under a `pl-PL` locale to produce the reference PDFs.
**Estimated effort:** ~2–3 sessions, phase 1 being the largest.

## Open Risks & Assumptions

- Smoke-only coverage passes even if every margin, font size, column width, and section ordering changes — the fidelity guardrail rests entirely on a human following the procedure, and nothing in `npm test` notices if they skip it. Adding a structural snapshot later is cheap because the fixtures and interception helper will already exist.
- For three of the four report types the "before" artifact must be reconstructed from history via `git worktree`; this stays reliable only while `npm ci` still resolves for the base commit.
- Reference PDFs are conditional on a `pl-PL` browser until phase 3 lands; other locale-sensitive formatting could be reintroduced later unnoticed.
- A failed render remains invisible to the teacher in production. The smoke layer means it surfaces in a test rather than in the field — a mitigation, not a fix.

## Success Criteria (Summary)

- Any developer touching a report component can run one command to see all four types still render, and follow one document to compare before and after against recorded inputs.
- The trimester/semester form — the one `S-02` will modify — has two versioned reference PDFs in the repository, produced from code that predates any change.
- The first real change to pass through the barrier (the `pl-PL` locale fix) is demonstrably output-neutral on a Polish-locale machine.
