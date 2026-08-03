# Student Picker in the Trimester/Semester Report — Implementation Plan

## Overview

A teacher writing a trimester/semester report picks a student from their own roster and the four
student-identity controls (`studentName`, `name`, `sex`, `class`) fill from that student. A student
missing from the roster can be added from inside the report form, without navigating away and losing
the form. Because picking a student can flip `sex`, and `sex` chooses which variant of every
descriptive-mark sentence the six selects offer, the already-chosen marks are re-mapped to the new
variant instead of being silently left in the wrong gender.

This is `S-04` in `context/foundation/roadmap.md`, the last slice of the change, and it completes
US-01: roster → picker → template → PDF.

## Current State Analysis

Both seams this slice stands on already exist and are asserted rather than documented.

- **The panel seam.** `TemplatePanelComponent` (`src/app/templates/template-panel/template-panel.component.ts:75`)
  never sees `SemestrReportComponent.form`. It takes the ten domain values as `currentFields`
  (`input.required`), emits a payload through `apply`, and the report translates between that payload
  and its 48 controls in `collectTemplateFields()` / `applyTemplateFields()`
  (`src/app/semestr-report/semestr-report.component.ts:299` and `:317`). The picker is the same shape
  over a different set.
- **The domain agreement.** `StudentIdentity` (`src/app/model/student.interface.ts:32`) has exactly the
  four keys of `STUDENT_IDENTITY_FIELDS` (`src/app/templates/template-domain.ts:74`), and
  `src/app/students/student-domain.spec.ts` asserts that equality. `class` is stored as a value from
  the same `classes` constant the report form binds (`src/app/shared/select-values.ts:5`), so **no
  mapping layer is needed at the form boundary**.
- **The data layer.** `StudentsService` (`src/app/students/students.service.ts`) already holds list,
  create, validation, a uid-gated cache, tolerant reads and a closed failure type. No new gateway, no
  new collection, **no `firestore.rules` change** — `users/{uid}/students/{studentId}` already allows
  everything this slice does.
- **The roster surface.** `StudentRosterComponent` (`src/app/students/student-roster/`) owns the only
  copy of the four controls, their labels, and the failure-key map.

Three constraints discovered during research shape the plan:

- **`app-select` is a `ControlValueAccessor`.** Without an `ngControl` binding it never writes back
  (`src/app/shared/components/form/select/select.component.ts:75`), so the picker needs its own
  `FormControl`. Its `selectionChange` output deliberately stays silent on `patchValue`
  (`select.component.ts:48`), which is exactly what a picker needs: a programmatic revert must not
  re-trigger the flow.
- **Option labels go through the `translate` pipe** (`select.component.html:14`). A student's name is
  not a translation key; `ngx-translate` returns an unknown key verbatim, so names render correctly —
  but that is a property being relied on, not an accident, and belongs in a comment.
- **The sex/marks hazard.** `markOptions()` (`semestr-report.component.ts:264`) builds each of the six
  descriptive-mark option lists from `mark.value` or `mark.valueFemale` depending on `sex`. A control
  whose value came from the other variant matches no option: the select renders blank, `required`
  still passes because the control holds a value, and the wrong-gender sentence goes into the PDF.
  This is reachable today by changing the sex select by hand; the picker would make it one click.

## Desired End State

At the top of the trimester/semester form, above the template panel, sits a student panel listing the
teacher's roster. Picking a student fills the four identity controls; if any of them already holds
something the pick would overwrite or clear, the same confirmation dialog the template uses lists the
affected fields first. An "add a student" area in the same panel creates a student and selects them
without leaving the form. Whenever `sex` changes — from the picker or from the select by hand — every
already-chosen descriptive mark is rewritten to the matching variant of the same sentence, so no
select goes blank and no PDF carries the wrong gender.

Verify by: signing in against the emulators, picking a student on a blank form (fields fill, no
dialog), picking a different student over a filled form (dialog lists the fields, Cancel leaves both
the form and the select untouched), applying a template before and after picking (neither touches the
other's fields), quick-adding a student mid-report (the form survives), and downloading one male and
one female report and reading the prose.

### Key Discoveries:

- `TemplatePanelComponent` is the seam to copy — `src/app/templates/template-panel/template-panel.component.ts:75`
- `applyTemplateFields()` shows the `patchValue`-over-a-domain-constant idiom — `semestr-report.component.ts:317`
- `STUDENT_IDENTITY_FIELDS` and `STUDENT_IDENTITY_DOMAIN` are asserted equal — `src/app/students/student-domain.spec.ts`
- `ConfirmDialogComponent` already supports grouped item lists (`itemGroups`) — used at `template-panel.component.ts:225`
- `selectionChange` is silent on programmatic writes — `src/app/shared/components/form/select/select.component.ts:48`
- Six mark lists carry `valueFemale`; `frequencyMarks` and `marks` (avgMark) do not — `src/app/shared/marks.ts`
- Leaving the shell drops the report form, and this slice is where that stops being acceptable — `src/CLAUDE.md:50`

## What We're NOT Doing

- No picker on the Cambridge, year-end, or Teddy Eddie forms. FR-013 names the trimester/semester
  form only, and the other three are under the preservation FRs.
- No preserved shell state and no `RouteReuseStrategy`. The mid-report case is solved by quick-add
  instead; `src/CLAUDE.md:50`'s open design decision is closed that way, not by a navigation refactor.
- No edit or delete of a student from the picker. `/students` remains the roster surface (FR-007, FR-008).
- No search/autocomplete widget. A `app-select` over the roster, per the recorded decision.
- No change to `TEMPLATE_DOMAIN` or to the four-set partition. No field moves between sets.
- No `pdfmake` document-definition change. The capture procedure **is** run (baseline in Phase 1,
  comparison in Phase 3), but only the trimester/semester output is compared against it — the other
  three report types are captured as a regression check, not re-verified field by field.
- No new Firestore collection, no index, no `firestore.rules` edit, no new `test/rules/` file.
- No new failure modes in `StudentsService`. The picker consumes the existing `StudentsFailure` set.

## Implementation Approach

Build outward from the existing seams, cheapest-risk first. Phase 1 is a pure extraction with no
behaviour change, so the roster's specs are the safety net for it. Phase 2 delivers FR-013 itself as a
panel that never touches `form`. Phase 3 closes the sex/marks hazard the picker sharpens. Phase 4 adds
quick-add on top of the component Phase 1 produced. Phases 5 and 6 verify, document, and release.

The picker owns `STUDENT_IDENTITY_DOMAIN` and nothing else. The remap in Phase 3 lives in the report
component, keyed on `sex` rather than on the picker, which is what keeps it a property of the form
rather than a second pre-fill mechanism — and what makes the manual sex change behave identically.

## Critical Implementation Details

**State sequencing — the remap must not re-enter.** The remap is driven by `form.controls['sex']
.valueChanges` and writes to six other controls, whose own emissions re-enter the group's
`valueChanges`. The guard is the same predicate `markOptions()` uses: remap only when
`previous === Sex.MALE` differs from `next === Sex.MALE`. Track the previous value in the component;
because the sex control is not written by the remap, the second pass finds no flip and stops.

**Timing — the remap fires in the middle of the picker's `patchValue`, not after it.** `FormGroup
.patchValue` writes each child with `onlySelf: true`, so every child emits its own `valueChanges`
immediately and only the group's stream is deferred to the end. Phase 3 subscribes to the *child*
stream (`form.controls['sex'].valueChanges`), so with the patch built in `STUDENT_IDENTITY_FIELDS`
order the remap runs after `sex` is set and **before** `class` is written. What makes that safe is an
invariant, not the ordering: the remap reads `sex` and the six mark controls and nothing else. A
future change that makes it read another identity field breaks this and must move the hook to the
group's stream.

**User experience — Cancel must revert the select, not just skip the write.** The select shows who the
report is about. If the confirmation is dismissed, the control has already moved to the new student;
put it back with `{ emitEvent: false }` so `selectionChange` does not fire again.

## Phase 1: Extract the shared student form

### Overview

Move the four identity controls, their labels, and the failure-key map out of
`StudentRosterComponent` into a component both the roster and the picker can mount. No behaviour
change anywhere — the roster's existing specs are the check.

### Changes Required:

#### 1. Shared failure keys

**File**: `src/app/students/student-failure-keys.ts` (new)

**Intent**: One place maps `StudentsFailure` to a translate key, because two surfaces are about to
need it and a second copy would drift on the first new failure mode.

**Contract**: Exports `FAILURE_KEYS: Readonly<Record<StudentsFailure, string>>` and
`FORM_FAILURES: readonly StudentsFailure[]`, moved verbatim from
`student-roster.component.ts:36` and `:53`. Totality over `StudentsFailure` is what makes a new member
a compile error rather than a snackbar reading "something went wrong".

#### 2. The shared form

**File**: `src/app/students/student-form/student-form.component.ts` (new, plus `.html`, `.scss`)

**Intent**: One definition of the four fields and the inline validation message, mounted by both the
roster and the picker's quick-add. The host keeps ownership of the buttons, the service calls, and
the submit flow — only the fields move.

**Contract**: Standalone `app-student-form`. Inputs: `form: InputSignal<FormGroup<StudentFormControls>>`
(required) and `failureKey: InputSignal<string | null>`. Renders the four wrappers
(`app-input-text` ×2, `app-select` ×2) against `[formGroup]`, plus the `role="alert"` error line, and
nothing else. The file also exports the control contract and its helpers so the group has one
definition too:

- `interface StudentFormControls` — the four typed controls currently at `student-roster.component.ts:59`
- `createStudentForm(): FormGroup<StudentFormControls>`
- `readStudentForm(form): StudentIdentity` — spreads `STUDENT_IDENTITY_DEFAULTS` and overlays the raw value
- `resetStudentForm(form): void`

#### 3. Roster rewire

**File**: `src/app/students/student-roster/student-roster.component.ts`, `.html`, `.scss`

**Intent**: Consume the extracted pieces and delete the local copies. Everything about how the roster
behaves stays as it is — one form doing double duty for add and edit, `busy()`, the reveal-and-focus
on Edit, the reload-on-save-failure branch.

**Contract**: `form` comes from `createStudentForm()`, `readForm()` delegates to `readStudentForm()`,
`resetToAddMode()` delegates to `resetStudentForm()`, `FAILURE_KEYS` / `FORM_FAILURES` are imported.
The template mounts `<app-student-form [form]="form" [failureKey]="formFailureKey()">` inside the
existing `#rosterForm` element. `revealForm()` keeps working unchanged: it queries `input` under the
form element, and the projected input is still a descendant. Field-level SCSS moves with the
component; the roster keeps the list, action, and layout rules.

**File**: `src/app/students/student-roster/student-roster.component.spec.ts`

**Intent**: Keep the suite meaningful after the DOM moved one component deeper.

**Contract**: Queries that reach the four fields resolve through the child component; class names the
spec asserts on must either survive the move or be updated in the same commit. No new test cases —
this phase adds no behaviour.

### Success Criteria:

#### Automated Verification:

- Reference PDFs captured **before any edit**, while the tree still matches the branch point `67588f4`: `npm run test:capture`
- Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Linting passes: `npm run lint`
- Production build type-checks: `npm run build`

#### Manual Verification:

- `/students` still adds, lists, edits, and deletes a student, with the same validation messages
- Pressing Edit on a row far down the list still scrolls the form into view and focuses the first field

**Implementation Note**: After completing this phase and all automated verification passes, pause here
for manual confirmation from the human that the manual testing was successful before proceeding.

---

## Phase 2: The picker panel and its wiring into the report form

### Overview

FR-013 itself: a panel listing the teacher's roster, and the report-side method that writes a picked
identity into the four controls.

### Changes Required:

#### 1. The picker panel

**File**: `src/app/students/student-picker/student-picker.component.ts` (new, plus `.html`, `.scss`)

**Intent**: The teacher-facing surface for FR-013. Like `TemplatePanelComponent`, it knows nothing
about `SemestrReportComponent.form` — it takes the current identity as an input and emits the picked
one as an output.

**Contract**: Standalone `app-student-picker`.

- Input `currentIdentity: InputSignal<StudentIdentity>` (required) — the left-hand side of the diff.
- Output `apply: OutputEmitterRef<StudentIdentity>` — emitted only after the teacher has agreed.
- `ngOnInit` calls `StudentsService.load()` unconditionally (recorded decision — see Open Risks).
- `studentControl: FormControl<string | null>` bound to an `app-select` whose `itemList` is
  `students().map(s => ({ label: s.identity.studentName, value: s.id }))`. Names pass through the
  `translate` pipe and come back verbatim because they are not keys — comment that at the call site.
- Reacts to `(selectionChange)`, not `valueChanges`, so the Cancel revert does not re-enter.
- Loading / load-failure-with-retry / empty-roster / list states mirror `TemplatePanelComponent`'s
  template exactly, using `students.picker.*` keys.
- Failures come from `student-failure-keys.ts`; outcome messages use `MatSnackBar` with the same
  4000 ms duration.

**File**: `src/app/students/student-identity-diff.ts` (new)

**Intent**: Answer "what would this pick overwrite or clear" without the panel reaching into the form.
Separate from the component so it can be unit-tested as a pure function, the way
`TemplatesService.diff` is.

**Contract**: `diffIdentity(next: StudentIdentity, current: StudentIdentity): { overwritten: readonly
(keyof StudentIdentity)[]; cleared: readonly (keyof StudentIdentity)[] }`, iterating
`STUDENT_IDENTITY_DOMAIN`. A field is *overwritten* when the current value differs from
`STUDENT_IDENTITY_DEFAULTS` and from the incoming value; *cleared* when the current value is
non-default and the incoming one is the default. Empty strings count as default — the report form
starts its identity controls at `null` but a teacher who typed and deleted leaves `''`.

#### 2. Report-side integration

**File**: `src/app/semestr-report/semestr-report.component.ts`

**Intent**: Give the panel a current-identity signal to read and a method to write into, mirroring
what the template panel already gets. `patchValue` over `STUDENT_IDENTITY_FIELDS` only — the other 44
controls stay untouched, which is the disjoint-domain rule FR-013 rests on.

**Contract**: Add `collectStudentIdentity(): StudentIdentity` and `applyStudentIdentity(identity:
StudentIdentity): void`, both driven by `STUDENT_IDENTITY_FIELDS` from `templates/template-domain.ts`
rather than a hand-written list. Add a `studentIdentity` signal fed from the same `form.valueChanges`
subscription that already refreshes `domainFields` (`:286`) — a fresh object per change-detection pass
would leave the panel's signal input permanently dirty, the trap `templateFields` already documents.

None of the four needs the `date`-style conversion `toStored`/`toControl` handle, but one needs a
coercion: `StudentIdentity.studentName` is `string` while the control starts at `null`
(`semestr-report.component.ts:906`), so `collectStudentIdentity` reads a missing name as `''`. The
compiler catches that side loudly; the silent half is the diff below, which must read `null` and `''`
as the same default — otherwise a blank form reports `studentName` as a field the pick would
overwrite.

**File**: `src/app/semestr-report/semestr-report.component.html`

**Intent**: Mount the panel above the template panel, so the on-screen order matches FR-013's usual
flow (student first, then boilerplate) without enforcing it.

**Contract**: A new `<section class="form-section">` holding
`<app-student-picker [currentIdentity]="studentIdentity()" (apply)="applyStudentIdentity($event)">`,
placed before the existing template-panel section. Both remain inside the report's `<form>`, so any
button inside the picker must pass `[type]="'button'"` — an unqualified button submits and downloads
a PDF.

#### 3. Translations

**File**: `src/assets/i18n/pl.json`, `src/assets/i18n/en.json`

**Intent**: Every new string ships in both bundles in the same change; key parity is a maintained
invariant.

**Contract**: A `students.picker` block (section title, lead, select label, empty/loading/retry,
confirm-apply title/message/overwritten/cleared/confirm, outcome and error messages) plus
`students.fields.{studentName,name,sex,class}` for the dialog's field lists — the counterpart of the
existing `templates.fields.*`.

#### 4. Testing providers for everything that renders the trimester/semester form

**File**: `src/app/shared/testing/templates-testing.ts` → `src/app/shared/testing/semestr-report-testing.ts`

**Intent**: Mounting the picker puts `StudentsService` → `StudentsGateway` → `Firestore` into every
`TestBed` that creates `SemestrReportComponent`, which no spec provides. `S-02` hit this exact wall
with the template panel and answered it with `templatePanelTestingProviders()`; this phase widens that
answer rather than adding a second one a future spec could forget to spread.

**Contract**: The helper gains a `StudentsGateway` stub alongside the existing `TemplatesGateway` and
`SessionService` ones — `list` resolving `[]`, `create`/`update`/`remove` resolving. The session stays
`anonymous` for the same reason the doc comment already gives: both panels then load nothing and stay
out of the way of whatever the spec is about. Because the helper no longer describes one panel, the
export and the file are renamed to `semestrReportTestingProviders()` /
`semestr-report-testing.ts`, and its doc comment is updated to name both panels.

**Files (call sites, all four must move with the rename)**:
`src/app/semestr-report/semestr-report.component.spec.ts:8,33,156,253` and
`src/app/shared/testing/pdf-fidelity/pdf-fidelity-capture.spec.ts:6,53`. The second one is the PDF
capture harness — the surface Phase 3's fidelity check runs on, so it must be green before that phase
starts.

#### 5. Specs

**File**: `src/app/students/student-picker/student-picker.component.spec.ts` (new),
`src/app/students/student-identity-diff.spec.ts` (new)

**Intent**: Cover the decisions, not the rendering: what the diff classifies, when the dialog appears,
what Cancel does, and that a load failure leaves a retry on screen.

**Contract**: The picker spec drives a fake `StudentsService` and a stubbed `MatDialog`. Cases:
pick onto an empty form emits without a dialog; pick over a filled form opens the dialog and emits
only on confirm; Cancel emits nothing **and** leaves `studentControl` at the previous id; a rejected
`load()` renders the failure key. Spread `translateTestingImports` per `src/CLAUDE.md`.

**File**: `src/app/semestr-report/semestr-report.component.spec.ts`

**Intent**: Prove the write stays inside its half of the partition.

**Contract**: Add a case asserting that `applyStudentIdentity()` changes exactly the four
`STUDENT_IDENTITY_FIELDS` controls and leaves every `TEMPLATE_DOMAIN` and `PER_STUDENT_FIELDS` control
at its prior value. The existing partition assertions stay as they are.

### Success Criteria:

#### Automated Verification:

- Unit tests pass, including the new picker and diff specs: `npm test -- --watch=false --browsers=ChromeHeadless`
- The PDF capture harness still instantiates every report type after the picker is mounted: `npm run test:capture`
- Linting passes: `npm run lint`
- Production build type-checks: `npm run build`
- Development build type-checks: `npm run build -- --configuration development`
- i18n key parity holds between `pl.json` and `en.json`

#### Manual Verification:

- Picking a student on a blank form fills all four identity fields with no dialog
- Picking a different student over a filled form lists the affected fields, and Confirm applies them
- Cancel leaves both the form and the select showing the previous student
- Applying a template after picking, and picking after applying a template, leave the other's fields untouched
- An empty roster shows the empty-state message instead of an empty select

**Implementation Note**: Pause for manual confirmation before proceeding.

---

## Phase 3: Re-map descriptive marks when `sex` changes

### Overview

Close the hazard the picker sharpens: six mark controls holding the other gender's sentence. Driven by
`sex` rather than by the picker, so a manual change of the sex select behaves identically.

### Changes Required:

#### 1. The pure helper

**File**: `src/app/helper/marks/sex-variant.ts` (new, plus `sex-variant.spec.ts`)

**Intent**: Given a mark list and a currently selected sentence, return the same sentence in the other
gender's variant. Pure TypeScript with no Angular, so it lives under `src/app/helper/` per the folder
map.

**Contract**: `counterpartValue(list: Marks[], value: string | null, isMale: boolean): string | null`.
Finds the entry whose `value` **or** `valueFemale` equals `value`, then returns `isMale ? entry.value
: (entry.valueFemale ?? entry.value)`. Returns `value` unchanged when nothing matches — a stored
sentence from an older list stays put rather than being blanked. Matching on both sides is what makes
the function its own inverse; several entries (all of `pronunciationMarks`) carry identical variants,
where it is a no-op by construction.

#### 2. The report-side hook

**File**: `src/app/semestr-report/semestr-report.component.ts`

**Intent**: Keep the six selects and their option lists in agreement whenever `sex` flips, so no
select goes blank and no wrong-gender sentence reaches the PDF.

**Contract**: A module-level `MARK_CONTROLS: readonly { control: string; list: Marks[] }[]` naming the
six sex-aware pairs — `pronunciation`, `vocabulary`, `prepareToLecture`, `homeworks`, `involvement`,
`behaviour`. `frequency` and `avgMark` are deliberately absent: their lists carry no `valueFemale`.
In `ngOnInit`, subscribe to `form.controls['sex'].valueChanges` with `takeUntilDestroyed(destroyRef)`,
holding the previous value; remap only when `previous === Sex.MALE` differs from `next === Sex.MALE`
— the same predicate `markOptions()` uses, and what makes the re-entrant pass a no-op. Write with
`patchValue` on the six controls; leave every other control alone.

#### 3. Boundary note

**File**: `src/app/templates/template-domain.ts`

**Intent**: Record that the remap writes `PER_STUDENT_FIELDS` values without moving any field across
the partition, so the next reader does not read it as a widening of the picker's domain.

**Contract**: Two or three sentences at `PER_STUDENT_FIELDS`. The four sets and their membership are
unchanged; the partition spec stays green.

#### 4. PDF-fidelity check

**Intent**: `src/CLAUDE.md:7` puts the `pdfmake` document definition **and its inputs** behind the
capture procedure, and the six mark controls are inputs — `semestr-report.component.ts:589-607` reads
them straight into the document. The document definition itself takes no edit in this slice, so the
check is narrowed to the one report type this phase can reach rather than skipped: skipping it is the
shape still open as Open Roadmap Question #7, from two days ago.

**Contract**: Re-run `npm run test:capture` after the remap lands and compare the trimester/semester
output against the baseline captured in Phase 1, following `docs/pdf-fidelity-check.md`'s checklist.
The other three report types are captured by the same command and are expected to be untouched; a
difference in any of them means something outside this phase's contract moved. Re-read
`semestr-report.fixture.ts` before trusting the comparison — the roadmap records that `F-02`'s
fixtures encode template facts in prose, and `S-05b` rewrote those templates.

### Success Criteria:

#### Automated Verification:

- `counterpartValue` spec covers: male→female, female→male, unmatched value returned as-is, and a list entry with identical variants
- A `semestr-report.component.spec.ts` case asserts that flipping `sex` rewrites the six mark controls and leaves `frequency` and `avgMark` untouched
- Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Post-remap reference PDFs captured: `npm run test:capture`
- Linting passes: `npm run lint`
- Production build type-checks: `npm run build`

#### Manual Verification:

- The trimester/semester PDFs match the Phase 1 baseline per `docs/pdf-fidelity-check.md`, and the other three report types are unchanged

- Filling the six descriptive marks for a boy, then picking a girl from the roster, leaves all six selects populated with the female wording — none blank
- Changing the sex select by hand does the same thing
- The generated PDF for that report reads in the right gender throughout

**Implementation Note**: Pause for manual confirmation before proceeding.

---

## Phase 4: Quick-add inside the picker

### Overview

"This student isn't in my roster yet" arrives mid-report. Add them from the panel, without leaving the
form. This is what closes the deferred navigation cost recorded in `src/CLAUDE.md:50`.

### Changes Required:

#### 1. Quick-add in the panel

**File**: `src/app/students/student-picker/student-picker.component.ts`, `.html`

**Intent**: Create a student from the report form and select them immediately, reusing the component
Phase 1 extracted so there is still one definition of the four fields.

**Contract**: A collapsed "add a student" area, expanded by a button, mounting
`<app-student-form [form]="quickAddForm" [failureKey]="quickAddFailureKey()">` over
`createStudentForm()`. Submit calls `StudentsService.validate()` first (a bad student costs a message,
not a round-trip — the roster's arrangement), then `create()`. On success: reset and collapse the
form, set `studentControl` to the new id with `{ emitEvent: false }`, and route through the **same**
method a manual pick uses, so the diff and the confirmation dialog behave identically. Form-shaped
failures render inline; store-shaped failures go to the snackbar.

**A successful quick-add reloads the list if, and only if, the load had failed.** `StudentsService
.create` sets `loadedFor` on success (`students.service.ts:180`), so creating a student after a failed
`load()` leaves the cache holding exactly that one student — a one-entry roster that looks complete.
`TemplatePanelComponent.save()` and `StudentRosterComponent.submit()` both carry this branch and a
paragraph explaining it; this is the third instance, not a new idea. Unconditional reloading is the
wrong fix: it spends a full-collection read per quick-add against the Spark budget for a cache the
service has already updated.

Every button here passes `[type]="'button'"` — the panel sits inside the report's `<form>`.

#### 2. Translations

**File**: `src/assets/i18n/pl.json`, `src/assets/i18n/en.json`

**Contract**: `students.picker.quickAdd.*` — the toggle label, the submit label, the cancel label, and
the success message — in both bundles.

#### 3. Specs

**File**: `src/app/students/student-picker/student-picker.component.spec.ts`

**Contract**: Quick-add with an invalid student shows the inline failure and calls no `create`;
quick-add with a valid one calls `create`, selects the returned id, and emits the identity through the
same confirm path; a rejected `create` shows the snackbar failure and leaves the selection alone; a
quick-add after a failed `load()` reloads the list, and one after a successful `load()` does not.

### Success Criteria:

#### Automated Verification:

- Unit tests pass, including the quick-add cases: `npm test -- --watch=false --browsers=ChromeHeadless`
- Linting passes: `npm run lint`
- Production build type-checks: `npm run build`
- Development build type-checks: `npm run build -- --configuration development`
- i18n key parity holds between `pl.json` and `en.json`

#### Manual Verification:

- Filling half a report, quick-adding a student, and having them selected leaves every other field exactly as it was
- The new student appears in `/students` afterwards with the same four values
- A quick-add with a blank name, or with no sex, shows the inline message and creates nothing

**Implementation Note**: Pause for manual confirmation before proceeding.

---

## Phase 5: Verification and documentation

### Overview

Run the whole slice end-to-end against the emulators, read one PDF of each gender by eye, and bring
every document that now describes something stale back into agreement.

### Changes Required:

#### 1. Conventions

**File**: `src/CLAUDE.md`

**Intent**: The paragraph at `:50` states that the shell reset "stops being acceptable in `S-04`" and
leaves the fix open. It is now closed, and by quick-add rather than by preserved state — a future
agent reading it as still-open would build the navigation refactor this plan deliberately declined.
The folder map and the templates paragraph also need the new files.

**Contract**: Update the shell-reset paragraph to record the resolution and that leaving the shell
still drops the form (unchanged, and now unnecessary for the roster case). Add
`students/student-picker/`, `students/student-form/`, `students/student-failure-keys.ts`,
`students/student-identity-diff.ts` and `helper/marks/sex-variant.ts` to the folder map. Add a
sentence to the form-model paragraph (`:82`) about the sex-driven remap: it changes values inside
`PER_STUDENT_FIELDS` without moving the partition, and it is keyed on `sex`, not on the picker.

#### 2. Roadmap

**File**: `context/foundation/roadmap.md`

**Contract**: An `Outcome (YYYY-MM-DD)` block under `### S-04` recording what shipped and the three
deliberate calls (remap on every sex change, always-load on mount, no full PDF capture); status →
`done`; the Backlog Handoff row updated. All four slices are then done — say so at the top if the
"At a glance" table needs it.

#### 3. PRD

**File**: `context/foundation/prd.md`

**Intent**: FR-013 names the pre-fill but not the remap, and the remap changes values in fields FR-013
says the picker does not own.

**Contract**: A dated amendment under FR-013 in the same style as FR-005's — the picker writes only
the four identity fields, and a `sex` change (from any source) re-maps the six descriptive marks to
the matching variant, because the option lists are sex-dependent.

#### 4. Full-flow verification

**Intent**: The seam between the app and Firebase is where `S-01`'s three defects lived; a green suite
says nothing about it.

**Contract**: With the emulators running and a seeded `allowedUsers` document: sign in, add two
students of different sexes, write a report picking each, apply a template in both orders relative to
the pick, quick-add a third student mid-report, and download one PDF per gender. Read both PDFs by eye
against `docs/pdf-fidelity-check.md`'s checklist. Sign in as a second seeded account and confirm its
picker lists only its own students.

### Success Criteria:

#### Automated Verification:

- Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Linting passes: `npm run lint`
- Production build type-checks: `npm run build`
- Development build type-checks: `npm run build -- --configuration development`

#### Manual Verification:

- The full flow runs against the emulators: pick, template in both orders, quick-add, PDF
- One male and one female PDF read correctly and match the reference layout by eye
- A second seeded account's picker lists only its own students
- `src/CLAUDE.md`, the roadmap, and the PRD agree with what shipped

**Implementation Note**: Pause for manual confirmation before proceeding.

---

## Phase 6: Release

### Overview

Merge into the integration branch and publish. No Firestore rules changed, so this is a hosting-only
release — the rules-first ordering that `S-02` and `S-03` needed does not apply.

### Changes Required:

#### 1. Merge and deploy

**Intent**: `10xdevs` is the deploy base and the only one. Building from anywhere else silently rolls
production back past the sign-in gate (`src/CLAUDE.md:30`).

**Contract**: Merge `10xdevs-S04` into `10xdevs`, confirm `git branch --show-current`, `npm run build`,
gate on `ls dist/browser/index.html`, then `npx firebase deploy --only hosting`. No
`firebase deploy --only firestore:rules` — `firestore.rules` is untouched. Run `npm run test:rules`
anyway as a regression check that nothing in the rules moved.

#### 2. Post-deploy verification

**Contract**: Against production: sign in, pick a student, apply a template, quick-add a student,
download a PDF, and confirm a second seeded account sees only its own roster in the picker. App Check
enforcement is on, so a clean sign-in followed by a failing read is App Check, not rules
(`src/CLAUDE.md:66`).

**If verification fails, roll back the Hosting release** (Firebase Console → Hosting → the previous
release → Rollback). Nothing here is one-way: no rule, no index, and no stored document shape changes,
so the previous client keeps reading every student and template written since. That is the whole
revert — there is no data step to undo.

### Success Criteria:

#### Automated Verification:

- Firestore rules tests still pass: `npm run test:rules`
- Production build succeeds and `dist/browser/index.html` exists
- `firebase deploy --only hosting` exits 0

#### Manual Verification:

- Production sign-in, pick, template apply, quick-add, and PDF download all work
- A second seeded account's picker lists only its own students in production

---

## Testing Strategy

### Unit Tests:

- `diffIdentity` — overwritten vs cleared vs unchanged, with `''` and `null` both counting as default
- `counterpartValue` — both directions, unmatched value, identical-variant entry
- `StudentPickerComponent` — dialog appears only when the diff is non-empty; Cancel emits nothing and
  reverts the select; load failure renders the retry; quick-add success selects and applies; quick-add
  validation failure calls no `create`; quick-add reloads only after a failed load
- `SemestrReportComponent` — `applyStudentIdentity` writes exactly the four identity controls; a `sex`
  flip rewrites the six mark controls and no others; the existing four-set partition assertions

### Integration Tests:

None. There is no integration harness in this project beyond `test/rules/`, and this slice adds no
rule. `test/rules/students.test.mjs` already covers the collection the picker reads.

### Manual Testing Steps:

1. Start `npm run emulators` and `npm start`; seed an `allowedUsers` document and sign in
2. Add two students of different sexes at `/students`
3. On the trimester/semester tab, pick the first student — the four fields fill, no dialog
4. Fill the six descriptive marks, then pick the second student — the dialog lists the identity fields
   it will overwrite; after confirming, all six marks are populated in the new gender and none is blank
5. Cancel a pick — the form and the select both stay on the previous student
6. Apply a template before and after a pick — neither touches the other's fields
7. Quick-add a third student mid-report — the form survives and the new student is selected
8. Download one male and one female PDF and read the prose and layout
9. Sign in as a second seeded account and confirm the picker lists only its own students

## Performance Considerations

The picker reads the whole `students` collection every time it mounts, and the trimester/semester tab
mounts on every visit to it. On Spark's 50K reads/day this is a real, accepted cost — see Open Risks.
Everything else is in-memory: the diff is over four fields, the remap over six controls.

## Migration Notes

None. No stored document changes shape, `STUDENT_SCHEMA_VERSION` and `TEMPLATE_SCHEMA_VERSION` both
stay at 1, and every student written by `S-03` is readable by this slice unchanged.

## Open Risks & Assumptions

- **Always-loading on mount costs a collection read per tab visit** (recorded decision, against the
  cached alternative). The mitigation if it bites: `StudentsService.hasFreshRoster()` already exists
  and switching to it is a two-line change in `ngOnInit`.
- **The PDF-fidelity check is narrowed, not skipped.** `src/CLAUDE.md:7` puts the `pdfmake` document
  definition *and its inputs* behind `docs/pdf-fidelity-check.md`, and the remap rewrites inputs. The
  baseline is captured in Phase 1 before any edit and compared in Phase 3; what is *not* done is a
  field-by-field re-verification of the other three report types, which this slice cannot reach. The
  residual risk is that `semestr-report.fixture.ts` encodes template facts in prose and `S-05b`
  rewrote those templates — re-read it before trusting the comparison.
- **The remap changes behaviour beyond FR-013** (recorded decision): a manual sex change now rewrites
  marks too. This fixes a pre-existing silent defect, but it is a change to a form under the
  preservation guardrail and is documented as such in the PRD amendment.
- **Phase 1 refactors a surface deployed 2026-07-31.** The roster's 522-line spec is the safety net;
  if it needs more than query-path updates, that is a signal the extraction went too far.

## References

- Roadmap slice: `context/foundation/roadmap.md` → `### S-04`
- Change identity: `context/changes/student-picker-in-report/change.md`
- Seam to copy: `src/app/templates/template-panel/template-panel.component.ts:75`
- Domain agreement: `src/app/students/student-domain.spec.ts`
- PDF guardrail: `docs/pdf-fidelity-check.md`, `src/CLAUDE.md:7`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Extract the shared student form

#### Automated

- [x] 1.1 Reference PDFs captured before any edit, from the branch point `67588f4` — 139a2c1
- [x] 1.2 Unit tests pass — 139a2c1
- [x] 1.3 Linting passes — 139a2c1
- [x] 1.4 Production build type-checks — 139a2c1

#### Manual

- [x] 1.5 Roster still adds, lists, edits, and deletes with the same validation messages — 139a2c1
- [x] 1.6 Edit still scrolls the form into view and focuses the first field — 139a2c1

### Phase 2: The picker panel and its wiring into the report form

#### Automated

- [x] 2.1 Unit tests pass, including the new picker and diff specs — af51052
- [x] 2.2 The PDF capture harness still instantiates every report type after the picker is mounted — af51052
- [x] 2.3 Linting passes — af51052
- [x] 2.4 Production build type-checks — af51052
- [x] 2.5 Development build type-checks — af51052
- [x] 2.6 i18n key parity holds between pl.json and en.json — af51052

#### Manual

- [x] 2.7 Picking on a blank form fills all four identity fields with no dialog — af51052
- [x] 2.8 Picking over a filled form lists the affected fields and Confirm applies them — af51052
- [x] 2.9 Cancel leaves both the form and the select on the previous student — af51052
- [x] 2.10 Template apply and pick, in either order, leave the other's fields untouched — af51052
- [x] 2.11 An empty roster shows the empty-state message — af51052

### Phase 3: Re-map descriptive marks when `sex` changes

#### Automated

- [x] 3.1 `counterpartValue` spec covers both directions, unmatched value, and identical variants
- [x] 3.2 A spec asserts a `sex` flip rewrites the six mark controls and leaves `frequency` and `avgMark` untouched
- [x] 3.3 Unit tests pass
- [x] 3.4 Post-remap reference PDFs captured
- [x] 3.5 Linting passes
- [x] 3.6 Production build type-checks

#### Manual

- [x] 3.7 The trimester/semester PDFs match the Phase 1 baseline, and the other three report types are unchanged
- [x] 3.8 Six marks filled for a boy survive picking a girl, in female wording, none blank
- [x] 3.9 Changing the sex select by hand does the same
- [x] 3.10 The PDF for that report reads in the right gender throughout

### Phase 4: Quick-add inside the picker

#### Automated

- [ ] 4.1 Unit tests pass, including the quick-add cases
- [ ] 4.2 Linting passes
- [ ] 4.3 Production build type-checks
- [ ] 4.4 Development build type-checks
- [ ] 4.5 i18n key parity holds between pl.json and en.json

#### Manual

- [ ] 4.6 Quick-adding mid-report leaves every other field exactly as it was
- [ ] 4.7 The new student appears in `/students` with the same four values
- [ ] 4.8 An invalid quick-add shows the inline message and creates nothing

### Phase 5: Verification and documentation

#### Automated

- [ ] 5.1 Unit tests pass
- [ ] 5.2 Linting passes
- [ ] 5.3 Production build type-checks
- [ ] 5.4 Development build type-checks

#### Manual

- [ ] 5.5 The full flow runs against the emulators: pick, template in both orders, quick-add, PDF
- [ ] 5.6 One male and one female PDF read correctly and match the reference layout by eye
- [ ] 5.7 A second seeded account's picker lists only its own students
- [ ] 5.8 `src/CLAUDE.md`, the roadmap, and the PRD agree with what shipped

### Phase 6: Release

#### Automated

- [ ] 6.1 Firestore rules tests still pass
- [ ] 6.2 Production build succeeds and `dist/browser/index.html` exists
- [ ] 6.3 `firebase deploy --only hosting` exits 0

#### Manual

- [ ] 6.4 Production sign-in, pick, template apply, quick-add, and PDF download all work
- [ ] 6.5 A second seeded account's picker lists only its own students in production

### PDF fidelity check

- Date: 2026-08-03 (Phase 3, after the sex-driven mark remap landed)
- Report types compared: all four, both fixtures each — trimester/semester under this phase's contract,
  the other three as the regression check
- Before: `../br-before-pdfs-S04`, captured in Phase 1 from the branch point `67588f4`
- After: `docs/pdf-fidelity/captured/`, emptied first (eight files, no ` (1)` in any name)
- Method: the `docs/pdf-fidelity-check.md` §7 supporting byte comparison, then the §6 checklist by eye
- Byte comparison: all eight files identical in size, and every differing byte falls inside the two
  documented non-deterministic regions — the five digits of `(D:…)` in the `/CreationDate` object and
  the two hex strings in the trailer's `/ID`. No content stream differs by a byte in any of the eight.
- Fixture re-read: `semestr-report.fixture.ts` still describes the composed template accurately (the
  `S-05b` notes about `formArrayName` and the `class` binding both hold). Neither fixture exercises a
  `sex` flip — `semestr-minimal` patches `sex` before its marks and `semestr-maximal` never leaves the
  female side — so the capture proves the remap perturbs no recorded state, which is what the guardrail
  asks of it.
- Verdict: no differences. The §6 visual pass (Progress item 3.7) is the human's, and it is reading
  files whose content streams are already proven byte-identical.
