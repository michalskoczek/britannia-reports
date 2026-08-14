---
change_id: testing-pdf-input-space
title: PDF generation survives the real input space
status: implemented
created: 2026-08-11
updated: 2026-08-14
archived_at: null
---

## Notes

§3 Phase 1 of `context/foundation/test-plan.md`. Covers Risk #1.

Goal (from the rollout table): prove a teacher's report never fails to produce
a file for input they could legitimately enter. Test types: unit, component.

Scope decisions taken at the start of `/10x-research` (2026-08-11):

- **All four report types** are in scope — Cambridge, semester/trimester,
  Teddy Eddie, year-end. Risk #1's Source column names hot-spots in both
  `src/app/semestr-report/` and `src/app/year-report/`, and "no PDF appears"
  is a whole-product failure. §7's exclusion of the three non-templated report
  types covers ongoing *feature* coverage, not generation robustness.
- **The failure-UX half of Risk #1 is out of scope.** Risk #1 has two halves:
  the builder throws, and the teacher gets no signal. This change researches
  and tests only the first. Surfacing a user-visible error is a separate
  change if the team wants one.

What §2's Risk Response Guidance requires this research to ground:

- which form states are legitimately reachable (validators vs. defaults vs.
  never-bound arrays),
- what the PDF builder consumes vs. what the form holds.

Anti-pattern the guidance names explicitly: asserting the document definition
equals a snapshot of itself. Assert that a document was produced and its
content-carrying regions are non-empty *for that input*, not that bytes match
a copy of the output.

## Decisions after research (2026-08-13)

Resolving the oracle gaps `research.md` left open, so `/10x-plan` does not
re-litigate them.

**Open Question #1 + #2 — remedy is null-safety in the builder, not new
validators.** The two confirmed throws (`year-report.component.ts:409` and the
empty `getBodyInSkills` body) get guarded; no `Validators.required` is added and
no submit gate is introduced on the year-end form.

Rationale: a crash cannot plausibly be the behaviour FR-015's preservation
guardrail was written to preserve. Adding a validator would change what a
teacher is allowed to enter — a deeper intervention than a guard that turns
"no file at all" into "a file". `src/CLAUDE.md`'s rule against modifying PDF
builders stands, and this is the "task explicitly requires it" case it names,
so the change carries a before/after fidelity check per
`docs/pdf-fidelity-check.md`.

> **Superseded 2026-08-14 during implementation.** The fidelity check was **not**
> run. `/10x-plan` replaced it with a per-guard invariant — *the guard changes
> behaviour only in states that throw today* — which makes every
> previously-renderable state byte-identical by construction, so there is nothing
> for a comparison to find. This also keeps Risk #6's untrustworthy year-end
> baseline out of the argument. The reasoning and its limits are recorded in
> `context/foundation/test-plan.md` §6.6, and `src/CLAUDE.md` §Hard rules now
> points there. It is available only to changes narrow enough that the invariant
> is checkable by reading the guard.

**Open Question #7 — the `"null"` / `"undefined"` string leakage (research §C)
is OUT of Phase 1 scope.** A file *is* produced there, so it is Risk #2 (wrong
content reaches a parent), not Risk #1 ("no PDF appears"). Record it for Risk #2
rather than letting it drift in here. `addSpaceAfterTeacher` is the one to carry
forward: it is unguarded in three of the four reports and no submit gate
mitigates it, because `teachers` has no validator anywhere.

**Open Question #3 stays open, and Phase 1 does not need it closed.** What an
emptied year-end detail table should render (empty table / suppressed section /
placeholder row) has no source. The Phase 1 oracle asserts only that a PDF is
produced, which holds under all three — so the test does not pin the choice the
implementation makes. Do not let it become an assertion.

**Still unresolved, for `/10x-plan` to route:** #5 (free-text length limits) and
#6 (non-ASCII names) have no documentary basis for any expectation; #8 (the F2
`FormArray.patchValue` fixture-shrink hole) is adjacent but is scope creep unless
the plan names it deliberately.

## Handed to Risk #2 (2026-08-14)

Phase 1 deliberately left these alone. They are not "no PDF appears" — a file
*is* produced in every case — so they belong to Risk #2, *wrong content reaches a
parent*. Recording them here so §3 Phase 2 inherits the list rather than
rediscovering it. Line numbers are as of `a332d4f`; re-verify before acting.

| Site | Expression | What a parent sees |
|---|---|---|
| `semestr-report.component.ts:689`, `cambridge-report.component.ts:286`, `year-report.component.ts:416` | `addSpaceAfterTeacher(form.value.teachers)`, guarded only by `if (!teachers) return;` | The guard returns `undefined`, which the template literal stringifies — literal `"undefined"` in the "Lektor" cell of **three of the four reports**. This is the sharpest instance: `teachers` carries no validator anywhere, so no submit gate mitigates it on the two gated forms either. |
| `year-report.component.ts:690,703,716,729,742` | `` `${formValue.certificationPurposeOnThisYear}` `` and four siblings | Literal `"null"` per unfilled row. A freshly opened year-end form yields **up to five at once** — the two rows above them (`eofEvaluation:665`, `frequency:677`) use a `? : '-'` fallback and these five do not, which is the inconsistency to fix rather than the individual sites. |
| `cambridge-report.component.ts:282` (`class`), `:289` (`course`) | `` `${form.value.class ? form.value.class : undefined}` `` | Literal `"undefined"` — the ternary actively produces it rather than failing to guard. |
| `semestr-report.component.ts:623-625,731,758` | `changeXToStudentName(textValue, form.value.name)` | `name` is optional and distinct from the required `studentName`, so a blank `name` splices `"null"` into the six descriptive-mark sentences. Note Phase 5's `semestr-non-ascii-name` fixture sets `name`, so it does not cover this. |

Two notes for whoever picks this up:

- **The Phase 1 edge fixtures already reach every one of these states** and pass,
  because the Risk #1 assertion is only "a PDF is produced". Sharpening the
  assertion on the existing fixtures is likely cheaper than new ones.
- Also still open and untouched: the dead branches at
  `year-report.component.ts:348-365`, which test `certificationPurposeYES` /
  `certificationPurposeNO` — controls `createForm` never declares.
