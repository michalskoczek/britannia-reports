<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Student Picker in the Trimester/Semester Report

- **Plan**: `context/changes/student-picker-in-report/plan.md`
- **Mode**: Deep (codebase verification run inline, no sub-agent)
- **Date**: 2026-07-31
- **Verdict**: REVISE → **SOUND after fixes** (all six findings fixed in the plan)
- **Findings**: 0 critical, 4 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | FAIL → PASS after F1, F2, F4, F6 |
| Plan Completeness | WARNING → PASS after F3, F5 |

## Grounding

14/14 paths ✓, 9/9 symbols ✓, brief↔plan ✓, Progress↔Phases ✓ (6/6 phases, 39/39 criteria before
fixes; 48/48 after), no stray checkboxes outside `## Progress`. `docs/reference/contract-surfaces.md`
absent — contract-surface check skipped.

## Findings

### F1 — Phase 2 turns three spec files red, including the PDF-fidelity harness

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots (blast radius)
- **Location**: Phase 2 — Report-side integration
- **Detail**: Mounting `<app-student-picker>` puts `StudentsService` → `StudentsGateway` → `Firestore`
  into every `TestBed` that creates `SemestrReportComponent`. `S-02` solved the same problem for the
  template panel with `templatePanelTestingProviders()` (`src/app/shared/testing/templates-testing.ts`).
  Four call sites depend on it: `semestr-report.component.spec.ts:33,156,253` and
  `pdf-fidelity/pdf-fidelity-capture.spec.ts:53`. The plan named none of them, and the harness that
  breaks is the one the fidelity argument leans on.
- **Fix A ⭐ Recommended**: Extend the existing helper with a `StudentsGateway` stub and rename it
  - Strength: One provider list for "what it takes to render this form"; all four call sites pick it up.
  - Tradeoff: The name stops describing it — the rename touches four files.
  - Confidence: HIGH — read the helper and every call site.
  - Blind spot: None significant.
- **Fix B**: Add a second `studentPickerTestingProviders()` alongside it
  - Strength: No rename, no churn; each panel owns its stubs.
  - Tradeoff: Every future spec must spread both; forgetting one fails with a DI error far from its cause.
  - Confidence: HIGH
  - Blind spot: None significant.
- **Decision**: FIXED via Fix A — new "#### 4. Testing providers" entry in Phase 2, renaming the export
  and file to `semestrReportTestingProviders()` / `semestr-report-testing.ts`, with all four call sites
  listed. Phase 2 gained an automated criterion that `npm run test:capture` still runs.

### F2 — Phase 3 modifies pdfmake *inputs*, which the hard rule covers by the letter

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 + Open Risks & Assumptions
- **Detail**: `src/CLAUDE.md:7` reads "do not modify the `pdfmake` document definition **or its
  inputs** … when the task does require it, follow `docs/pdf-fidelity-check.md`". The re-map rewrites
  `form.value.vocabulary` and five siblings, which `semestr-report.component.ts:589-607` reads
  straight into the document. The plan's justification was true but answered a narrower rule than the
  one written down. Open Roadmap Question #7 is the same shape, from two days earlier.
- **Fix A ⭐ Recommended**: Capture before and after Phase 3, compare the trimester/semester output
  - Strength: A real baseline instead of an argument, at roughly the budgeted cost.
  - Tradeoff: Headed Chrome, and the baseline must be captured before any edit lands.
  - Confidence: MEDIUM — `test:capture` writes all four report types; narrowing it was not confirmed.
  - Blind spot: Whether `semestr-report.fixture.ts` still describes the post-`S-05b` template.
- **Fix B**: Keep the decision but name the rule being departed from
  - Strength: Preserves the recorded call for one paragraph.
  - Tradeoff: `S-04` inherits a twin of Question #7.
  - Confidence: HIGH
  - Blind spot: None significant.
- **Decision**: FIXED via Fix A — baseline capture added to Phase 1 (before any edit, from `67588f4`),
  a "#### 4. PDF-fidelity check" entry and a post-remap capture added to Phase 3, with the comparison
  as a manual criterion. "What We're NOT Doing" and Open Risks rewritten to match.

### F3 — The "Timing" note states the wrong emission order

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Critical Implementation Details — "Timing"
- **Detail**: The plan said the identity write completes before `valueChanges` delivers. That holds
  for the group's stream, not the child's — and Phase 3 subscribes to
  `form.controls['sex'].valueChanges`. `FormGroup.patchValue` writes each child with `onlySelf: true`,
  so the re-map runs after `sex` is set and before `class` is written. Harmless as designed, but
  misleading for anyone who later makes the re-map read another identity field.
- **Fix**: Rewrite the note to say the child stream fires mid-patch, and state the invariant that
  makes it safe.
- **Decision**: FIXED — note rewritten, with the invariant and the condition that would break it.

### F4 — Quick-add omits the reload-on-load-failure branch both existing surfaces have

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 — Quick-add in the panel
- **Detail**: `StudentsService.create` sets `loadedFor` on success (`students.service.ts:180`), so a
  create after a failed `load()` leaves the cache holding exactly one student — a one-entry roster
  that looks complete. `TemplatePanelComponent.save()` and `StudentRosterComponent.submit()` both
  guard this, each with a paragraph on why. Phase 4 copied the validate-first arrangement but not this.
- **Fix**: Add the same conditional reload after a successful quick-add and cite both precedents.
- **Decision**: FIXED — branch added to the Phase 4 contract with the reasoning, plus a spec case
  asserting it reloads only after a failed load.

### F5 — `collectStudentIdentity` needs a null→'' coercion the plan denied

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Report-side integration
- **Detail**: `StudentIdentity.studentName` is `string` while the control starts at `null`
  (`semestr-report.component.ts:906`). The compiler catches the collect side loudly; the silent half
  is the diff, which must read `null` and `''` as the same default or a blank form reports
  `studentName` as a field the pick would overwrite.
- **Fix**: State the coercion in the `collectStudentIdentity` contract.
- **Decision**: FIXED — coercion and its consequence for the diff both stated.

### F6 — Phase 6 has no rollback note

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 — Release
- **Detail**: Post-deploy verification was specified; the response to its failure was not. Nothing
  here is irreversible — no rule, index, or schema change — so the revert is a Hosting release
  rollback, but the plan left it to be worked out live.
- **Fix**: One line naming the Hosting release rollback as the revert path.
- **Decision**: FIXED — rollback paragraph added, recording that there is no data step to undo.
