<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: PDF Fidelity Baseline

- **Plan**: `context/changes/pdf-fidelity-baseline/plan.md`
- **Scope**: Phases 1–3 of 3 (full plan)
- **Date**: 2026-07-24
- **Verdict**: APPROVED
- **Findings**: 0 critical, 1 warning, 3 observations
- **Commits reviewed**: `2fd5d1e` (p1), `a582683` (p2), `6046db6` (p3), `0ed35ac` (epilogue)

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Success criteria re-verification

All automated criteria re-run against the committed tree:

| Command | Result |
|---|---|
| `npm run lint` | PASS — "All files pass linting." |
| `npm test -- --watch=false --browsers=ChromeHeadless` | PASS — TOTAL: 13 SUCCESS (5 pre-existing + 8 smoke) |
| `npm run build` | PASS |
| `npm run build -- --configuration development` | PASS |
| `npm run test:capture` | PASS — TOTAL: 8 SUCCESS, eight PDFs written |

Capture-spec exclusion verified: the default run executes 13 specs and never the capture harness.
`docs/pdf-fidelity/captured` is gitignored (`.gitignore:14`); only the two reference PDFs are tracked.

Manual criteria: all 13 rows across the three phases are `[x]` and each has observable evidence in the
diff — fixtures drive component methods (no hand-built `FormArray` rows), the trimester/semester fixtures
leave all fourteen arrays empty, the references are committed, and `src/CLAUDE.md` points at the
procedure. No rubber-stamping found.

## Notable positive

The barrier caught a live production bug in its first phase. The year-end report's teacher `mat-select`
used `*ngFor` while `NgFor` was never in the standalone component's `imports` array — verified by
restoring the pre-change template and re-running the spec, which fails with
`NG0303: Can't bind to 'ngForOf' since it isn't a known property of 'mat-option'`. The dropdown rendered
**no options at all** in production; a teacher could not pick a signature. AOT (`npm run build`) passes on
the broken template, so only rendering the component under TestBed surfaced it. This is exactly the class
of defect F-02 was funded to catch, found before the barrier was even finished.

## Findings

### F1 — Two approved out-of-plan adaptations are recorded only in commit messages

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `context/changes/pdf-fidelity-baseline/plan.md` (§ "What We're NOT Doing"), `karma-capture.conf.js`, `src/app/year-report/year-report.component.html:448`
- **Detail**:
  Two changes outside the plan's "Changes Required" were made, disclosed in their commit bodies, and
  approved at the time:

  1. `src/app/year-report/year-report.component.html` — `*ngFor` → `@for` on the signature select
     (commit `2fd5d1e`: *"Out-of-plan production fix, approved during the phase."*).
  2. `karma-capture.conf.js` — a 72-line Karma config seeding a Chrome profile that grants
     `automatic_downloads` and pins the download directory (commit `a582683`: *"karma-capture.conf.js is
     an adaptation: Chrome allows only the first automatic download per page, so seven of the eight PDFs
     were silently dropped."*). Phase 2's contract named only `angular.json` and `package.json`.

  Both are justified. The problem is that the plan document does not record either, and its
  "What We're NOT Doing" section still reads as though `year-report` was untouched outside one phase-3
  expression ("No lint cleanup in `year-report.component.ts` … Phase 3 changes exactly one expression in
  that file"). A reader working from the plan alone — including `/10x-archive` and the next change to
  touch year-report — will not know a production template was modified. `context/foundation/lessons.md`
  ("Updating a document includes the sections the new content contradicts") applies directly.

  Secondary maintenance note for `karma-capture.conf.js`: it reproduces the CLI's built-in
  frameworks/plugins/reporters block because setting `karmaConfig` makes `@angular/build:karma` stop
  supplying its own. That is correctly commented in the file, but it means an Angular upgrade can drift
  the capture run away from the default run silently.
- **Fix**: Append an "Adaptations" subsection to the plan naming both changes, why each was necessary, and
  the commit that carries it — then loosen the `year-report` sentence in "What We're NOT Doing" to
  reference it.
  - Strength: Restores the plan as an accurate record without rewriting history; matches the disclosure
    discipline the lessons register already mandates.
  - Tradeoff: None material — a documentation edit to an already-closed change.
  - Confidence: HIGH — both adaptations are fully evidenced in commit bodies and reproducible.
  - Blind spot: None significant.
- **Decision**: FIXED — `## Adaptations` section added to `plan.md` (entries 1–2) and the
  `year-report` bullet in "What We're NOT Doing" now points at it.

### F2 — `FormArray` fixtures can silently truncate if the underlying static data shrinks

- **Severity**: 📝 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `src/app/shared/testing/pdf-fidelity/fixtures/year-report.fixture.ts:55`, `src/app/shared/testing/pdf-fidelity/fixtures/teddy-eddie-report.fixture.ts:49`
- **Detail**:
  The maximal year and Teddy Eddie fixtures build rows by calling `setClasses` / `setTableTE`, then patch
  values onto them with `form.patchValue({ developmentLanguageSkillsArray: [...6 rows] })`. Angular's
  `FormArray.patchValue` iterates the *supplied* array and applies each entry only `if (this.at(index))`
  — entries beyond the array's current length are silently discarded, and a shorter array leaves the
  remaining controls untouched.

  So the fixtures depend on `setClasses(classes[6].value)` yielding exactly 6 rows and
  `setTableTE('5 lat')` yielding 3, and nothing asserts it. If `development-path.ts` or
  `select-values.ts` changes those counts, the "maximal" fixture quietly records fewer rows, the smoke
  suite stays green (it only asserts a non-empty PDF), and the reference PDFs silently stop describing
  the state their labels claim. Manual criteria 1.5/1.6 verified branch coverage once, at implementation
  time; nothing re-verifies it.

  This is consistent with the plan's deliberate smoke-only choice, but it is a specific silent-degradation
  path the plan did not consider — and it degrades the *fixtures*, which the whole barrier rests on,
  rather than the assertions.
- **Fix**: Add a length assertion to each maximal fixture immediately after the builder call — e.g.
  `if (component.developmentLanguageSkillsArray.length !== 6) throw new Error(...)` — so a row-count
  change fails loudly at the fixture rather than silently shrinking the recorded state.
  - Strength: Costs two lines per fixture, needs no new infrastructure, and converts a silent
    degradation into a named failure at the exact point of breakage.
  - Tradeoff: Couples the fixture to a magic number that must be updated deliberately — which is the
    point, but it is one more thing to maintain.
  - Confidence: HIGH — `FormArray.patchValue`'s skip-if-absent behaviour is verified in Angular's source
    and directly reachable from these two call sites.
  - Blind spot: Have not audited whether other static-data tables feed row counts indirectly.
- **Decision**: SKIPPED — consistent with the plan's deliberate smoke-only scope. The silent-truncation
  path stays a known, accepted risk of the fixtures.

### F3 — Interception helper and year fixture deviate from the shapes the plan prescribed

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/app/shared/testing/pdf-fidelity/render-pdf.ts:45`, `src/app/shared/testing/pdf-fidelity/fixtures/year-report.fixture.ts:32`
- **Detail**:
  Two deviations from explicit plan contracts, both of which improve on the plan:

  1. The plan specified `spyOn(pdfMake, 'createPdf')` and included the snippet, calling it *"the one
     non-obvious part of this change"* that *"every later phase depends on"*. The implementation instead
     saves and restores `createPdf` manually inside `try/finally`, and captures the original at module
     load. This restores correctly when `generate()` throws (a Jasmine spy would too, but only at spec
     teardown) and keeps the helper usable outside a spy-managed context. It also adds a third export,
     `downloadDefinition`, which the plan's phase-2 contract implied but never named.
  2. The plan told the year fixture to call `initClassesFromFirstSelectedClass`. It calls `setClasses`
     instead — which is what the template's `(click)` handler actually invokes
     (`year-report.component.html:34`) and which delegates to `initClassesFromFirstSelectedClass` at
     `:194`. This is *more* faithful to the plan's own "fixtures must drive the component, not construct
     controls" rule than the plan's own instruction was.

  Neither is a defect. They are flagged because the plan's prescribed shapes are now wrong, and a future
  reader comparing plan to code may "correct" the better implementation back to the worse one.
- **Fix**: Note both deviations in the same plan "Adaptations" subsection F1 creates.
- **Decision**: FIXED — recorded as entries 3–4 of `## Adaptations` in `plan.md`, both marked
  "deliberate; do not revert".

### F4 — Dead `indexClass` assignment in `setClasses` (pre-existing, surfaced by review)

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/app/year-report/year-report.component.ts:190`
- **Detail**:
  `setClasses` computes `this.indexClass = newClasses.findIndex(r => r.value === this.form.getRawValue()['class'])`.
  For the year report the `class` control holds the whole `{ label, value }` object, so this compares a
  string against an object and always yields `-1`. The value is then immediately overwritten by
  `initClassesFromFirstSelectedClass` at `:134` before the only read at `:139`, so the bug is inert.

  Pre-existing on `master`, not introduced by this change, and explicitly out of scope per the plan
  ("No lint cleanup in `year-report.component.ts`"). Recorded so the next change that touches year-report
  — `S-01` or the deferred lint cleanup — does not have to rediscover it.
- **Fix**: No action in this change. Carry into the year-report cleanup change, where the PDF-fidelity
  procedure will already be running.
- **Decision**: SKIPPED — carried forward. Pre-existing and inert; this report is the record for the
  next change that touches `year-report.component.ts` (`S-01` or the deferred lint cleanup).
