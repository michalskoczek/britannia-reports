# Student Picker in the Trimester/Semester Report — Plan Brief

> Full plan: `context/changes/student-picker-in-report/plan.md`

## What & Why

A teacher writing a trimester/semester report picks a student from their own roster instead of
retyping the four identity fields. This is `S-04`, the last slice of the change, and it completes
US-01 end-to-end: roster → picker → template → PDF. `S-02` and `S-03` both landed and deployed, so
nothing blocks it.

## Starting Point

Both seams already exist and are machine-checked. `TemplatePanelComponent` exchanges a typed payload
with `SemestrReportComponent` and never touches `form` — the shape to copy. `StudentIdentity` holds
exactly the four controls a template may never write, and `student-domain.spec.ts` asserts that
equality, so **no mapping layer is needed**. `StudentsService` already has list, create, validation
and a uid-gated cache; no new collection, no `firestore.rules` change. Two costs land here: `/students`
is a route, so leaving the shell drops a half-filled report form; and the six descriptive-mark selects
build their options from `sex`, so flipping `sex` leaves already-chosen marks matching no option —
blank on screen, wrong gender in the PDF.

## Desired End State

A student panel sits above the template panel. Picking a student fills the four identity fields, with
a confirmation dialog listing anything it would overwrite or clear. An "add a student" area in the same
panel creates and selects a student without leaving the form. Whenever `sex` changes — from the picker
or from the select by hand — every chosen descriptive mark is rewritten to the matching variant, so no
select goes blank and no PDF carries the wrong gender.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Picker placement & widget | Panel above the form, `app-select` | Symmetry with the template panel; no widget outside the shared wrappers |
| Non-empty identity fields | Confirmation dialog listing affected fields | One mental model for both pre-fill mechanisms; reuses the FR-011 dialog |
| Marks vs. a sex flip | Re-map values to the other variant | The teacher loses no choice and the form stays coherent |
| Scope of the re-map | Every `sex` change, not just the picker | One place, one behaviour — and it closes a defect reachable manually today |
| "Not in my roster yet" | Quick-add inside the panel | Solves it at the source, no navigation refactor, no lost form state |
| Roster loading | `load()` on every mount | Always fresh; the read cost is accepted (see risks) |
| Quick-add fields | Shared `StudentFormComponent` extracted from the roster | One definition of the four controls and their messages |
| PDF verification | Capture the baseline before any edit, compare the trimester/semester output after the re-map | The hard rule in `src/CLAUDE.md:7` covers pdfmake *inputs*, and the re-map rewrites them |

## Scope

**In scope:** picker panel on the trimester/semester form; identity pre-fill with a confirmation
diff; sex-driven mark re-map; in-form quick-add; shared student-form extraction; specs; docs; hosting
release.

**Out of scope:** the other three report forms; preserved shell state / `RouteReuseStrategy`; edit or
delete from the picker; search/autocomplete; any change to `TEMPLATE_DOMAIN` or the four-set partition;
any `pdfmake`, Firestore rules, schema, or collection change.

## Architecture / Approach

`StudentPickerComponent` (in `src/app/students/`) takes `currentIdentity` as an input and emits the
picked `StudentIdentity` — it never sees `form`. `SemestrReportComponent` gains
`collectStudentIdentity()` / `applyStudentIdentity()`, both iterating `STUDENT_IDENTITY_FIELDS`, the
mirror of the template pair it already has. The diff lives in a pure `student-identity-diff.ts`; the
mark re-map in a pure `helper/marks/sex-variant.ts`, hooked to `form.controls['sex'].valueChanges` in
the report component — keyed on `sex`, not on the picker, which is what makes the manual path behave
the same. No field moves between the four sets of `template-domain.ts`.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Shared student form | Four controls + failure keys extracted; roster rewired, no behaviour change | Refactors a surface deployed 2026-07-31; the roster's 522-line spec is the net |
| 2. Picker panel + wiring | FR-013 itself: list, diff, dialog, `applyStudentIdentity` | Mounting the picker pulls Firestore into every spec that renders the form, the fidelity harness included; and two pre-fill mechanisms must stay disjoint in both orders |
| 3. Mark re-map | Six marks follow a `sex` flip in either direction | Re-entrancy on `valueChanges`; guarded by the same predicate `markOptions()` uses |
| 4. Quick-add | Create and select a student without leaving the form | Panel lives inside the report's `<form>` — an unqualified button downloads a PDF |
| 5. Verification & docs | Full emulator run, two PDFs by eye, `src/CLAUDE.md` + roadmap + PRD synced | The Firebase seam is where a green suite says nothing |
| 6. Release | Merge to `10xdevs`, hosting deploy | Deploying from the wrong branch rolls production back past the sign-in gate |

**Prerequisites:** `S-02` and `S-03` merged and deployed (both are); emulators + JDK for local runs;
branch `10xdevs-S04` (already at `10xdevs`'s head).
**Estimated effort:** ~3–4 sessions across six phases; phases 1, 3 and 6 are small, but three of them
carry a headed-Chrome capture run.

## Open Risks & Assumptions

- Loading the roster on every panel mount costs one collection read per visit to the tab, against
  Spark's 50K/day. Accepted; `hasFreshRoster()` already exists if it needs reversing.
- The fidelity check is narrowed rather than skipped: baseline in Phase 1, comparison of the
  trimester/semester output in Phase 3. The other three report types are captured as a regression
  check, not re-verified. Residual risk: `semestr-report.fixture.ts` encodes template facts in prose
  and `S-05b` rewrote those templates — re-read it before trusting the comparison.
- The re-map changes behaviour beyond FR-013 (manual sex change included). Deliberate; recorded as a
  dated PRD amendment.

## Success Criteria (Summary)

- A teacher picks a student and the four identity fields fill; a template applied before or after
  leaves them untouched, and vice versa.
- A student missing from the roster can be added mid-report without losing the form.
- No report reaches a parent with wrong-gender wording or a blank mark select after a sex change.
