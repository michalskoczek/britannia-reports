# PDF generation survives the real input space — Implementation Plan

## Overview

Phase 1 of `context/foundation/test-plan.md` §3, covering Risk #1: a teacher fills a
report, clicks download, and no PDF appears because the builder throws on input they
could legitimately enter.

Research confirmed the risk is not hypothetical — two reachable crashes exist today in
the year-end report, and the suite is green over both. This plan closes them and builds
the coverage that would have caught them, working **test-first**: no guard is added to a
PDF builder without a red test standing behind it.

## Current State Analysis

The gap is not missing machinery. `src/app/shared/testing/pdf-fidelity/render-pdf.ts`
already intercepts `pdfMake.createPdf`, restores it through `try/finally` (so a builder
that throws mid-call surfaces its real error), and renders captured definitions through
real pdfmake to a `Blob`. Four specs assert `%PDF` magic bytes over eight fixtures.

The gap is that **the recorded inputs are a curated safe path, not a map of the reachable
state space** — and in one case the fixture says so out loud
(`year-report.fixture.ts:9-11` documents the `class` crash and sets the field to step
around it).

Two confirmed crashes, both in `src/app/year-report/year-report.component.ts`, both on the
one form with zero validators and no submit gate:

- **A1** — `` `${form.value.class.value}` `` (`:409`). The control binds the whole
  `{label, value}` object, defaults to `null` (`:764`), carries no validator. Opening the
  year-end tab and clicking download is the entire reproduction.
- **A2** — `getBodyInSkills` (`:650-746`) builds a table body from seven independently
  suppressible rows with no unconditional header and no `headerRows`. All seven deleted
  gives `body: []`, and pdfmake 0.3.9 reads `node.table.body[0].length` unguarded
  (`pdfmake.js:4083`). This is the only table in the codebase with no structural floor on
  row count.

Submit gating differs across the four forms and the asymmetry reads as drift, not design:
semester/trimester has 9 validators and `[disabled]="form.invalid"`, Cambridge has 1 and
the same gate, year-end and Teddy Eddie have zero validators and no gate at all. The
`[required]` inputs on the shared form wrappers are display-only — they drive an asterisk
and an aria attribute, and attach no validator.

## Desired End State

Every state a teacher can reach through the UI produces a PDF document, and a spec proves
it for each of the four report types. The two confirmed crashes are fixed by narrow guards
that change behaviour **only** in states that throw today. The reachability argument that
makes "untouched form" untestable on two of the forms is itself asserted rather than
assumed.

Verified by: `npm test -- --watch=false --browsers=ChromeHeadless` green, including new
edge-state cases that are red before their guard lands.

### Key Discoveries

- `capturePdfDefinition` alone would not catch A2 — the definition object builds fine and
  the throw happens inside pdfmake's measurement pass. **Any test asserting "a document is
  produced" must call `renderToBlob`, not just capture** (`render-pdf.ts:64-66`).
- `yearFixtures` is not test data — it is shared input to two runners. The same array feeds
  `npm test` and the capture harness (`pdf-fidelity-capture.spec.ts`), where `id` becomes a
  reference-PDF filename. Adding edge states there would grow the manual fidelity procedure
  in `docs/pdf-fidelity-check.md` with documents nobody reviews.
- Specs call `component.generatePDF(component.form)` directly, bypassing
  `[disabled]="form.invalid"`. On Cambridge and semester/trimester an "untouched form" test
  would therefore assert a state a teacher cannot reach, violating the fixture contract at
  `report-fixture.ts:5-8` ("`apply` must reach that state the way the UI reaches it").
- Teddy Eddie has zero validators, no gate, and `(clicked)="downloadPDF()"` rather than a
  submit form (`teddy-eddie-report.component.html:38`). An untouched Teddy Eddie form **is**
  reachable, so it is a legitimate test there and not on the other two.
- `year-report.component.spec.ts` already holds two `describe` blocks — the fidelity smoke
  and a frozen form-model contract listing 31 controls. New cases join this file.
- A state-space test that enumerates `Object.keys(form.controls)` would walk large dead
  surface: 22 never-bound controls on semester/trimester, 22 on Cambridge (over half), 4 on
  Teddy Eddie. The builder reads none of them.

## What We're NOT Doing

- **The failure-UX half of Risk #1.** Surfacing a user-visible error when generation fails
  is a separate change (recorded in `change.md` at research time).
- **The `"null"` / `"undefined"` string leakage** (research §C). A file *is* produced there,
  so it belongs to Risk #2, not to "no PDF appears". Carry `addSpaceAfterTeacher` forward as
  the sharpest instance — it is unguarded in three of four reports and no submit gate
  mitigates it, because `teachers` has no validator anywhere.
- **Adding validators or a submit gate to the year-end form.** The remedy is null-safety;
  this was decided explicitly against FR-015 (see `change.md` § Decisions after research).
- **The dead branches at `year-report.component.ts:348-365`**, which test
  `certificationPurposeYES` / `certificationPurposeNO` — controls `createForm` never
  declares. Recorded, not touched.
- **The F2 fixture-shrink hole.** `FormArray.patchValue` silently discards entries beyond
  the current array length, so a static-data change could shrink a *maximal* fixture with
  the suite staying green (`pdf-fidelity-baseline/reviews/impl-review.md:93-127`). It is a
  property of the maximal fidelity fixtures and the capture harness, so it belongs to §3
  Phase 4 (year-end fidelity baseline), not here. The edge fixtures this plan adds do not
  populate FormArrays, so they are not exposed to it.
- **Running the fidelity capture procedure.** See the invariant below.

## Implementation Approach

**Test-first, guard only under red.** Every builder change lands after a test that fails
without it. This is what makes a change to a file under the PDF-fidelity guardrail
defensible: each added line has a named reachable state and a failing assertion behind it.
Scope covers all four builders, but the *sweep* is executed as tests — the other three
report types get edge-state coverage, and a guard only if their test actually goes red.

**Fidelity is preserved by construction, not by comparison.** Every guard must satisfy:

> The guard changes behaviour **only** in states that throw today.

If it holds, every state that currently produces a PDF produces a byte-identical PDF, so
the unreliable year-end baseline (Risk #6, §3 Phase 4 not started) never enters the
argument. This replaces running `docs/pdf-fidelity-check.md` for this change. The invariant
is per-guard and is checked by reading each guard — a guard written more broadly than the
crashing state breaks it silently, which is why Phase 6 records it in writing.

**Oracle discipline on undocumented input classes.** The PRD names exactly one required
field across all four forms (`prd.md:115`). For long free text and non-ASCII names — Risk
#1 names both, no source sets any expectation — the only assertion is that a PDF is
produced. No length bound, no glyph claim.

## Critical Implementation Details

**A2's suppression happens at the content array, not inside the table node.**
`generateStudentLanguageDetails` is an element of the `content` array (`:442`), so "no
table" has to be expressible at that position. A bare `null` in a pdfmake content array is
not a safe way to express absence — the omission belongs where the array is assembled, or
in a node pdfmake treats as empty. The test is what settles which; do not assume.

---

## Phase 1: Edge-fixture seam and the year-end `class` guard

### Overview

Establish the edge-state fixture surface as something separate from the fidelity fixtures,
and use it to red-test and fix A1.

### Changes Required

#### 1. Edge-fixture module for the year-end report

**File**: `src/app/shared/testing/pdf-fidelity/fixtures/edge/year-report.edge.fixture.ts`

**Intent**: Record year-end states that are reachable but currently break generation, kept
out of `yearFixtures` so the capture harness and the manual fidelity procedure are
unaffected.

**Contract**: Exports `yearEdgeFixtures: ReportFixture<YearReportComponent>[]`, reusing the
existing `ReportFixture` interface unchanged. First entry: an untouched form — `apply` is a
no-op, matching "open the tab, type nothing, click download". The module doc comment must
state why this file exists separately from `year-report.fixture.ts`, since that separation
is otherwise invisible.

#### 2. Red test for the untouched year-end form

**File**: `src/app/year-report/year-report.component.spec.ts`

**Intent**: Assert a PDF is produced for every edge fixture, using the same capture →
render → `%PDF` shape as the existing smoke block.

**Contract**: A new `describe('YearReportComponent — reachable edge states')` iterating
`yearEdgeFixtures`. Must render through `renderToBlob`, not stop at `capturePdfDefinition`.
Raises `jasmine.DEFAULT_TIMEOUT_INTERVAL` to 30s like the existing block. Red before the
next change: `TypeError: Cannot read properties of null (reading 'value')`.

#### 3. Null guard at the `class` read

**File**: `src/app/year-report/year-report.component.ts`

**Intent**: Make the class cell tolerate an unset control instead of throwing.

**Contract**: `:409` only. The guard must leave output unchanged for every non-null `class`
— that is the fidelity invariant, and the existing `year-minimal` / `year-maximal` cases
are what demonstrate it.

#### 4. Correct the fixture prose that documented the crash

**File**: `src/app/shared/testing/pdf-fidelity/fixtures/year-report.fixture.ts`

**Intent**: The doc comment at `:9-11` says leaving `class` null "throws before pdfmake is
ever called, which is why even the minimal fixture sets it". Once guarded that is false, and
leaving it would send the next reader stepping around a crash that no longer exists.

**Contract**: Rewrite that paragraph to state the object-vs-string binding difference (still
true and still load-bearing) and point at the edge fixture for the null case. Do not change
either fixture's recorded values — they are fidelity inputs.

### Success Criteria

#### Automated Verification

- Year-end spec passes: `npm test -- --include='**/year-report.component.spec.ts' --watch=false --browsers=ChromeHeadless`
- Full suite passes: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`

#### Manual Verification

- The edge test was observed failing with the `class` TypeError before the guard landed, and passing after.
- Reading the guard confirms it alters output only when `class` is null.

---

## Phase 2: The empty year-end detail table

### Overview

Red-test and fix A2 — seven "delete" checkboxes ticked, empty table body, pdfmake throws
during measurement.

### Changes Required

#### 1. Edge fixture for the all-rows-deleted state

**File**: `src/app/shared/testing/pdf-fidelity/fixtures/edge/year-report.edge.fixture.ts`

**Intent**: Record the state where a teacher suppresses every detail row.

**Contract**: Second entry in `yearEdgeFixtures`, setting all seven `*Delete` controls true:
`eofEvaluationDelete`, `frequencyDelete`, `certificationPurposeOnThisYearDelete`,
`readinessToContinueOnNextLevelDelete`, `examRecommendationInTableDelete`,
`parentDecisionDelete`, `recommendationInNextYearInTableDelete`. Each is an ordinary
`mat-checkbox` defaulting to `false`, so this reaches the state the way the UI does.

#### 2. Suppress the table node when the body is empty

**File**: `src/app/year-report/year-report.component.ts`

**Intent**: When every row is suppressed, emit no detail table rather than an empty one.
Chosen over a placeholder row (which inserts content the teacher explicitly removed) and
over adding a header row (which would change the PDF for every state, not just this one, and
would breach the fidelity guardrail).

**Contract**: `getBodyInSkills` (`:650-746`) keeps its current shape and return type. The
change is at `generateStudentLanguageDetails` (`:748-756`) and its call site in the content
array (`:442`): an empty body must yield no table node at that position. See "Critical
Implementation Details" — a bare `null` content entry is not the way to express this.

### Success Criteria

#### Automated Verification

- Year-end spec passes: `npm test -- --include='**/year-report.component.spec.ts' --watch=false --browsers=ChromeHeadless`
- Full suite passes: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`

#### Manual Verification

- The test was observed failing inside pdfmake (`body[0].length`) before the fix, proving the case reaches the measurement pass rather than the builder.
- `year-maximal`, which deletes exactly one row, still renders its table with the remaining six — the suppression triggers only at zero.

---

## Phase 3: Reachability sweep across the other three reports

### Overview

Extend edge coverage to Cambridge, semester/trimester and Teddy Eddie. Guards land only
where a test actually goes red — the scope is four builders, the licence to change code is
a failing assertion.

### Changes Required

#### 1. Edge fixtures for the three remaining report types

**Files**:
- `src/app/shared/testing/pdf-fidelity/fixtures/edge/teddy-eddie-report.edge.fixture.ts`
- `src/app/shared/testing/pdf-fidelity/fixtures/edge/cambridge-report.edge.fixture.ts`
- `src/app/shared/testing/pdf-fidelity/fixtures/edge/semestr-report.edge.fixture.ts`

**Intent**: Record the leanest state each form can legitimately be downloaded from, plus the
optional-section-untouched states around it.

**Contract**: Same `ReportFixture` shape. The lean state differs per report and the
difference is the point:
- **Teddy Eddie** — an untouched form. Zero validators, no gate, `(clicked)` rather than a
  submit form, so this is genuinely reachable.
- **Cambridge** — `studentName` only. Its single validator plus `[disabled]="form.invalid"`
  make anything less unreachable.
- **Semester/trimester** — the nine required controls and nothing else: `reportType`,
  `studentName`, `sex`, and the six descriptive marks.

Each fixture's label must name why that state is the floor, so a later reader does not
"simplify" a fixture into an unreachable one.

#### 2. Edge-state specs for the three report components

**Files**: `teddy-eddie-report.component.spec.ts`, `cambridge-report.component.spec.ts`,
`semestr-report.component.spec.ts`

**Intent**: Same assertion as Phase 1, per report type.

**Contract**: Mirror the existing smoke block's bootstrapping in each file.
`SemestrReportComponent` additionally needs `semestrReportTestingProviders()`
(`semestr-report-testing.ts:28-50`) for its Firestore-backed panels; the other two mount no
Firebase surface.

#### 3. Guards for whatever goes red

**Files**: the affected `*-report.component.ts`

**Intent**: Fix what the tests actually find.

**Contract**: Each guard obeys the same invariant as Phase 1 — behaviour changes only in the
state that throws. If no test goes red, no builder changes, and that outcome is recorded in
Phase 6 rather than papered over with speculative guards.

### Success Criteria

#### Automated Verification

- All four report specs pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`

#### Manual Verification

- Every builder line changed in this phase has a named failing test behind it; none was added by inspection alone.
- The three lean fixtures were checked against their form's validators — each is the actual floor, not a guess.

---

## Phase 4: Pin the gates that make "untouched" unreachable

### Overview

Phase 3 declines to test untouched Cambridge and semester/trimester forms because the submit
gate makes that state unreachable. That reasoning is currently prose. Assert it, so removing
a gate turns a silent widening of the input space into a failing test.

### Changes Required

#### 1. Gate assertions for the two gated forms

**Files**: `cambridge-report.component.spec.ts`, `semestr-report.component.spec.ts`

**Intent**: Prove the gate is what makes an untouched form undownloadable — the premise the
edge-fixture floors rest on.

**Contract**: Per form, two assertions on a freshly created component: the form is `invalid`
untouched, and the rendered download control is disabled. Templates bind
`[disabled]="form.invalid"` at `semestr-report.component.html:408` and
`cambridge-report.component.html:285`; assert the rendered state rather than the binding
text. A short comment must connect these to the edge fixtures they justify.

### Success Criteria

#### Automated Verification

- Both specs pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`

#### Manual Verification

- Temporarily removing `[disabled]` from one template turns the new test red (revert after checking).

---

## Phase 5: Input classes with no documentary basis

### Overview

Risk #1 names long free text and non-ASCII names as input classes. No source sets any
expectation for either. Cover them with the only assertion the sources support.

### Changes Required

#### 1. Long-text and non-ASCII edge fixtures

**Files**: the four `edge/*.edge.fixture.ts` modules

**Intent**: Reach both classes on every report type.

**Contract**: Per report, one fixture with long free text in that report's comment /
free-text controls, and one with Polish diacritics in the name fields — the PRD's own
example name is `Jaś`. Assertion is renderability only: no length bound, no claim about
glyph rendering. Fixture labels must say the assertion is deliberately weak and why, so a
later reader does not mistake a passing test for proof the characters rendered correctly.

### Success Criteria

#### Automated Verification

- Full suite passes: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`

#### Manual Verification

- One long-text PDF opened by hand to confirm text flows rather than overflowing off-page — recorded as an observation, not converted into an assertion.

---

## Phase 6: Documentation and plan sync

### Overview

Record what the phase taught, correct what it contradicts, and close the rollout row.

### Changes Required

#### 1. Cookbook entry

**File**: `context/foundation/test-plan.md` §6.1

**Intent**: Replace "TBD — see §3 Phase 1" with the pattern this phase established.

**Contract**: Must state: capture then **render** (capture alone misses failures inside
pdfmake's measurement pass); edge fixtures live under `fixtures/edge/` and are deliberately
separate from the fidelity fixtures that feed the capture harness; a fixture's floor state is
determined by that form's validators and gate, not copied across reports.

#### 2. Correct §2's claim about the smoke specs

**File**: `context/foundation/test-plan.md`

**Intent**: `:68` says the harness "renders one fixture per report type, from a happy-path
shape". It renders two — `minimal` and `maximal` — and the minimal shapes are
required-fields-only, not happy-path. Per §1 principle #3 research is ground truth, and per
`lessons.md` a document must not be left disagreeing with itself.

**Contract**: Correct the Risk #1 "Must challenge" cell to the sharper true version: the
suite is green not because generation is safe but because the fixtures encode the states
that work — one of them by explicit documented intent.

#### 3. Record the fidelity invariant

**File**: `context/foundation/test-plan.md` §6.6

**Intent**: This change modified builders under the preservation guardrail without running
the capture procedure. The reasoning must survive the session.

**Contract**: Note that fidelity was argued by invariant — guards alter behaviour only in
states that previously threw, so every previously-renderable state is byte-identical — and
that this is available only to changes narrow enough to make the claim checkable by reading.

#### 4. Rollout and change status

**Files**: `context/foundation/test-plan.md` §3, `context/changes/testing-pdf-input-space/change.md`

**Contract**: §3 Phase 1 Status → `done`. `change.md` frontmatter `status: implemented`,
`updated` to the date. Record for Risk #2 the leakage sites this phase deliberately left
alone, so Phase 2 inherits them rather than rediscovering them.

### Success Criteria

#### Automated Verification

- Full suite passes: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`

#### Manual Verification

- §6.1 is specific enough that someone could add a fifth report type's edge coverage from it alone.
- No remaining sentence in `test-plan.md` still describes the one-fixture-per-type shape.

---

## Testing Strategy

### Unit / component tests

- Per report type: a PDF document is produced for every recorded edge state, asserted by rendering to a `Blob` and checking `%PDF`.
- Per gated form: untouched is `invalid` and the download control is disabled.

### Edge cases covered

- Untouched year-end form (A1) · every detail row suppressed (A2) · untouched Teddy Eddie · each form's validator floor · long free text · non-ASCII names.

### Manual testing steps

1. Open the year-end tab, type nothing, click download — a PDF opens.
2. Tick all seven detail "delete" checkboxes, download — a PDF opens with no detail table.
3. Fill the year-end form normally and compare against a pre-change PDF — identical.

## Performance Considerations

Each rendered case embeds the Roboto VFS and the base64 banner, which is why every PDF spec
raises the Jasmine timeout to 30s. Edge fixtures roughly double the rendered cases in the
default suite; keep the count driven by distinct reachable states, not by permutations.

## References

- Research: `context/changes/testing-pdf-input-space/research.md`
- Decisions: `context/changes/testing-pdf-input-space/change.md` § Decisions after research
- Harness: `src/app/shared/testing/pdf-fidelity/render-pdf.ts:29-30,45-61,64-66`
- Fixture contract: `src/app/shared/testing/pdf-fidelity/report-fixture.ts:5-19`
- Assertion shape to mirror: `src/app/year-report/year-report.component.spec.ts:35-49`
- Why the harness uses `try/finally`: `context/changes/pdf-fidelity-baseline/plan.md:103-110`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Edge-fixture seam and the year-end `class` guard

#### Automated

- [x] 1.1 Year-end spec passes — ac2cead
- [x] 1.2 Full suite passes — ac2cead
- [x] 1.3 Lint clean — ac2cead

#### Manual

- [x] 1.4 Edge test observed red before the guard, green after — ac2cead
- [x] 1.5 Guard reading confirms output unchanged for non-null `class` — ac2cead

### Phase 2: The empty year-end detail table

#### Automated

- [x] 2.1 Year-end spec passes — b2d7620
- [x] 2.2 Full suite passes — b2d7620
- [x] 2.3 Lint clean — b2d7620

#### Manual

- [x] 2.4 Failure observed inside pdfmake (`body[0].length`) before the fix — b2d7620
- [x] 2.5 `year-maximal` still renders its six remaining rows — b2d7620

### Phase 3: Reachability sweep across the other three reports

#### Automated

- [x] 3.1 All four report specs pass — 90c364e
- [x] 3.2 Lint clean — 90c364e

#### Manual

- [x] 3.3 Every changed builder line has a named failing test behind it — 90c364e
- [x] 3.4 Each lean fixture checked against its form's validators — 90c364e

### Phase 4: Pin the gates that make "untouched" unreachable

#### Automated

- [x] 4.1 Both gated-form specs pass — 77d95e2
- [x] 4.2 Lint clean — 77d95e2

#### Manual

- [x] 4.3 Removing `[disabled]` turns the new test red — 77d95e2

### Phase 5: Input classes with no documentary basis

#### Automated

- [x] 5.1 Full suite passes — a332d4f
- [x] 5.2 Lint clean — a332d4f

#### Manual

- [x] 5.3 One long-text PDF opened by hand and observed — a332d4f

### Phase 6: Documentation and plan sync

#### Automated

- [x] 6.1 Full suite passes — a04d5c2
- [x] 6.2 Lint clean — a04d5c2

#### Manual

- [x] 6.3 §6.1 usable for a fifth report type unaided — a04d5c2
- [x] 6.4 No sentence in `test-plan.md` still describes the one-fixture-per-type shape — a04d5c2
