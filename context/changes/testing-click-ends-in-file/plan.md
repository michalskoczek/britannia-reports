# The Click Ends In A File — E2E Delivery Layer Implementation   Plan

## Overview

Build the browser-level layer for §3 Phase 5 of `context/foundation/test-plan.md`: four
Playwright specs, one per report type, each proving that the download control a teacher
actually clicks ends in a real PDF file and that the page stays free of uncaught
exceptions on the way there.

This is the **delivery half of Risk #1**. Phase 1 (`testing-pdf-input-space`) closed the
builder half at the unit layer. No production code changes.

## Current State Analysis

**The unit layer never executes a download.** `src/app/shared/testing/pdf-fidelity/render-pdf.ts:29-36`
replaces `pdfMake.createPdf` wholesale; `capturePdfDefinition` returns an inert handle whose
`download()` is `() => Promise.resolve()`. Every one of the four report component specs stops
at `.getBlob()`. Across all four report types this leaves three things unexecuted anywhere:

1. a click on the real download control reaching its handler,
2. the real `pdfMake.createPdf(dd).download(fileName)` call,
3. the browser delivering a file with the builder's computed name.

**The harness exists and is idle.** `playwright.config.ts` (testDir `./test/e2e`,
`fullyParallel: false`, one worker, no `webServer` by design), `test/e2e/fixtures/app.ts`
(fixtures `localStack`, `signedIn`, `roster`, `student`, `uncaughtErrors`),
`test/e2e/auth-session.mjs`. `npx playwright test --list` currently reports **zero tests**:
`seed.spec.ts` was excluded from runs by `testIgnore` on 2026-09-08 because it is the
exemplar, not coverage.

**The four download paths differ in exactly two ways** — the gate, and how the click is wired.
Everything else (tab-based navigation, `app-button`, the `nameAndLastNameStudent` label) is
uniform.

## Desired End State

`npm run e2e` runs four specs, all green, covering the download delivery path of every report
type this product ships. Each spec fails if its report's download click stops producing a file,
and each one reports an uncaught browser exception as a failure rather than letting it reach the
console only. `context/foundation/test-plan.md` §6.7 records how to write the fifth one.

Verified by: `npx playwright test` exits 0 with 4 passing tests; `npx tsc --noEmit` and
`npx eslint test/e2e` exit 0; and for each spec, a deliberate inversion of the behaviour it
protects turns it red.

### Key Discoveries

- **`render-pdf.ts:32-36`** — the inert `download()` stub. This is the seam that makes the whole
  phase legitimate and simultaneously bounds it.
- **`src/app/teddy-eddie-report/teddy-eddie-report.component.html:38`** — `[translateKey]="'PDF'"`,
  and `PDF` is not a key in `src/assets/i18n/pl.json` or `en.json` (only `downloadPDF`, line 104
  in both). ngx-translate echoes the unknown key, so the button renders **`PDF`**. The projected
  `{{ 'downloadPDF' | translate }}` is dropped — `button.component.html:1-15` has no `<ng-content>`.
- **`src/app/teddy-eddie-report/teddy-eddie-form/teddy-eddie-form.component.html:3`** — Teddy
  Eddie delegates its form to a child component, so the parent template contains no
  `formControlName` at all. Role-based locators are unaffected.
- **All four use label key `nameAndLastNameStudent`** → "Imię i nazwisko ucznia" (`pl.json:17`).
- **`src/app/year-report/year-report.component.html:305-309`** — no `[disabled]` binding, so
  `ButtonComponent.disabled` falls back to its `input<boolean>(false)` default.
- **`src/app/semestr-report/semestr-report.component.ts:305-321`** — `markOptions()` derives each
  mark's option list from the current `sex`, so `sex` must be set **before** the six marks.
- **`src/app/shared/static-data/tab-data.ts:33`** — Teddy Eddie is `defaultActive: true`.
- **The gate's disabled direction is already owned** by `cambridge-report.component.spec.ts:135-142`
  and `semestr-report.component.spec.ts:160-170`, which read the rendered control. Only the
  **enabled** direction is browser-only.
- **`context/foundation/lessons.md`** — the isolation lesson. These four specs write nothing to
  the roster, which designs the shared-fixture hazard out rather than managing it.

## What We're NOT Doing

- **No production code changes.** The Teddy Eddie translate-key defect is recorded, not fixed —
  fixing it would change the button's accessible name and break the spec written against it.
- **No restatement of Phase 1's input-space coverage.** "A PDF is produced from an untouched
  year-end form" belongs to the `year-untouched` fixture. These specs assert *delivery*, never
  *generation*.
- **No assertion on the untouched-form filename** (`Raport końcowy 2025-26 - null`). That is
  Risk #2 territory; `testing-pdf-input-space/change.md:102-104` routes `"null"` leakage to a
  fixture-sharpening job explicitly, not a browser one.
- **No picker / quick-add coverage.** Excluding `seed.spec.ts` from runs removed the only
  browser exercise of that flow. It is Risk #2, which §3 Phase 2 covers more cheaply at
  component-integration level. Recorded as a deliberate gap in Phase 3.
- **No PDF content, layout, or fidelity assertions** (§3 Phase 4), **no field-ownership or
  sex-remap assertions** (§3 Phase 2), **no access-boundary assertions** (§3 Phase 3).
- **No CI wiring.** The e2e gate is §3 Phase 6.
- **No shared download helper.** Chosen deliberately: each spec carries its own
  `waitForEvent('download')` and its own assertions so it reads standalone.
- **No `test.skip()` / `test.fixme()`.** A spec that cannot be made to pass is a signal to
  investigate, not to silence.

## Implementation Approach

Four specs, one file each, one test per file, modelled on `test/e2e/seed.spec.ts` — role-based
locators, waits on application state rather than on time, per-run unique data, and no dependence
on any other spec. Phases group the reports by **gate shape**, because the gate and the click
wiring vary together:

- **Gated** (semester, Cambridge): `(ngSubmit)` + `[type]="'submit'"`, `[disabled]="form.invalid"`.
  The spec fills the validator floor, waits for the button to become enabled — the app's own
  answer to "is this report complete" — then clicks.
- **Ungated** (year-end, Teddy Eddie): no validators, no `[disabled]`. Teddy Eddie additionally
  has no `<form>` and a different button name.

Every spec fills `studentName` with a per-run stamped value, so the asserted filename is also the
evidence that the delivered file belongs to this run rather than to a leftover.

## Critical Implementation Details

**Filename is asserted by full equality, and the exact string must be confirmed empirically
before it is written down.** `seed.spec.ts` proves the browser appends `.pdf` and that
`split(' ').join('-')` survives for the semester shape. The year-end and Teddy Eddie names are a
different shape — they retain spaces and carry `ń` (`'Raport końcowy 2025-26 - ' + studentName`).
Whether the browser or file-saver transforms that is not established by any existing evidence.
During VERIFY, read the actual `download.suggestedFilename()` and assert that value. If it differs
from the builder's computed string, that transformation is a finding to record in the spec's
comment and in the §6.6 note — never a reason to quietly weaken the assertion to a substring.

**Tab selection is explicit in every spec, including Teddy Eddie.** Teddy Eddie is
`defaultActive: true`, so its report is reachable with no tab click at all. The spec clicks its
tab anyway: relying on the default would make the spec depend on `tab-data.ts` configuration it
has no opinion about, and would break silently if the default moved.

**Do not navigate away from the shell mid-test.** Leaving to `/students` destroys the form and
resets the tab bar (`app.routes.ts:18-21`, `tab-group.component.ts:50-54`).

---

## Phase 1: Gated reports — semester and Cambridge

### Overview

The two report types whose download control is bound to `[disabled]="form.invalid"`. Both submit
through `(ngSubmit)`, and both name the file `<student-name-with-dashes>_<type>_report`. This
phase also establishes the shape the remaining specs copy.

### Changes Required:

#### 1. Semester report delivery spec

**File**: `test/e2e/semester-download.spec.ts`

**Intent**: Prove that a teacher who fills the semester report to its validator floor and clicks
"Generuj PDF" receives a real PDF file named after this run's student, with no uncaught exception
in the browser. This is the delivery assertion the unit layer cannot make, because it never
executes `.download()`.

**Contract**: Uses the `signedIn` and `uncaughtErrors` fixtures from `./fixtures/app`; does **not**
use `student` or `roster` — this spec writes nothing to the store. Fills the nine validated
controls in the order `studentName` → `sex` → the six marks (the order is load-bearing:
`markOptions()` rebuilds the mark option lists from `sex`). Waits for `toBeEnabled()` on the
download button rather than for a duration. Asserts `download.suggestedFilename()`, the `%PDF`
magic bytes, a non-trivial byte length, and `uncaughtErrors` equal to `[]`.

Expected filename, from `semestr-report.component.ts:944-945`:

```
`${studentName.split(' ').join('-')}_semester_report.pdf`
```

The six mark selects are chosen by whatever option is offered first — the claim under test is
that a complete report yields a file, not that it carries a particular grade — but each pick is
read back and asserted, as `seed.spec.ts`'s `selectFirstOfferedOption` demonstrates, so a
reordered or emptied option list cannot silently change what was filled.

#### 2. Cambridge report delivery spec

**File**: `test/e2e/cambridge-download.spec.ts`

**Intent**: Same delivery claim for the Cambridge report, whose floor is a single control — this
is the shortest complete flow in the product, and its brevity is exactly why the gate's enabled
direction is worth asserting here.

**Contract**: Same fixtures and same assertion set as the semester spec. Fills only
`studentName` (`cambridge-report.component.ts:444` is the sole `Validators.required`), waits for
the download button to become enabled, clicks, and asserts on the delivered file.

Expected filename, from `cambridge-report.component.ts:424-425`:

```
`${studentName.split(' ').join('-')}_cambridge_report.pdf`
```

### Success Criteria:

#### Automated Verification:

- The semester spec passes: `npx playwright test test/e2e/semester-download.spec.ts`
- The Cambridge spec passes: `npx playwright test test/e2e/cambridge-download.spec.ts`
- Type checking passes: `npx tsc --noEmit`
- Linting passes: `npx eslint test/e2e`
- Neither spec destructures the `student` or `roster` fixture:
  `grep -c "^  roster,\|^  student,\|^  roster:\|^  student:" test/e2e/semester-download.spec.ts test/e2e/cambridge-download.spec.ts`
  returns `0` for both.
  (Corrected during Phase 1. The original form, `grep -L "roster\|student:"`, matched the bare
  word in a doc comment explaining *why* the spec avoids the roster — it tested prose, not
  fixture usage, and would have been satisfied by deleting the comment that documents the
  decision.)
- No time-based waiting:
  `grep -c "waitForTimeout" test/e2e/semester-download.spec.ts test/e2e/cambridge-download.spec.ts` returns `0` for both

#### Manual Verification:

- Deliberate break, semester: temporarily make the download handler a no-op (or invert the
  `[disabled]` binding), re-run, confirm the spec goes red for the right reason, then revert
- Deliberate break, Cambridge: same procedure on its own download path
- The delivered file opens as a valid PDF in a viewer and names the run's student
- Both specs pass on a second consecutive run without any manual cleanup between runs

**Implementation Note**: After completing this phase and all automated verification passes, pause
for manual confirmation before proceeding.

---

## Phase 2: Ungated reports — year-end and Teddy Eddie

### Overview

The two report types with zero validators and no `[disabled]` binding, where the download control
is live the moment the tab opens. Teddy Eddie additionally has no `<form>` — its button calls
`downloadPDF()` directly — and its accessible name is `PDF`, not "Generuj PDF". This phase also
opens the change folder tracking that defect.

### Changes Required:

#### 1. Year-end report delivery spec

**File**: `test/e2e/year-end-download.spec.ts`

**Intent**: Prove the year-end download click ends in a file. This report has no gate, so the
spec's value is entirely in the click-to-file path — there is no validity state to wait for.

**Intent (cont.)**: The spec fills `studentName` even though nothing requires it, so the asserted
filename carries this run's stamp. It deliberately does **not** exercise the untouched-form state:
that state's *generation* is owned by the `year-untouched` fixture, and its filename interpolates
a literal `null` that this plan does not pin.

**Contract**: `signedIn` + `uncaughtErrors` fixtures. Clicks the "Raport całoroczny" tab, fills
"Imię i nazwisko ucznia", clicks "Generuj PDF", asserts the delivered file. Because there is no
gate, the spec must not wait on `toBeEnabled()` as a readiness signal — the control is enabled
from the start, so that assertion would pass before the form is filled and prove nothing. Wait on
the filled field's value instead.

Expected filename, from `year-report.component.ts:568-569` — note this shape retains spaces and a
diacritic, and must be confirmed against the real `suggestedFilename()` during VERIFY:

```
`Raport końcowy 2025-26 - ${studentName}.pdf`
```

#### 2. Teddy Eddie report delivery spec

**File**: `test/e2e/teddy-eddie-download.spec.ts`

**Intent**: Prove the Teddy Eddie download click ends in a file. This is the one report whose
click is not a form submit, so it is the one the other three specs cannot vouch for.

**Contract**: `signedIn` + `uncaughtErrors` fixtures. Clicks the "Raport Teddy Eddie" tab
explicitly despite it being `defaultActive`. Fills "Imię i nazwisko ucznia" — bound in the child
component `teddy-eddie-form.component.html:3`, reached by role like any other field. Clicks the
download control, which must be located by the name it actually renders:

```ts
page.getByRole('button', {name: 'PDF', exact: true})
```

A carried-over `{ name: 'Generuj PDF' }` will not find this control. The spec carries a comment
stating why, pointing at the change folder opened below.

`exact` was added during Phase 2 and is load-bearing. `getByRole`'s `name` substring-matches, and
`PDF` is a substring of `Generuj PDF` — so the loose form written here still found the button after
the defect was *fixed*. Confirmed empirically: under a rename of `[translateKey]` to `'downloadPDF'`
the loose locator stayed green and the exact one went red. Without `exact`, criterion 2.9 cannot be
satisfied, and the spec would hard-code a name it calls a bug while testifying to nothing. Produces the same filename shape as
year-end (`teddy-eddie-report.component.ts:333-334`), so the same VERIFY confirmation applies.

#### 3. Change folder for the translate-key defect

**File**: `context/changes/<new-change-id>/change.md`

**Intent**: Give the Teddy Eddie button defect its own tracking rather than leaving it as a note
inside a test. The button renders `PDF` to both Polish and English users because
`[translateKey]="'PDF'"` names a key that exists in neither locale file, and the projected
`{{ 'downloadPDF' | translate }}` is silently dropped for want of an `<ng-content>` in
`ButtonComponent`.

**Contract**: Created via `/10x-new`, `status: new`, not implemented by this plan. Its notes must
record that fixing it changes the button's accessible name and therefore requires updating
`test/e2e/teddy-eddie-download.spec.ts` in the same change.

### Success Criteria:

#### Automated Verification:

- The year-end spec passes: `npx playwright test test/e2e/year-end-download.spec.ts`
- The Teddy Eddie spec passes: `npx playwright test test/e2e/teddy-eddie-download.spec.ts`
- The whole suite passes together: `npm run e2e` reports 4 passed
- Type checking passes: `npx tsc --noEmit`
- Linting passes: `npx eslint test/e2e`
- The Teddy Eddie spec targets the real button name: `grep -c "name: 'PDF'" test/e2e/teddy-eddie-download.spec.ts`
  returns `1` (satisfied by the `exact: true` form, which is what makes the locator discriminate)
- The defect change folder exists: `test -f context/changes/<new-change-id>/change.md`

#### Manual Verification:

- Deliberate break, year-end: invert the download path, confirm red, revert
- Deliberate break, Teddy Eddie: same, and separately confirm that renaming its
  `[translateKey]` to `'downloadPDF'` breaks the spec — proving the locator is genuinely bound to
  the rendered name and that the recorded defect is real
- The two delivered filenames match what the builders compute, including the diacritic; any
  transformation the browser applies is recorded rather than assumed
- All four specs pass on a second consecutive run

**Implementation Note**: Pause for manual confirmation before proceeding.

---

## Phase 3: Document the layer

### Overview

Fill the documentation obligations `change.md` promised, written from what the four specs actually
taught rather than from a forecast. This phase runs last on purpose: the lesson in
`context/foundation/lessons.md` records that a phase shipping *after* a documentation phase
falsifies what that phase wrote down.

### Changes Required:

#### 1. The e2e cookbook entry

**File**: `context/foundation/test-plan.md`

**Intent**: Replace §6.7's `TBD — see §3 Phase 5` with the real procedure for adding a fifth
end-to-end test, so the next contributor does not rediscover the harness from scratch.

**Contract**: §6.7 must cover: the two processes the suite needs (`npm run emulators`,
`npm start`) and why `playwright.config.ts` starts neither; the hand-captured session workflow
(`npm run e2e:auth:save` / `e2e:auth:restore`) and why sign-in cannot be scripted; that
`seed.spec.ts` is the exemplar and is `testIgnore`d; the locator and waiting rules; the
per-report gate asymmetry and what it means for how a spec waits; and the rule that a spec which
writes to the store owns its cleanup through the emulator's REST API rather than through the UI.

#### 2. The phase note and the rollout row

**File**: `context/foundation/test-plan.md`

**Intent**: Record what this phase taught in §6.6, and mark §3 Phase 5 as done.

**Contract**: A §6.6 entry covering the three findings worth carrying forward — the inert
`download()` stub that made the phase legitimate, the Teddy Eddie translate-key defect and the
locator consequence, and the deliberate picker-coverage gap. The §3 Phase 5 row gets
`Status: done` and `Change folder: context/changes/testing-click-ends-in-file/`. The §4 e2e row
and §5 e2e gate row must be re-read and corrected if this phase falsified them — the §4 row
currently says the suite lists zero tests.

#### 3. Record the picker coverage gap

**File**: `context/foundation/test-plan.md`

**Intent**: State plainly that the student picker's quick-add flow has no browser coverage, so a
future reader does not mistake its absence for an oversight.

**Contract**: A note in the §6.6 phase entry recording that excluding `seed.spec.ts` from runs
removed the only browser exercise of the quick-add path, that the flow is Risk #2 territory owned
by §3 Phase 2 at component-integration level, and that this was a deliberate choice under §7's
ceiling rather than a gap to be filled at the e2e layer.

### Success Criteria:

#### Automated Verification:

- §6.7 no longer reads TBD: `grep -c "6.7 Writing an end-to-end test" context/foundation/test-plan.md` returns `1` and
  the section does not contain `TBD`
- The §3 Phase 5 row cites this change folder: `grep -c "testing-click-ends-in-file" context/foundation/test-plan.md`
  returns at least `1`
- The full suite still passes: `npm run e2e` reports 4 passed
- Type checking and linting still pass: `npx tsc --noEmit`, `npx eslint test/e2e`

#### Manual Verification:

- §6.7 is specific enough that someone could add a fifth spec from it without reading this plan
- §4 and §5 rows agree with what is on disk after this change — no section of `test-plan.md`
  contradicts another
- The picker gap is stated as a decision with its reasoning, not as an omission

**Implementation Note**: This is the final phase. Roll up any still-pending manual rows from
earlier phases at its gate.

---

## Testing Strategy

### The tests themselves are the deliverable

There are no tests *of* this change beyond the four specs. What replaces them is the
**deliberate-break check**: for each spec, invert or disable the production behaviour it is
supposed to protect, confirm the spec goes red, and revert. A spec that stays green when its
target is broken protects nothing, and no amount of green proves otherwise.

### What each spec asserts

1. A download event fires from a click on the real control.
2. The delivered file's name equals the builder's computed name, carrying this run's stamp.
3. The bytes begin `%PDF` and the file is not trivially small.
4. `uncaughtErrors` is empty — the silent failure mode Risk #1 is named after.

### Manual Testing Steps

1. Start `npm run emulators` and `npm start`; capture a session with `npm run e2e:auth:save` if
   none exists.
2. `npm run e2e` — expect 4 passed.
3. Run it a second time with no cleanup in between; expect 4 passed again.
4. For each spec in turn, apply its deliberate break, confirm red, revert, confirm green.
5. Open one delivered PDF per report type and confirm it is a real document naming the test student.

## Performance Considerations

E2E is the most expensive layer in this project and `fullyParallel` is off, so the suite runs
serially on one worker. Four specs is the whole budget §7's ceiling permits — one delivery
assertion per report type. Do not add a spec per page or per control.

## Migration Notes

Not applicable — no production code, schema, or data changes.

## References

- Research: `context/changes/testing-click-ends-in-file/research.md`
- Risk map and the §7 ceiling: `context/foundation/test-plan.md` §2, §3 row 5, §7
- The exemplar: `test/e2e/seed.spec.ts` (excluded from runs by `testIgnore`)
- Fixtures: `test/e2e/fixtures/app.ts`
- Prior phase whose coverage must not be restated: `context/changes/testing-pdf-input-space/`
- The isolation lesson: `context/foundation/lessons.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See
`references/progress-format.md`.

### Phase 1: Gated reports — semester and Cambridge

#### Automated

- [x] 1.1 The semester spec passes: `npx playwright test test/e2e/semester-download.spec.ts` — ac211ea
- [x] 1.2 The Cambridge spec passes: `npx playwright test test/e2e/cambridge-download.spec.ts` — ac211ea
- [x] 1.3 Type checking passes: `npx tsc --noEmit` — ac211ea
- [x] 1.4 Linting passes: `npx eslint test/e2e` — ac211ea
- [x] 1.5 Neither spec destructures the `student` or `roster` fixture — ac211ea
- [x] 1.6 No time-based waiting in either spec — ac211ea

#### Manual

- [x] 1.7 Deliberate break, semester: confirmed red for the right reason, then reverted — ac211ea
- [x] 1.8 Deliberate break, Cambridge: confirmed red, then reverted — ac211ea
- [x] 1.9 The delivered file opens as a valid PDF naming the run's student — ac211ea
- [x] 1.10 Both specs pass on a second consecutive run with no manual cleanup — ac211ea

### Phase 2: Ungated reports — year-end and Teddy Eddie

#### Automated

- [x] 2.1 The year-end spec passes: `npx playwright test test/e2e/year-end-download.spec.ts` — 4026d37
- [x] 2.2 The Teddy Eddie spec passes: `npx playwright test test/e2e/teddy-eddie-download.spec.ts` — 4026d37
- [x] 2.3 The whole suite passes: `npm run e2e` reports 4 passed — 4026d37
- [x] 2.4 Type checking passes: `npx tsc --noEmit` — 4026d37
- [x] 2.5 Linting passes: `npx eslint test/e2e` — 4026d37
- [x] 2.6 The Teddy Eddie spec targets the real button name `PDF` — 4026d37
- [x] 2.7 The defect change folder exists — 4026d37

#### Manual

- [x] 2.8 Deliberate break, year-end: confirmed red, then reverted — 4026d37
- [x] 2.9 Deliberate break, Teddy Eddie: confirmed red; renaming its `translateKey` also breaks the spec — 4026d37
- [x] 2.10 Delivered filenames match the builders' computed names, including the diacritic; any transformation recorded — 4026d37
- [x] 2.11 All four specs pass on a second consecutive run — 4026d37

### Phase 3: Document the layer

#### Automated

- [x] 3.1 §6.7 no longer reads TBD
- [x] 3.2 The §3 Phase 5 row cites this change folder
- [x] 3.3 The full suite still passes: `npm run e2e` reports 4 passed
- [x] 3.4 Type checking and linting still pass

#### Manual

- [x] 3.5 §6.7 is specific enough to add a fifth spec from it without reading this plan
- [x] 3.6 No section of `test-plan.md` contradicts another after this change
- [x] 3.7 The picker gap is stated as a decision with reasoning, not as an omission
