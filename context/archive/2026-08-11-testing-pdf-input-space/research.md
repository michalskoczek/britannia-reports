---
date: 2026-08-11T10:58:43+02:00
researcher: Michał Skoczek
git_commit: ad1c51dbac360e3b36c9c00123f5b171393af826
branch: 10xdevs-m3l2
repository: britannia-reports
topic: "Phase 1 — PDF generation survives the real input space (test-plan.md §3, Risk #1)"
tags: [research, codebase, pdf-generation, pdfmake, report-forms, test-plan-phase-1, risk-1]
status: complete
last_updated: 2026-08-11
last_updated_by: Michał Skoczek
---

# Research: PDF generation survives the real input space

**Date**: 2026-08-11T10:58:43+02:00
**Researcher**: Michał Skoczek
**Git Commit**: `ad1c51dbac360e3b36c9c00123f5b171393af826`
**Branch**: `10xdevs-m3l2`
**Repository**: britannia-reports

## Research Question

Phase 1 of `context/foundation/test-plan.md` §3 — *"PDF generation survives the real
input space"*, covering Risk #1: a teacher fills a report, clicks download, and no
PDF appears because the builder throws on input the teacher could legitimately enter.

The §2 Risk Response Guidance requires this research to ground three things:

1. Which form states are legitimately reachable (validators vs. defaults vs.
   never-bound arrays).
2. What the PDF builder consumes vs. what the form holds.
3. Where the throw actually surfaces and what the user sees when it does.

**Scope decisions taken at the start of this research** (recorded in `change.md`):

- **All four report types** are in scope. §7's exclusion of the three non-templated
  report types covers ongoing *feature* coverage, not generation robustness, and
  Risk #1's own Source column names hot-spots in both `src/app/semestr-report/`
  and `src/app/year-report/`.
- **Item 3 above is out of scope.** Risk #1 has two halves — the builder throws,
  and the teacher gets no signal. This change researches only the first. Surfacing
  a user-visible error is a separate change if the team wants one.

## Summary

**Risk #1 is not hypothetical. Two reachable crashes exist today, both in the
year-end report, and the existing test suite is green over both of them.**

The headline finding is not that the crashes exist — it is *why the suite doesn't
see them*. The four smoke specs render two fixtures per report type through real
pdfmake and assert the output is a genuine PDF. That is a stronger harness than
the test plan credits it with. But the fixtures were hand-authored to reach states
that work, and in one case the fixture's own doc comment says so out loud:

> "Leaving it null throws before pdfmake is ever called, **which is why even the
> minimal fixture sets it**."
> — `src/app/shared/testing/pdf-fidelity/fixtures/year-report.fixture.ts:9-11`

The crash was known, written down next to the test, and stepped around rather than
fixed or covered. The gap Phase 1 must close is therefore **not** missing machinery.
The interception helper and the blob-rendering assertion already do everything a
Phase 1 test needs. The gap is that **the set of recorded inputs is a curated safe
path, not a map of the reachable state space.**

Four findings drive everything below:

1. **Two confirmed throws**, both reachable with no bypass, both in `year-report`
   — which is precisely the form with zero validators and no disabled button.
2. **A four-way asymmetry in submit gating** that nobody appears to have designed:
   two forms gate on `form.invalid`, one has a gate that can never fire, and one
   has no gate at all.
3. **Widespread `"null"` / `"undefined"` string leakage into PDFs** — not crashes,
   but the same class of defect from the teacher's side, and mostly *not* what
   Phase 1's "no PDF appears" framing predicted.
4. **The oracle is thin.** The PRD documents exactly one required field across all
   four forms. Most of what a test would want to assert about "legitimate input"
   has no documentary basis — see [Open Questions](#open-questions).

### Correction to `test-plan.md` §2

Per §1 principle #3 — *"If the plan and research disagree about where the failure
lives, research is the ground truth"* — one claim in the guidance table is wrong:

| `test-plan.md:68` says | Research found |
|---|---|
| "It renders **one** fixture per report type, from a happy-path shape." | It renders **two** — `minimal` and `maximal` — per report type, eight in total (`docs/pdf-fidelity-check.md:28-37`), and the minimal shapes are deliberately *not* happy-path; they are required-fields-only. |
| (implied) the assertion is weak | The assertion renders through real pdfmake to a `Blob` and checks the `%PDF` magic bytes (`semestr-report.component.spec.ts:58-72`). It is a real renderability assertion, not a tautology. |

The challenge the plan wanted to make still lands — it just lands somewhere sharper.
The suite is green not because generation is safe, but because **the fixtures encode
the states that work**, one of them by explicit documented intent. That is a better
argument for Phase 1 than the one the plan wrote down, and it should replace it.

---

## Detailed Findings

### A. The two confirmed throws

Both are in `src/app/year-report/year-report.component.ts`. Both are reachable by a
teacher with no developer tools, no bypass, and no unusual input — only by *not*
filling something in.

#### A1. `class` unset → `TypeError` before pdfmake is called

```ts
{ text: `${form.value.class.value}` },     // year-report.component.ts:409
```

`class` on this form binds the **whole `{label, value}` option object** into the
control (`year-report.component.ts:138-140`), unlike the semester/trimester form
whose `class` holds a plain string. The builder therefore reads one level deeper.
Its default is `null` (`year-report.component.ts:764`), it carries no validator, and
nothing blocks submission — so `null.value` throws.

**Reachability**: open the year-end tab, type nothing, click download. That is the
entire reproduction. Confirmed by direct read of the file.

#### A2. All seven detail rows deleted → empty table body → pdfmake throws

`getBodyInSkills` (`year-report.component.ts:650-746`) builds a table body from seven
rows, each independently suppressed by its own "delete" checkbox:

```ts
const arrDetails: any[] = [];              // :653 — no unconditional header row
if (!formValue.eofEvaluationDelete) { arrDetails.push([...]); }
// ...six more, each behind its own `if (!formValue.<x>Delete)`
return arrDetails;                          // :745
```

It is handed straight to pdfmake with no `headerRows` and no floor on row count
(`year-report.component.ts:748-756`). Tick all seven checkboxes — each defaults to
`false` and each is an ordinary `mat-checkbox` in the UI — and `body` is `[]`.

pdfmake 0.3.9 then does this, unguarded, during table measurement:

```js
for (col = 0, cols = node.table.body[0].length; col < cols; col++) {   // pdfmake.js:4083
```

`body[0]` is `undefined`, so `.length` throws. Verified directly: pdfmake is at
0.3.9, and the unguarded `node.table.body[0].length` access appears at
`node_modules/pdfmake/build/pdfmake.js:518` and `:4083`.

**This is the only table in the entire codebase without a structural floor on row
count.** Every other table in all four reports either uses fixed array literals or
unconditionally pushes a header row first — Cambridge's exam tables even emit a
`'-'`-filled placeholder row when their source array is empty
(`helper/cambridge/static-function/generate-table.ts:50-51`). The year-end detail
table is the lone exception, and the workflow that triggers it ("I don't want these
rows in this report") is an ordinary thing for a teacher to want.

### B. Submit gating is inconsistent across the four forms

This asymmetry is the reason both crashes live where they do. It does not appear to
be a decision anyone made; it reads as drift.

| Report | `Validators.required` count | Download button gate | Untouched form downloadable? |
|---|---|---|---|
| Semester/trimester | 9 — `reportType`, `studentName`, `sex`, and the six descriptive marks | `[disabled]="form.invalid"` (`semestr-report.component.html:408`) | No |
| Cambridge | **1** — `studentName` only | `[disabled]="form.invalid"` (`cambridge-report.component.html:285`) | No — but only a name is needed |
| Year-end | **0** | **none** (`year-report.component.html:305-309`) | **Yes** |
| Teddy Eddie | **0** | **none**; `(clicked)="downloadPDF()"`, not even a submit form (`teddy-eddie-report.component.html:38`) | **Yes** |

Verified independently of the agent reports by grepping every report template for
`disabled` / `ngSubmit` / `app-button`.

Two compounding details:

- **`[required]` on the shared form wrappers is cosmetic.** All four wrappers declare
  `required = input<boolean>(false)` purely to drive an asterisk and an aria
  attribute (`input-text.component.ts:28`, `select.component.ts:28`,
  `date.component.ts:46`, `textarea.component.ts:27`). Nothing attaches a validator.
  Confirmed by grep: those declaration lines are the *only* occurrences of the word
  in those files.
- **Teddy Eddie shows three red-asterisked "required" fields that are not
  validated.** `teddy-eddie-form.component.html:5,12,20` sets `[required]="true"` on
  `studentName`, `age`, and `date`; none of the three is enforced. A teacher can
  submit past three fields the UI is visibly marking as mandatory.

So on Teddy Eddie, `form.invalid` is `false` by construction — a `[disabled]`
binding added there today would still never fire.

### C. What reaches the PDF when a field is empty

Distinct from the crashes, and higher-frequency: unguarded template-literal
interpolation coerces `null`/`undefined` into visible words in the generated
document. These do not throw. A PDF *is* produced — it just contains the word
`null` where a teacher expected their content.

| Site | Expression | Empty-state output |
|---|---|---|
| `year-report.component.ts:687,700,713,726,739` | `` `${formValue.certificationPurposeOnThisYear}` `` and four siblings | literal `"null"` per unfilled row — **the default state of a freshly opened year-end form yields up to five of these**, since the two rows above them (`eofEvaluation`, `frequency`) use a `? : '-'` fallback and these five do not |
| `semestr-report.component.ts:689`, `cambridge-report.component.ts:286`, `year-report.component.ts:413` | `addSpaceAfterTeacher(form.value.teachers)` — guard is `if (!teachers) return;` | returns `undefined` → literal `"undefined"` in the "Lektor" cell of **all three** reports, including the two that are otherwise gated |
| `cambridge-report.component.ts:282,289` | `` `${form.value.class ? form.value.class : undefined}` `` | literal `"undefined"` — the ternary actively produces it |
| `semestr-report.component.ts:623-625,731,758` | `changeXToStudentName(textValue, form.value.name)` → `.replace(...)` | `name` is optional and distinct from the required `studentName`; blank `name` splices `"null"` into the descriptive-mark sentences |

The `teachers` row deserves emphasis: it is unguarded in **every** report including
the two with working submit gates, because `teachers` carries no validator anywhere.
This is the one defect in this table that the disabled-button gate does not mitigate.

Note that `text: null` as a *raw property* (not inside a template literal) is
neutralized to `''` by pdfmake's `DocPreprocessor` (`pdfmake.js:409-419`), which is
why the Teddy Eddie table's unguarded `text: item.course` renders a blank cell
rather than the word `null`. The defect is specifically **template-literal
interpolation**, not null-handling in general.

### D. Never-bound controls — large, inert, and a trap for a state-space test

A form-state test that enumerates `Object.keys(form.controls)` would walk a great
deal of dead surface:

| Report | Controls | Never bound in any template | Read by the builder? |
|---|---|---|---|
| Semester/trimester | 48 | 22 (the `UNREACHABLE_FIELDS` partition, `template-domain.ts:120-143`) | No |
| Cambridge | 39 | **22** — over half | No |
| Year-end | 24 | 1 (`sex`) + `comments` FormArray | No |
| Teddy Eddie | 13 | 4 (`avgMark`, `frequency`, `learningRecommendations`, `recommendations`) | No |

The semester/trimester set is deliberate and machine-checked — the four-set partition
in `template-domain.ts` is asserted pairwise-disjoint and exhaustive by a spec. The
other three are undocumented copy-paste scaffolding. In all four cases the builder
never reads them, so they are inert rather than a data-loss risk — but they are a
live trap for any Phase 1 test that tries to generate states by enumerating controls.

**Two dead branches found in passing**, both in `year-report.component.ts:348-365`:
`certificationPurposeText` branches on `form.value.certificationPurposeYES ||
form.value.certificationPurposeNO`. Neither control exists — `createForm` declares
only `certificationPurposeOnThisYear` (`:783`). Verified by grep: the names appear
at `:349,352,354` and nowhere else. The section can never render under any form
state. This is out of Phase 1's scope but should be recorded.

### E. The harness already does what Phase 1 needs

`src/app/shared/testing/pdf-fidelity/render-pdf.ts` is in better shape than the test
plan assumes:

- `capturePdfDefinition(generate)` (`:45-61`) swaps `pdfMake.createPdf` for a closure
  that captures the definition and returns an inert handle, then restores the
  original in a `finally` block. The original is captured once at module load
  (`:29-30`), so repeated swaps cannot corrupt it. The `try/finally` shape was a
  deliberate deviation from the plan's prescribed `spyOn` — recorded as Adaptation #3
  in `pdf-fidelity-baseline/plan.md:103-110` — precisely because **a Jasmine spy
  restores at teardown, not when `generate()` throws mid-call**. That detail matters
  directly for Phase 1, whose tests will deliberately make `generate()` throw.
- `renderToBlob(definition)` (`:64-66`) calls the *saved original* `createPdf`, so it
  performs real pdfmake rendering.

The existing smoke assertion, identical in all four specs:

```ts
reportFixture.apply(component);
const definition = capturePdfDefinition(() => component.generatePDF(component.form));
expect(definition).toBeTruthy();
const blob = await renderToBlob(definition);
expect(blob.size).toBeGreaterThan(0);
expect(blob.type).toBe('application/pdf');
expect(await blob.slice(0, 4).text()).toBe('%PDF');
```

This is important for planning: **the A2 empty-table crash happens inside pdfmake's
measurement pass, not in the builder.** `capturePdfDefinition` alone would not catch
it — the definition object is built fine. Only the `renderToBlob` half surfaces it.
Any Phase 1 test asserting "a document is produced" must render, not just capture.

Bootstrapping cost for a new spec is low and already solved: `translateTestingImports`
plus `provideNoopAnimations()` and `provideNativeDateAdapter()`; only
`SemestrReportComponent` additionally needs `semestrReportTestingProviders()`
(`semestr-report-testing.ts:28-50`) for its Firestore-backed panels. The other three
report components mount no Firebase surface. Every PDF spec raises the Jasmine
timeout to 30s because rendering embeds the base64 banner and the full Roboto VFS.

`npm test` excludes the capture spec via `angular.json:141-143`; the capture harness
is a separate Karma config needing headed Chrome. **Phase 1 needs none of that** — it
lives in the default headless suite.

---

## Code References

**Confirmed crash sites**
- `src/app/year-report/year-report.component.ts:409` — `form.value.class.value`, throws when `class` is null
- `src/app/year-report/year-report.component.ts:650-746` — `getBodyInSkills`, no header row, seven independently-suppressible rows
- `src/app/year-report/year-report.component.ts:748-756` — passes that body to pdfmake with no `headerRows`
- `node_modules/pdfmake/build/pdfmake.js:4083` — unguarded `node.table.body[0].length` (also `:518`)

**Gating**
- `src/app/semestr-report/semestr-report.component.html:408` — `[disabled]="form.invalid"`
- `src/app/cambridge-report/cambridge-report.component.html:285` — `[disabled]="form.invalid"`
- `src/app/year-report/year-report.component.html:305-309` — no gate
- `src/app/teddy-eddie-report/teddy-eddie-report.component.html:38` — `(clicked)`, no gate, no submit form
- `src/app/shared/components/form/{input-text,select,date,textarea}/*.component.ts` — `required` is display-only

**Form definitions**
- `src/app/semestr-report/semestr-report.component.ts:1049-1110` — 48 controls, 9 required
- `src/app/cambridge-report/cambridge-report.component.ts:443-501` — 39 controls, 1 required
- `src/app/year-report/year-report.component.ts:758-801` — 24 controls, 0 required
- `src/app/teddy-eddie-report/teddy-eddie-report.component.ts:52-67` — 13 controls, 0 required
- `src/app/templates/template-domain.ts:35-143` — the machine-checked four-set partition

**`"null"` / `"undefined"` leakage**
- `src/app/year-report/year-report.component.ts:687,700,713,726,739`
- `src/app/semestr-report/semestr-report.component.ts:689`, `cambridge-report.component.ts:286`, `year-report.component.ts:413` — `addSpaceAfterTeacher`
- `src/app/cambridge-report/cambridge-report.component.ts:282,289`
- `src/app/semestr-report/semestr-report.component.ts:623-625`

**Harness**
- `src/app/shared/testing/pdf-fidelity/render-pdf.ts:29-30,45-61,64-66`
- `src/app/shared/testing/pdf-fidelity/report-fixture.ts:5-19`
- `src/app/shared/testing/pdf-fidelity/fixtures/year-report.fixture.ts:7-30` — the doc comment that names the A1 crash
- `src/app/semestr-report/semestr-report.component.spec.ts:58-72` — the smoke assertion block
- `src/app/shared/testing/semestr-report-testing.ts:28-50`
- `angular.json:141-153`, `karma-capture.conf.js`

**Dead code noted in passing**
- `src/app/year-report/year-report.component.ts:348-365` — branches on two controls that do not exist

## Architecture Insights

- **The safety of a report form is currently a property of its validators, and those
  were never designed as a set.** Nine required fields on one form, one on another,
  zero on two. The two crashes are both on a zero-validator form; that is not a
  coincidence, it is the mechanism.
- **Two different null-handling idioms coexist inside one function.** In
  `getBodyInSkills`, two rows use `? value : '-'` and five do not. The inconsistency
  is at adjacent lines in the same method, which suggests rows were added over time
  without a convention to follow.
- **Template-literal interpolation is the specific hazard, not null values.** pdfmake
  neutralizes `text: null` but cannot see inside `` `${null}` ``. Any future guidance
  should name the idiom, not the value.
- **The fidelity fixtures are a *contract about reachability*, not just test data.**
  `report-fixture.ts:5-8` requires that `apply` reach its state "the way the UI
  reaches it." That principle is exactly what Phase 1 extends — the fixtures already
  encode *reachable* states, they just encode only the working ones.
- **Prose in the fixtures carries load-bearing facts that nothing verifies.** Risk #6
  flags this for the fidelity check; it bit Phase 1 too, since the A1 crash is
  documented only in a comment. `report-design-refresh` already had to go back and
  correct that prose once when a restyle moved a cited line
  (`archive/2026-07-28-report-design-refresh/plan.md:600-609`).

## Historical Context (from prior changes)

- `context/changes/pdf-fidelity-baseline/plan-brief.md:19-30` — the harness was scoped
  as **smoke only** by explicit decision: "layout regressions are left to the manual
  procedure." Two fixtures per type was also decided there, because "one fixture never
  catches the 'section absent' path."
- `context/changes/pdf-fidelity-baseline/plan.md:380-386` — its own Open Risks section
  already named this gap: "nothing in `npm test` will notice."
- `context/changes/pdf-fidelity-baseline/plan.md:103-110` — Adaptation #3, why the
  interception helper uses `try/finally` rather than `spyOn`. Directly relevant to
  Phase 1's throwing tests.
- `context/changes/pdf-fidelity-baseline/reviews/impl-review.md:93-127` — Finding F2,
  accepted and still open: the year and Teddy Eddie fixtures build rows via
  `patchValue` onto arrays whose length depends on `setClasses`/`setTableTE`, and
  `FormArray.patchValue` silently discards entries beyond the current length. **A
  static-data change could silently shrink the "maximal" fixture with the suite
  staying green.** No length assertion exists today.
- `context/archive/2026-07-28-report-design-refresh/plan.md:875-905` — the recorded
  decision to skip the year-end fidelity capture, itself flagged as "a second
  deliberate reading of the guardrail by purpose rather than letter, and it is weaker
  than the first."
- **No prior research answers "what makes the pdfmake builder throw."** The closest is
  a hypothesis in `pdf-fidelity-baseline/plan.md:30` about malformed `colSpan` counts.
  This is genuinely new ground.

## Related Research

- `context/changes/pdf-fidelity-baseline/` — `plan-brief.md`, `plan.md`,
  `reviews/impl-review.md`. The origin of every harness file this phase will touch.
- `context/archive/2026-07-28-report-design-refresh/plan.md` — the year-end table
  conversion and the skipped capture; feeds §3 Phase 4, not this phase.

## Open Questions

These are **oracle gaps** — places where the PRD and roadmap do not answer a question
a test author must answer. Per the oracle rule, a test that guesses here asserts an
invented requirement. Flagging them now so `/10x-plan` can decide which need a
decision from the user before any assertion is written.

1. **Is an unfilled field a crash to fix, or a state to validate away?** The two
   confirmed throws have two legitimate remedies — make the builder null-safe, or add
   the missing validators and submit gate. These produce completely different tests.
   Phase 1's stated goal ("never fails to produce a file for input they could
   legitimately enter") leans toward null-safety, but §7 freezes the three
   non-templated forms behind a preservation guardrail, and year-end is one of them.
   **This is the decision most likely to block planning.**
2. **Does the preservation guardrail permit fixing these crashes at all?** FR-015
   preserves year-end's "fields, validation, layout, and PDF output... untouched."
   Adding a validator changes validation. Adding a null guard changes the PDF for the
   crashing input — from nothing at all to a document. A reasonable reading is that a
   crash cannot be the behaviour being preserved, but the guardrail does not say so,
   and `src/CLAUDE.md:7` is emphatic about not modifying builders.
3. **What should an empty year-end detail table render?** All seven rows deleted is
   the teacher explicitly asking for no rows. An empty table, a suppressed section,
   and a placeholder row are all defensible. No source states which.
4. **Per-field optionality is undocumented.** The PRD names exactly one required field
   across all four forms — `sex` on the trimester/semester form (`prd.md:115`). Any
   assertion that some other field is or isn't required has no basis in the sources.
5. **Free-text length limits: total silence.** No PRD or roadmap text sets any bound.
   The "long free text" input class named in Risk #1 has no documented expectation to
   test against.
6. **Non-ASCII names: total silence**, despite a Polish-language school tool whose own
   PRD example name is `Jaś`. The "non-ASCII name" input class named in Risk #1 is
   likewise undocumented — and this one has a real technical failure mode (pdfmake
   font glyph coverage) that nothing has ever tested.
7. **Is `"null"` in a PDF in scope for Phase 1?** It is a defect a parent would see,
   but it is not "no PDF appears" — the file is produced. It arguably belongs to
   Risk #2 (wrong content reaches a parent). Recommend deciding this explicitly in
   `/10x-plan` rather than letting it drift into scope.
8. **Should the F2 fixture-shrink hole be closed here?** `FormArray.patchValue`
   silently truncating the maximal fixtures is a live, recorded, unclosed hole in the
   harness this phase builds on. It is small and adjacent — but it is Phase 1 scope
   creep unless the plan names it.
