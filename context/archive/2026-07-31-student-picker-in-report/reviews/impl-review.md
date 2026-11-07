<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Student Picker in the Trimester/Semester Report

- **Plan**: `context/changes/student-picker-in-report/plan.md`
- **Scope**: Full plan — Phases 1–6 of 6
- **Date**: 2026-08-04
- **Verdict**: NEEDS ATTENTION → **triaged 2026-08-04**: 5 fixed, 2 skipped, 1 recorded as a recurring rule
- **Findings**: 0 critical, 3 warnings, 4 observations

> **Post-triage note.** All three warnings are fixed and both code fixes carry a regression spec that
> was verified to fail without its fix. F5 was fixed beyond the finding's minimum (behaviour changed,
> not just the comment). F4 and F6 were consciously skipped. The suite is 232/232 (was 230 — the two
> new regression specs), lint clean, both builds green. The fixes are **not yet deployed**: production
> still runs the `9982a38` release reviewed here.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | WARNING |

## Automated verification (re-run during this review)

| Check | Result |
|---|---|
| `npm test -- --watch=false --browsers=ChromeHeadless` | 230/230 SUCCESS |
| `npm run lint` | All files pass linting |
| `npm run build` | Bundle generated (pre-existing budget/CommonJS warnings only) |
| `npm run build -- --configuration development` | Bundle generated |
| `npm run test:rules` | 36/36 pass |
| i18n key parity `pl.json` / `en.json` | 0 keys present in only one bundle |

## Findings

### F1 — Enter inside the quick-add selects creates a half-filled student

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (reliability / data-safety)
- **Location**: src/app/students/student-picker/student-picker.component.html:62
- **Detail**: `(keydown.enter)="onQuickAddEnter($event)"` is bound to the whole `<app-student-form>` element, not to the two text fields. `StudentFormComponent` also renders two `app-select`s (`sex`, `class`), each wrapping a `mat-select` (`select.component.html:3`). Angular Material's closed-select ENTER handler calls `preventDefault()` but not `stopPropagation()`, so the keydown bubbles into this handler. A teacher who has filled `studentName` and `sex`, tabs to the optional `class` select and presses Enter to open the dropdown, silently creates the student with `class: null` and applies that identity to the report while the dropdown opens on top. The component's own doc comment at `:304-309` says "an unhandled Enter in either quick-add **text field**" — the intent was the text fields; the binding is on the container. The file this was modelled on binds the handler to the single input, not a container (`template-panel.component.html:14`).
- **Fix**: Guard in `onQuickAddEnter` by checking the event target is an `<input>` before submitting, or expose a `submitRequested` output from `StudentFormComponent` bound only to the two `app-input-text` fields.
- **Decision**: FIXED — guarded `onQuickAddEnter` on `event.target instanceof HTMLInputElement`, with the reasoning at the site. Regression spec added ("ignores Enter from the selects, which open their panel on it") and verified to fail without the guard — it reproduced the bug exactly, applying `{ studentName: 'Ola Nowak', name: null, sex: 'female', class: null }`.

### F2 — `submitQuickAdd()` has no re-entry guard, so a double Enter creates two students

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (data-safety)
- **Location**: src/app/students/student-picker/student-picker.component.ts:239
- **Detail**: Both quick-add buttons carry `[disabled]="saving()"` (`student-picker.component.html:75,84`), but the Enter path calls `submitQuickAdd()` directly and bypasses that entirely. The method sets `saving` only at `:252`, after the validation return, and awaits `create()` at `:255` while the field keeps focus — so a second Enter inside that window starts a second `create` for the same values. `TemplatePanelComponent.onNameEnter` is equally unguarded but harmless there, because `TemplatesService` rejects the second write as `name-taken`. `StudentsService` has no uniqueness check by design (`students.service.ts:82`: "There is no uniqueness check — two children may share a name"), so here the second Enter produces a genuine duplicate Firestore document and a second confirmation dialog. The pattern was inherited without the safety net that made it safe.
- **Fix**: Add `if (this.saving()) { return; }` at the top of `submitQuickAdd()`. The same hole exists on `StudentRosterComponent.submit()` via `(ngSubmit)` (pre-existing from S-03) and is worth closing in the same pass.
- **Decision**: FIXED — guard added to `submitQuickAdd()` **and** to `StudentRosterComponent.submit()`, closing the pre-existing S-03 hole in the same pass. Regression spec added ("creates one student when Enter is pressed twice during the round-trip"), driven by a deferred `create` promise, and verified to fail without the guard.

### F3 — The roadmap still says S-04 is not deployed

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: context/foundation/roadmap.md:44, :221, :234
- **Detail**: Phase 5 (documentation) ran before Phase 6 (release), and Phase 6's contract contains no documentation step — so the release left three statements contradicting reality. `:221` reads "Not yet deployed: the merge into `10xdevs` and the hosting release are this slice's Phase 6"; `:234` reads "**the hosting release is its own Phase 6 and has not run yet.**"; `:44`'s At-a-glance status cell reads bare `done` where every other released slice reads `done, **deployed YYYY-MM-DD**` (`:39-43`). Phase 5's own Progress item 5.8 — "`src/CLAUDE.md`, the roadmap, and the PRD agree with what shipped" — is checked `[x]` and was true when checked, but no longer holds. This is the recorded lesson "Updating a document includes the sections the new content contradicts" (`context/foundation/lessons.md`) reappearing one phase later than the phase that owns it.
- **Fix**: Update all three to record the 2026-08-04 hosting deploy, matching the S-03 wording at `:200`.
- **Decision**: FIXED + ACCEPTED-AS-RULE — all three roadmap spots now record the 2026-08-04 hosting deploy, the fast-forward, the rules regression check and the post-deploy verification. Recorded in `context/foundation/lessons.md` as "The release phase ships after the documentation phase, so it owns a documentation step of its own".

### F4 — Unplanned layout commit `89aaa48` has no counterpart in the plan

- **Severity**: 📝 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Scope Discipline
- **Location**: src/app/semestr-report/semestr-report.component.html, .scss (commit 89aaa48)
- **Detail**: One commit in the range lays the trimester/semester form's sections out in columns. The plan never mentions layout in any phase, and no `## Progress` row exists that this commit could hang off — the audit trail is roadmap prose only. Verified harmless against the hard guardrail: the commit touches exactly two files and zero `.ts`, the semantic delta is 14 tokens (three wrapper `<div>`s, two extra classes on existing `<section>`s, `class="radio-stack"` on two existing `mat-radio-group`s), the set of `formControlName` attributes before and after is identical, and the SCSS is pure addition consuming the published `form-col` mixin. The pdfmake document definition lives in the `.ts` and was not opened. All eight fidelity fixtures re-captured byte-identical apart from `/CreationDate` and the trailer `/ID`. The plan's "What We're NOT Doing" neither covers nor forbids it — it forbids a *pdfmake document-definition change*, which this is not. The author self-disclosed it in `roadmap.md:220` under "**Extra beyond the plan**" with the evidence. What keeps it on the list: it is a user-visible redesign of a production form shipped inside a slice whose plan is silent on layout, so the on-screen manual checks in Phases 2–5 were verified against a layout that arrived mid-slice rather than one the plan described.
- **Fix**: None required — the disclosure is already in the roadmap. Optionally add a Progress row or a plan addendum so the commit is reachable from the plan rather than only from the roadmap.
- **Decision**: SKIPPED — the roadmap disclosure at `:220` already carries the commit hash and the fidelity evidence. No plan addendum added.

### F5 — The recorded justification for loading on every mount does not hold

- **Severity**: 📝 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architecture (performance)
- **Location**: src/app/students/student-picker/student-picker.component.ts:181
- **Detail**: `ngOnInit` calls `void this.reload()` unconditionally, deliberately skipping the `hasFreshRoster()` branch `StudentRosterComponent.ngOnInit` uses (`student-roster.component.ts:141-145`). This was a recorded decision and the plan books it under Open Risks with a named two-line mitigation, so it is not drift. But the stated justification — a teacher who just added a student at `/students` must see them on return — does not survive inspection: `StudentsService` is `providedIn: 'root'`, its cache outlives the route change, and `create`/`update`/`remove` each write the cache (`students.service.ts:179`, `:223`, `:245`), so `hasFreshRoster()` would already return `true` for that exact scenario. `ShellComponent` mounts the report through `NgComponentOutlet`, which destroys and re-creates it on every tab switch, so the real cost is one N-document collection read per visit to the trimester/semester tab, on top of the templates read. What the unconditional reload actually buys is cross-device / cross-tab freshness — a narrower benefit than the one recorded.
- **Fix**: Either adopt the roster's `hasFreshRoster()` guard (the retry button remains the explicit refresh; `student-picker.component.spec.ts:241-252` pins the current behaviour and would need inverting), or leave the behaviour and correct the recorded justification to name cross-device freshness as the real reason.
- **Decision**: FIXED — adopted the `hasFreshRoster()` guard, so the picker now costs zero reads on a remount when the roster is already cached. The doc comment was rewritten to record why the original justification did not hold and what is genuinely given up (cross-device / cross-tab freshness, with retry as the explicit refresh). The spec that pinned load-on-every-mount was inverted to assert the cache is reused. The plan's Open Risks entry still describes the original decision, which is correct as a record of what was planned; the roadmap never recorded this call, so nothing there contradicts the change.

### F6 — The PDF fixtures are safe by key order, not by construction

- **Severity**: 📝 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/app/shared/testing/pdf-fidelity/semestr-report.fixture.ts
- **Detail**: The sex remap is a new writer of `PER_STUDENT_FIELDS` values, i.e. of pdfmake inputs. The byte-identical capture recorded in the plan holds for a reason narrower than it looks: both fixtures list `sex` before the six mark keys, and each `it` builds a fresh component so `wasMale` starts `false`. In `semestr-minimal`, `sex: MALE` flips the guard while all six mark controls are still `null` (`counterpartValue` returns `null` untouched); in `semestr-maximal`, `sex: FEMALE` matches `wasMale === false` and the remap returns early. A future fixture that patches marks *before* `sex`, or reuses one component across two fixtures, would silently rewrite mark sentences and move the captured PDF. Separately verified as sound: `counterpartValue` round-trips male→female→male exactly across all 24 entries of the six live lists, with no `value`/`valueFemale` string mapping to two entries.
- **Fix**: Add a line to `docs/pdf-fidelity-check.md` noting that trimester/semester fixtures must patch `sex` before the descriptive marks, and why.
- **Decision**: SKIPPED — concerns a fixture nobody has written yet. `counterpartValue` itself was verified sound (exact round-trip across all 24 entries of the six live lists), so the risk is confined to a future fixture author.

### F7 — New layout idiom undocumented, and one stale line citation

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/app/semestr-report/semestr-report.component.scss; src/CLAUDE.md
- **Detail**: Two small consequences of `89aaa48`. First, it introduces a section-level row/column idiom (`.section-row`, `--thirds`, `--halves`, `--grades`, `.radio-stack`) entirely inside one component's SCSS without touching `docs/design-language.md`, which `src/CLAUDE.md:126` names as "the authority on both" halves of the style layer. It correctly consumes the published `form-row`/`form-col` mixins underneath and keeping it local avoids style leakage, so this is defensible as a one-off — but a second report form wanting the same layout will copy rather than reuse. Second, `src/CLAUDE.md` still cites `semestr-report.component.scss:66` for the deliberately-retained root `::ng-deep .mat-mdc-row` rule; after the 67-line SCSS insertion that rule sits at `:133`. The rule itself is intact and the prose identifies it unambiguously.
- **Fix**: Update the `src/CLAUDE.md` line citation to `:133`; optionally promote `.section-row` into `src/assets/styles/patterns/` and record it in `docs/design-language.md` if a second form needs it.
- **Decision**: FIXED — the `src/CLAUDE.md` citation now reads `:133` (`year-report.component.scss:105` was re-checked and is still accurate). `.section-row` is recorded in `docs/design-language.md` §5 "What is deliberately not the language", with the reason it stays component-local at one consumer and the reason `--grades` cannot go through `form-col`. Not promoted to `patterns/`.

## Dimensions confirmed clean

- **Plan Adherence** — all 20 planned items across Phases 1–5 verified MATCH against the actual files, including all six load-bearing claims: `applyStudentIdentity` writes only the four `STUDENT_IDENTITY_FIELDS`; the remap never writes `sex`; it subscribes to the child stream, not the group's; `counterpartValue` matches on both variants and is its own inverse; all four picker buttons pass `[type]="'button'"`; quick-add reloads iff the load had failed. `template-domain.ts` is comment-only — the four sets are byte-identical and the partition spec still guards them.
- **Firestore boundary** — every call goes through `StudentsService`, which returns a closed result union; `FAILURE_KEYS` is a total `Record` so a new failure mode is a compile error. No raw SDK error codes reach the picker.
- **Subscription cleanup** — all four subscriptions in changed components use `takeUntilDestroyed`; one idiom per file, per `src/CLAUDE.md:124`.
- **Re-entrancy** — the remap terminates: `patch` never contains `sex`, and the `isMale === wasMale` guard stops the second pass.
- **Client-side authz** — rules-backed; no new collection or operation, and `StudentsService.students` is additionally uid-gated so an account switch cannot leave another teacher's roster in the select.
- **Signal input stability** — no input is fed a freshly-constructed object per change-detection pass; a spec asserts the property directly.
- **Design tokens** — all three new/changed stylesheets `@use` the token index; no hardcoded hex, breakpoint, radius or shadow.
- **i18n** — 29 keys added to both bundles with identical nesting; no orphans and no missing references, verified in both directions.
