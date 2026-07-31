<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Student Roster (S-03)

- **Plan**: `context/changes/student-roster/plan.md`
- **Scope**: Full plan — Phases 1–5 of 5 (all Progress boxes `[x]`)
- **Date**: 2026-07-31
- **Verdict**: NEEDS ATTENTION → **RESOLVED** after triage on 2026-07-31
- **Findings**: 0 critical, 4 warnings, 6 observations
- **Triage**: 5 fixed (F1, F2, F3, F4, F6), 5 skipped (F5, F7, F8, F9, F10)

## Triage outcome

All four warnings were fixed. Post-fix gates: `npm run lint` clean, **185/185** unit tests
(was 176 — nine specs added by the fixes), both build configurations type-check.
`npm run test:rules` still unrun in this environment (F10); `firestore.rules` was not
touched by any fix.

Changes made during triage:

| Finding | File(s) |
|---|---|
| F1 | `student-roster.component.ts` (conditional reload in `submit()`), `.spec.ts` (+2) |
| F2 | `students.gateway.ts` (`update` takes the document), `students.service.ts`, `students.service.spec.ts` |
| F3 | `student-roster.component.ts` (`busy` computed), `.html`, `.scss` (`--deleting`) |
| F4 | `students.service.ts` (`hasFreshRoster()`), `student-roster.component.ts` (`ngOnInit`), both specs (+6) |
| F6 | `student-roster.component.ts` (reactive clear in constructor), `.spec.ts` (+1) |

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | WARNING |
| Architecture | WARNING |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Verification gates run during this review

| Gate | Result |
|---|---|
| `npm run lint` | PASS — all files pass linting |
| `npm test -- --watch=false --browsers=ChromeHeadless` | PASS — 176/176 |
| `npm run build` | PASS |
| `npm run build -- --configuration development` | PASS |
| `ls dist/browser/index.html` | PASS — present |
| `git branch --show-current` | PASS — `10xdevs` (correct deploy base) |
| i18n key parity | PASS — 338 keys in each bundle, zero asymmetric keys, `students.*` 31/31 |
| `npm run test:rules` | NOT RUN — see F10 |

Security scan found nothing. `firestore.rules:125-129` carries all three gates
(`request.auth != null`, `request.auth.uid == uid`, `isAllowlisted()`), sits above the
`match /{document=**}` catch-all at `:131`, and the diff against the rules file is purely
additive — `allowedUsers`, `reportTemplates` and `isAllowlisted()` are byte-identical.
No XSS vector (interpolation only, no `innerHTML`/`bypassSecurityTrust`), no hardcoded
secrets, no `onSnapshot` listener anywhere. Scope guardrails held: zero `*-report.component.*`
files in the diff, `ConfirmDialogComponent` reused unmodified.

## Findings

### F1 — Load-failure screen hides a student that saved successfully

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/app/students/student-roster/student-roster.component.ts:189`, `student-roster.component.html:78-89`
- **Detail**: The template branches `@if (loading()) … @else if (loadFailureKey()) { failure } @else if (empty) … @else { list }`, so the failure block wins over the list. The add form sits *above* that block and stays live. Reachable sequence: load fails → retry block renders → teacher adds a student → `create()` succeeds and populates the service cache → the screen still reads "no connection" and the new student appears nowhere. `submit()` never reloads on the success path.

  This is the same defect that was found and fixed in the mirrored reference three commits earlier: `8051f86` *"fix(trimester-report-templates): recover the template list after saving while it failed to load"*, itself the outcome of that change's review finding F4 triaged "fix now". `template-panel.component.ts:176-186` now carries the conditional reload **with a 12-line comment explaining exactly this trap** — and `TemplatePanelComponent` is the file the plan names as the UI reference to copy (plan §Current State, §Phase 3.3). The fix existed, was commented, and was not ported.
- **Fix**: Port the conditional reload into `submit()`'s success path — `if (this.loadFailureKey() !== null) { await this.reload(); }` after `resetToAddMode()`. Conditional, not unconditional: the service already appends to its cache, so an unconditional reload spends a Firestore read per save against the Spark budget for nothing.
  - Strength: The exact code and its rationale already exist at `template-panel.component.ts:176-186`; this is a copy, not a design.
  - Tradeoff: None material — one conditional, one extra read only on the already-degraded path.
  - Confidence: HIGH — the sibling fix shipped and is covered by two specs there.
  - Blind spot: The roster has no duplicate-name check, so the second half of the templates rationale (stale checks causing ambiguous `permission-denied`) does not apply here; only the display half does.
- **Decision**: FIXED — conditional reload ported into `submit()`'s success path with the rationale comment; two specs added (list recovers after a failed load; the good path still costs exactly one list call). 178/178 pass.

### F2 — `update()` never writes `schemaVersion`, so it can go stale against the identity it describes

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (data safety)
- **Location**: `src/app/students/students.gateway.ts:102-109`
- **Detail**: `create()` writes `schemaVersion` (`:83`); `update()` writes only `identity` + `updatedAt`. The update replaces the whole identity map (deliberately, per the comment at `:94-100`) using the *current* domain — so a document created under schema 1 and later edited by a client running schema 2 keeps `schemaVersion: 1` while its `identity` holds the schema-2 shape. `schemaVersion` is the only field a future migration can branch on, and after any edit it can describe contents it no longer has.
- **Fix**: Add `schemaVersion: STUDENT_SCHEMA_VERSION` to the `updateDoc` payload.
- **Decision**: FIXED — done symmetrically with `create` rather than by importing the constant into the gateway: `gateway.update` now takes `Omit<StudentDocument, 'createdAt' | 'updatedAt'>` and spreads it, so the version stays a `StudentsService` decision and the gateway keeps making none. Service builds the document; spec asserts the full payload. Lint clean, 178/178 pass.

### F3 — Row actions and submit are not mutually disabled, so an edit started mid-save is silently discarded

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (reliability)
- **Location**: `src/app/students/student-roster/student-roster.component.html:120,129`; `student-roster.component.ts:156-194`
- **Detail**: Row Edit/Delete are disabled on `deletingId() !== null` only; the submit button is disabled on `saving()` only. The two guards do not cross. During an in-flight save the teacher can press Edit on a row — `edit()` sets `editingId` and patches the form — and then the awaited save resolves and `resetToAddMode()` (`:189`) wipes it. The edit the teacher just started reverts to a blank add form with no message. Symmetrically, Delete stays clickable during a save.

  Related, and part of the same fix: the plan's §Phase 3.3 contract says "per-row in-flight state", but `deletingId` is applied globally in the template — every row's buttons disable during any delete and no row shows which one is actually in flight. Functionally safe, weaker than described.

  The change *does* handle the sibling case correctly (a stale `editingId` when the edited row is deleted — `.ts:253`, spec'd at `student-roster.component.spec.ts:415-431`); this is the case it missed.
- **Fix**: Gate the row buttons on `saving() || deletingId() !== null` and the submit button on `deletingId() !== null` as well; optionally narrow the row disable to `deletingId() === student.id` for genuine per-row state.
- **Decision**: FIXED — one `busy` computed (`saving() || deletingId() !== null`) now drives all four buttons, so the form and the rows cannot drift apart again.

  The *disable* was deliberately left list-wide rather than narrowed to `deletingId() === student.id`: `deletingId` holds a single id and the confirm dialog closes before the delete resolves, so a second delete started in that window would overwrite it and the first `finally` would clear the second's flag. Per-row state was delivered as a visual marker instead — `student-roster-item--deleting` on the row whose delete is in flight — which is what the plan's "per-row in-flight state" was for. Lint clean, 178/178 pass.

### F4 — Every Reports↔Students round trip re-reads the whole roster

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality (performance)
- **Location**: `src/app/students/student-roster/student-roster.component.ts:136-138`
- **Detail**: `ngOnInit` calls `reload()` unconditionally — a full-collection `getDocs` — even though `StudentsService` already holds a uid-gated cache (`students.service.ts:56-74`) that survives the component. This was cheap for templates ("single digits", `templates.gateway.ts:52`), but a roster is a class list, and *this change adds the header nav that makes the round trip one click* (`header.component.html:24-39`) while `src/CLAUDE.md` records that leaving the shell destroys the routed component. Each return costs N student reads plus the allowlist `exists()` read, against the deliberately-budgeted Spark 50K/day the plan's §Performance Considerations cites.
- **Fix A ⭐ Recommended**: Skip the load in `ngOnInit` when the service cache is already valid for the current uid; keep the Retry button as the explicit refresh.
  - Strength: The uid-gated cache already encodes exactly the freshness condition needed — this reads it instead of ignoring it. Preserves the one-shot-`getDocs` posture the whole project is built on.
  - Tradeoff: A roster edited in a second tab or on another device goes stale until an explicit refresh. For a single teacher managing their own students that is close to theoretical.
  - Confidence: MEDIUM — the cache guard is proven by `students.service.spec.ts:212-224`, but no spec currently pins mount-count behaviour, so the fix needs its own test.
  - Blind spot: Interacts with F1 — if the conditional reload lands, both paths must agree on what "fresh" means.
- **Fix B**: Accept as-is and record it as a known cost.
  - Strength: Zero risk of showing a teacher stale data; matches the templates panel's behaviour exactly.
  - Tradeoff: Read volume scales with navigation, and `S-04` adds more reasons to bounce between the two surfaces.
  - Confidence: HIGH — current behaviour is correct, just not thrifty.
  - Blind spot: No measurement exists of real roster sizes; "a class list" is an assumption.
- **Decision**: FIXED via Fix A — `StudentsService.hasFreshRoster()` added (uid matches `loadedFor`), and `ngOnInit` skips the load when it returns true. Deliberately keyed on `loadedFor` rather than on the list being non-empty: `loadedFor` is `null` until the first *successful* load, so a teacher with no students yet is recognised as loaded instead of paying a read on every visit — the case that needed the saving most. Retry remains the explicit refresh. Six specs added (four on the service covering first load / empty roster / failed load / account switch, two on the component covering skip and first visit). Lint clean, 184/184 pass.

### F5 — Two file edits landed outside the plan's Changes Required

- **Severity**: 📋 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `src/app/shared/components/UI/tab-group/tab-group.component.ts:50-54` (+ new `tab-group.component.spec.ts`); `context/foundation/infrastructure.md`
- **Detail**: **tab-group** — a 3-line change making `initDefaultActiveTab()` authoritative (`tab.isActive = tab.defaultActive`) instead of additive, plus an 82-line spec that mounts→destroys→re-mounts. It is a genuine bug *caused by this slice*: `TabData.tabs` is a static module-level array, so `isActive` outlives every component instance; before `/students` existed a second mount was unreachable. The fix agrees with `ShellComponent:21`, which independently starts from `defaultActive`. Correct, necessary, and now test-covered where it was not before — but `plan.md` contains zero mentions of tab-group, and the plan was written back for Phase 3 in that same commit without carrying a row for it. Disclosed honestly in the commit message only.

  **infrastructure.md** — the plan said "add `students` wherever collections are listed. **No other edits**." A fourth edit rewrote the security-rules risk-register row (`M (students, unbuilt)` → `L (students)`, MITIGATED). This is exactly the situation `lessons.md`'s first accepted rule covers, so it reads as correct-by-precedent rather than drift — noted for completeness, not for action.
- **Fix**: Add a short addendum row to `plan.md` recording the tab-group fix and why the route made it reachable, so a future reader of the plan sees the same scope the commits do.
- **Decision**: SKIPPED — the commit message for `266de58` already discloses the tab-group fix in full and honestly, and the `infrastructure.md` edit is blessed by the first rule in `lessons.md`. Both edits are correct and necessary; only the paper trail is thinner than the contract implies. Not worth a plan edit after the fact.

### F6 — Validation message persists after the teacher fixes the field

- **Severity**: 📋 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/app/students/student-roster/student-roster.component.ts:121`
- **Detail**: `formFailureKey` is cleared only on the next submit (`:168`, `:198`, `:283`). `TemplatePanelComponent` clears the equivalent signal reactively — `template-panel.component.ts:119-121`, `valueChanges.pipe(takeUntilDestroyed())`. A teacher who fixes an empty name keeps reading "Enter the student's full name" until they press Add again. The divergence is documented at `:121` but not argued.
- **Fix**: Subscribe to `this.form.valueChanges` with `takeUntilDestroyed()` and clear `formFailureKey`, matching `template-panel.component.ts:119-121`.
- **Decision**: FIXED — constructor subscribes to `form.valueChanges` with `takeUntilDestroyed()`. Subscribed to the whole group rather than one control, since any of the four fields can be what the failure was about. Doc comment corrected to "Cleared as soon as it changes"; one spec added. Lint clean, 185/185 pass.

### F7 — `load()` has no in-flight generation token

- **Severity**: 📋 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (reliability)
- **Location**: `src/app/students/students.service.ts:104-127`
- **Detail**: `load()` calls `this.loaded.set(students)` unconditionally on resolve. If a `create()` completes between the `getDocs` being issued and its snapshot resolving, the load's `set` discards the created student. Barely reachable today — `reload()` fires only from `ngOnInit` and Retry, and Retry is unmounted while `loading()` is true. It stops being theoretical if F1's conditional reload lands, which adds a load path that runs *after* a write.
- **Fix**: If F1 is taken, tag each load with a sequence number and ignore a resolve that is no longer the latest.
- **Decision**: SKIPPED — and the reason it stays skippable is worth recording. The F1 fix does *not* widen the window: its reload is `await`ed **after** the write has already resolved, so that write and that load never overlap. Combined with F3's `busy` guard, which now blocks every second write while one is in flight, the only remaining route to an overlap is a load and a write from two different surfaces at once — which does not exist while `/students` is the roster's only mount point. Revisit if `S-04` adds an in-form quick-add that writes students from the report screen.

### F8 — Students depends on Templates for a shared Firestore path constant

- **Severity**: 📋 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architecture
- **Location**: `src/app/students/students.gateway.ts:15`
- **Detail**: `import { USERS_COLLECTION } from '../templates/templates.gateway'` creates a feature-to-feature dependency for a constant that belongs to neither feature — it is the path segment `firestore.rules` keys ownership on. The reasoning at `:36-40` (one copy, no drift) is right and the plan explicitly asked for it; the conclusion is one step short. A neutral module gives the same no-drift guarantee without the edge, and this matters when a third per-teacher collection lands.
- **Fix**: Move `USERS_COLLECTION` to a neutral module (e.g. `src/app/model/firestore-paths.ts`) and have both gateways import it from there.
  - Strength: Removes the only students→templates edge; the constant's real owner is the rules file, not either feature.
  - Tradeoff: Touches a shipped, working file for a structural reason with no behaviour change; three import sites to update.
  - Confidence: MEDIUM — trivially safe mechanically, but it is refactoring outside what this change was scoped to do.
  - Blind spot: Not checked whether `S-04` planning already assumes the current import path.
- **Decision**: SKIPPED — the plan asked for exactly this import and the no-drift guarantee it buys is real. Deferred to the change that adds a third per-teacher collection, which is when the edge starts costing something.

### F9 — Two documented drifts from the plan's written contract

- **Severity**: 📋 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/app/model/student.interface.ts:38`; `src/app/students/student-roster/student-roster.component.scss:1`
- **Detail**: (a) The plan specified `sex: Sex`; the code has `sex: Sex | null`. This resolves an internal contradiction in the plan itself — the same plan mandated `STUDENT_IDENTITY_DEFAULTS: Readonly<StudentIdentity>` with a not-yet-chosen starting state, which non-nullable `sex` makes impossible. Documented in place at `:37`, and `validate()` refuses `null` on write (`students.service.ts:96-98`). The implementation is right and the plan was wrong. (b) The SCSS `@use`s `utils/index` but not the pattern mixins the contract named — justified, since the surface is a `<ul>` and its card comes from `app-form-wrapper`. The inline `14px`/`13px` are not violations: `docs/design-language.md` §2 records that there is deliberately no type scale.
- **Fix**: None needed. Recorded so the plan is not read later as the ground truth on `sex` nullability.
- **Decision**: SKIPPED — no code change warranted; both drifts are correct and documented at their sites. This report is the record.

### F10 — `npm run test:rules` could not be verified in this review

- **Severity**: 📋 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: N/A — environment
- **Detail**: The gate appears in Phases 1, 4 and 5 and is checked `[x]` at `e6dadbb`, `3c67a3e` and `7edad23`. It could not be re-run here: `firebase emulators:exec` failed with *"Could not spawn `java -version`"*, and `java` is not on PATH in this environment. `src/CLAUDE.md` documents the JDK requirement, so this is an environment limitation, not evidence of a failure — but the rules suite is the only gate proving the per-teacher boundary, and it is unverified by this review. Static review of `test/rules/students.test.mjs` confirms all five required scenario families are present, including the four `update` cases, and that it declares its own `projectId` (`'britannia-reports-students'`, `:41`) per the `lessons.md` rule, with `report-templates.test.mjs` left on `'britannia-reports'` and unmodified.
- **Fix**: Re-run `npm run test:rules` in a shell with a JDK on PATH to close the gate.
- **Decision**: SKIPPED — the gate was green at each of the three phases that carry it, and `firestore.rules` was not touched by this review's fixes. Worth knowing anyway: F2 changed the update payload (`schemaVersion` now travels with `identity`), which the rules do not validate by design — the deliberate no-shape-validation decision recorded at `firestore.rules:117-124` is what makes that a non-event.
