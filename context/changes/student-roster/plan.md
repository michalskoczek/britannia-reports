# Student Roster (S-03) Implementation Plan

## Overview

Give each teacher a private roster of their own students — add, list, edit, delete (FR-005…FR-008) — persisted at `users/{uid}/students/{studentId}` and reachable at a new `/students` route behind `authGuard`.

This is the second per-teacher Firestore collection in the app. `S-02` built the seam it copies (`gateway` → `service` → component), the emulator suite, and the `npm run test:rules` harness, so this slice owns *using* them rather than building them. It is also the first collection in the project that is **mutable**: `reportTemplates` is write-once (`allow update: if false`), and FR-007 requires a real `update` rule plus the rules tests that prove it is not over-permissive.

## Current State Analysis

**What exists and is directly reusable:**

- `src/app/templates/templates.gateway.ts` — every `@angular/fire/firestore` call for templates, no decisions, one-shot `getDocs` (never `onSnapshot`; Spark's 50K reads/day is the recorded reason), all calls wrapped in `runInInjectionContext`. Exports `USERS_COLLECTION = 'users'`, the path segment `firestore.rules` keys ownership on.
- `src/app/templates/templates.service.ts` — every decision: validation, a closed `TemplatesFailure` union, outcomes **returned not thrown**, a signal cache gated on the uid it was loaded for, Firebase error codes classified (`permission-denied` / `unavailable`) instead of leaked, and tolerant document reads (missing key → default, unknown key → dropped).
- `src/app/templates/confirm-dialog/confirm-dialog.component.ts` — generic confirm/cancel prompt taking translate keys, with a comment stating it was kept content-free **so `S-03` can reuse it for "remove a student" without touching the file**. Closes `true` on confirm, `undefined` on escape/backdrop; callers must normalize.
- `src/app/templates/template-panel/template-panel.component.ts` — the UI reference: `MatSnackBar` for outcomes, inline retry for a failed load, per-row in-flight state, a total `Record<Failure, translateKey>` map so a new failure member fails to compile rather than reaching a teacher as "something went wrong".
- `test/rules/report-templates.test.mjs` — the rules-test reference. `npm run test:rules` runs `node --test test/rules`, i.e. **the whole directory**, so a new `.mjs` file there is picked up with no config change.
- Shared form wrappers `app-input-text`, `app-select`, `app-form-wrapper`, `app-button`; `src/app/shared/select-values.ts` (`sexes`, `classes`); `src/app/shared/testing/translate-testing.ts`.

**What is missing:** any `students` collection, rule, model, gateway, service, or surface. No navigation entry point other than the tab registry.

**Constraints discovered:**

- `firestore.rules` has no rule for `students`; the catch-all `match /{document=**} { allow read, write: if false; }` denies it today. The file's header comment enumerates open collections and would go stale — `context/foundation/lessons.md` makes that section in-scope for the same change.
- `app.routes.ts` is `sign-in` / `''` (shell) / `**` → `''`. A third route must be declared **before** the wildcard.
- The header lives in `AppComponent` above the `<router-outlet>` and renders on the sign-in screen too; anything roster-related added there must be gated on the same `email()` signal the sign-out button uses.
- `SessionService.state()` is the only source of session truth; `state.status === 'authorized'` carries `uid` and `email`.

### Key Discoveries:

- **The student-identity domain is already declared, and it has four members, not two.** `src/app/templates/template-domain.ts:74` — `STUDENT_IDENTITY_FIELDS = ['studentName', 'name', 'sex', 'class']`. `studentName` is the full name (`Validators.required`), `name` is the display first name substituted into PDF prose (`semestr-report.component.ts:585`, label "Imię ucznia do wyświetlenia w tekście (np. Jaś)"), `sex` is required and selects the gendered wording `Uczeń`/`Uczennica` in the PDF, `class` is the school grade.
- **`class` on the report form is a closed select, not free text.** `semestr-report.component.html:67` binds `app-select` over `classes` from `src/app/shared/select-values.ts:5` — thirteen fixed values such as `"Klasa 5 szkoły podstawowej"`. FR-005's wording ("free-text class label") does not survive contact with that control: a free-text label pre-filled by `S-04` would be a value outside the option list.
- **`app-select` normalizes a `string[]` into `{label, value}` and renders the label through the translate pipe** (`select.component.ts:39`). `sexes = [Sex.MALE, Sex.FEMALE]` therefore renders via the existing `"male"` / `"female"` keys already present in both i18n bundles.
- **Rules deny writes with `evaluation error at L90` rather than a plain `false`** once `isAllowlisted()` is in the expression — a documented emulator artefact, not a failure (`firestore.rules:150`).
- **`npm run build` type-checks only `environment.prod.ts`.** Checking the dev file needs `npm run build -- --configuration development`. Both are in the phase gates below.

## Desired End State

A signed-in, allowlisted teacher opens **Uczniowie / Students** from the header, sees their own students sorted by name, adds one by filling full name + display name + sex + class, edits any of the four fields in place, and deletes one behind a confirmation dialog. Another teacher signed into the same deployment sees a different, disjoint list — and cannot read, write, or delete into the first teacher's subtree even with a hand-crafted request, which `npm run test:rules` proves rather than asserts.

Verification: `npm run test:rules` green (including the new update scenarios), `npm test` green headless, `npm run lint` clean, both build configurations type-check, and a manual two-account walkthrough against the emulators.

## What We're NOT Doing

- **No student picker in the report form.** `S-04` owns FR-013. This slice ships no change to any `*-report.component.*` file — which is also why the PDF-fidelity guardrail is not engaged (see below).
- **No GDPR work beyond data minimization.** Export on request, retention windows, consent language stay open, owned by the school director — roadmap Open Question #1 / PRD Open Question #2. FR-008 remains the only deletion path.
- **No search, filter, or grouping on the list.** Client-side sort by name, one-shot `getDocs`. Student counts per teacher are small, like templates.
- **No CSV import/export or bulk entry.** Not in any FR.
- **No class entity or class CRUD.** PRD Non-Goals; `class` stays a value on the student.
- **No duplicate-name detection.** Two students may legitimately share a name; auto-ids make that representable and nothing needs to prevent it.
- **No director-specific behaviour.** The role scaffold stays as `S-01` left it.
- **No shape validation inside `firestore.rules`.** Deliberate — see Phase 1.
- **No preservation of report-form state across navigation.** See the Critical Implementation Details note.

## Implementation Approach

Four decisions shape everything below; all four were made during planning on 2026-07-31.

1. **The stored record carries all four identity fields, not the two FR-005 names.** `sex` is `Validators.required` on the report form and drives gendered PDF wording; a roster that omitted it would leave `S-04`'s picker filling two of four fields and the teacher re-picking sex for every single report — the retyping this whole change exists to remove. This is a deliberate widening of PRD §Non-Goals ("students have a name and a free-text class label") and is recorded as such, not slipped in.
2. **`class` in the roster is the same closed select as the report form**, sourced from the same `classes` constant. This trades the letter of FR-005 for a working `S-04` prefill; storing free text would push a value-mapping problem into the next slice.
3. **Document ids are Firestore auto-ids.** Unlike templates — where the id *is* the normalized name and that is what enforces uniqueness — a student's name is mutable (FR-007) and non-unique. Name-as-id would make a rename a non-atomic delete + create. The name is an ordinary field.
4. **The roster is a route, not a tab.** `src/CLAUDE.md` states the split the router already encodes: the router decides *whether you are in the app*, the tab registry decides *which report you are looking at*. A roster is neither a report nor a tab; `/students` behind `authGuard` keeps that boundary intact.

Layering mirrors `S-02` exactly: rules and their tests land **before** the code above them (the order `S-02` established and `S-01` did not follow), then the data layer with a unit-tested service over a Firebase-free seam, then one component, then verification, then release.

## Critical Implementation Details

**Navigating to `/students` destroys unsaved report-form state, and that is a consequence of the route decision, not a bug to fix here.** `ShellComponent` is a routed component; leaving it and coming back re-instantiates it, `TabData.tabs` resets to its `defaultActive` entry (Teddy Eddie), and any half-filled trimester/semester form is gone. For `S-03` this is tolerable — managing a roster is a task a teacher does *before* writing reports, not during. It stops being tolerable in `S-04`, where "this student isn't in my roster yet" arrives mid-report; that slice will need either an in-form quick-add or preserved form state. Record it, do not solve it here.

**Entering edit mode must bring the form into view.** The form sits above the list, so pressing Edit on a row far down the page appears to do nothing. On entering edit mode, scroll the form into view (`block: 'nearest'`) and focus the first field. This is the one place the UI has a requirement not derivable from the FRs.

**The PDF-fidelity guardrail is not engaged by this slice, and the way to keep it that way is to touch no report component.** No file under `src/app/*-report/` and no `pdfmake` document definition is in scope. If an edit to one appears necessary, stop — it means the roster has started doing `S-04`'s job.

---

## Phase 1: Store contract — rule and rules tests

### Overview

Open `users/{uid}/students/{studentId}` to its owner and prove the boundary with tests, before any client code can reach it. This is the first `update` in the project's rules.

### Changes Required:

#### 1. Firestore rules

**File**: `firestore.rules`

**Intent**: Add one rule granting `read, create, update, delete` on `users/{uid}/students/{studentId}` to a caller whose `request.auth.uid` equals the path segment *and* who is on the allowlist — the shape the file's own closing comment prints as the template to copy. Record why `update` is allowed here when it is denied one rule above (templates are write-once by PRD §Non-Goals; students are editable by FR-007), and why document-shape validation is deliberately absent: rules that restate a schema drift from it silently, which is the exact failure `context/foundation/infrastructure.md` documents, and the ownership boundary is what actually protects one teacher's data from another.

**Contract**:

```
match /users/{uid}/students/{studentId} {
  allow read, create, update, delete: if request.auth != null
                                      && request.auth.uid == uid
                                      && isAllowlisted();
}
```

Placed above the `match /{document=**}` catch-all. `isAllowlisted()` is reused unchanged.

#### 2. Rules header comment

**File**: `firestore.rules`

**Intent**: The header enumerates open collections and would otherwise describe a rules file that no longer exists; `context/foundation/lessons.md` makes that section in-scope for this change.

**Contract**: Add `users/{uid}/students/{studentId} — S-03` to the "Open collections" list, noting it is the first mutable collection. Extend the harness-coverage list at the bottom of the file with the new scenarios.

#### 3. Rules tests

**File**: `test/rules/students.test.mjs`

**Intent**: Mirror `report-templates.test.mjs` scenario-for-scenario, plus the cases only a mutable collection has. Same helper shape (`teacher(uid, email, emailVerified)` building a context that carries **both** `email` and `email_verified` claims — a context without them tests a caller that cannot exist), same `seedAllowlist` via `withSecurityRulesDisabled`, same `clearFirestore` in `afterEach`.

**Contract**: Scenarios asserted —

- owner: create, read, **update**, delete their own student; recognised whatever case the address is signed in with
- another *allowlisted* teacher: denied read, create, update, delete against teacher A's student (allowlisted on purpose, so the assertion is about ownership and not the allowlist)
- a signed-in account not on the allowlist: denied all four **under its own uid**, including when the allowlist holds some other address
- an allowlisted address with `email_verified: false`: denied
- an unauthenticated caller: denied all four

No config change is needed anywhere — `npm run test:rules` runs the whole `test/rules` directory, and the file sits outside `src/` so Karma, `tsconfig.spec.json` and ESLint all ignore it.

### Success Criteria:

#### Automated Verification:

- Rules tests pass: `npm run test:rules`
- The new suite fails when the rule is temporarily narrowed (verify by removing `update` from the rule and re-running — the owner-update test must fail, then restore)

#### Manual Verification:

- The `evaluation error at L…` lines the emulator logs on denied writes are the known `isAllowlisted()` artefact, not a new failure — every assertion still reports the expected outcome

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding.

---

## Phase 2: Data layer — model, gateway, service

### Overview

Everything between Firestore and the UI, with the SDK confined to one file so the decisions above it can be unit-tested against a fake.

### Changes Required:

#### 1. Student model

**File**: `src/app/model/student.interface.ts`

**Intent**: Declare the stored shape and the app-facing shape. Types only, per the folder convention. The identity object's keys are exactly the four members of `STUDENT_IDENTITY_FIELDS`, so `S-04`'s picker can emit it into the report form without a mapping layer — the same way `ReportTemplateFields` is the payload `TemplatePanelComponent` emits.

**Contract**:

- `StudentIdentity` — `{ studentName: string; name: string | null; sex: Sex; class: string | null }`. `sex` is the existing `Sex` enum from `src/app/shared/enum/sex.enum.ts`; `class` holds one of `classes[].value`.
- `Student` — `{ id: string; identity: StudentIdentity; createdAt: Date | null }`
- `StudentDraft` — `{ identity: StudentIdentity }`
- `StudentDocument` — `{ schemaVersion: number; identity: StudentIdentity; createdAt: unknown; updatedAt: unknown }`

Document a `schemaVersion` of `1` with the same meaning it carries for templates: widening the identity set does not bump it, because reads treat an absent key as that key's default.

#### 2. Identity domain constant

**File**: `src/app/students/student-domain.ts`

**Intent**: One place declares the roster's four field names and their defaults, mirroring `template-domain.ts`. Data only, no Angular imports.

**Contract**: `STUDENT_SCHEMA_VERSION = 1`; `STUDENT_IDENTITY_DOMAIN` as a `readonly (keyof StudentIdentity)[]`; `STUDENT_IDENTITY_DEFAULTS: Readonly<StudentIdentity>`. Iterate the domain rather than hand-listing keys anywhere that reads or writes a document.

#### 3. Domain-agreement spec

**File**: `src/app/students/student-domain.spec.ts`

**Intent**: Machine-check the `S-04` seam. The roster's domain and the report form's `STUDENT_IDENTITY_FIELDS` must name the same four controls; if either side drifts, the picker silently stops filling a field.

**Contract**: Assert `[...STUDENT_IDENTITY_DOMAIN].sort()` deep-equals `[...STUDENT_IDENTITY_FIELDS].sort()` (imported from `../templates/template-domain`), and that `Object.keys(STUDENT_IDENTITY_DEFAULTS)` covers the domain exactly.

#### 4. Gateway

**File**: `src/app/students/students.gateway.ts`

**Intent**: Every `@angular/fire/firestore` call for students, and nothing else — no validation, no error mapping, no interpretation. Rejections propagate untouched so the service can tell `permission-denied` from `unavailable`.

**Contract**:

- `STUDENTS_COLLECTION = 'students'`, documented as a contract shared with `firestore.rules`. `USERS_COLLECTION` is imported from `../templates/templates.gateway` rather than re-declared — one source of truth for the path segment ownership is keyed on.
- `StoredStudent` — `{ id: string; data: DocumentData }`
- `list(uid): Promise<StoredStudent[]>` — one-shot `getDocs`, unordered (an `orderBy` would silently omit documents missing the field); the service sorts.
- `create(uid, document: Omit<StudentDocument, 'createdAt' | 'updatedAt'>): Promise<string>` — `addDoc`, `serverTimestamp()` for both stamps, returns the generated id.
- `update(uid, studentId, identity: StudentIdentity): Promise<void>` — `updateDoc` writing the identity object plus `updatedAt`.
- `remove(uid, studentId): Promise<void>` — `deleteDoc`.

Every call wrapped in `runInInjectionContext(this.injector, …)`, as the templates gateway does.

#### 5. Service

**File**: `src/app/students/students.service.ts`

**Intent**: Every decision about students — validation, the cached list, tolerant reads, error classification — with the Firebase SDK unreachable from this file.

**Contract**:

- `StudentsFailure` — closed union: `'not-signed-in' | 'name-required' | 'name-too-long' | 'sex-required' | 'permission-denied' | 'offline' | 'unknown'`
- `StudentsResult<T>` — `{ ok: true; value: T } | { ok: false; failure: StudentsFailure }`; outcomes returned, never thrown
- `STUDENT_NAME_MAX_LENGTH = 80`
- `students: Signal<readonly Student[]>` — computed, returns `[]` unless the cached list was loaded for the currently authorized uid (the same guard templates use; a list surviving an account switch is a correctness bug, not a display bug)
- `validate(identity): StudentsFailure | null` — `studentName` non-empty after trim and within the length cap, `sex` present. `name` and `class` are optional.
- `load(): Promise<StudentsResult<readonly Student[]>>` — replaces the cache on success, leaves it untouched on failure
- `create(draft): Promise<StudentsResult<Student>>` — validates, writes, appends to the cache, re-sorts
- `update(id, draft): Promise<StudentsResult<Student>>` — validates, writes, replaces the entry in the cache, re-sorts
- `remove(id): Promise<StudentsResult<void>>` — writes, drops the entry from the cache
- Sort by `studentName` with `localeCompare(…, 'pl')`
- Tolerant document reads: absent key → default, unknown key → dropped; `createdAt` converted by duck-typing `toDate` rather than importing the SDK's `Timestamp`
- Error classification by the trailing segment of `error.code` (`permission-denied` arrives bare or namespaced depending on the layer that raised it)

#### 6. Service spec

**File**: `src/app/students/students.service.spec.ts`

**Intent**: Drive the service against a fake gateway. `src/CLAUDE.md` records that `S-01` shipped three defects past a green suite because its fakes were more agreeable than Firebase — so the fake here rejects the way Firestore does.

**Contract**: Covers — validation rejects a blank and an over-long name and a missing sex; `load` populates the signal and a failed `load` leaves the previous list intact; `create` appends and keeps sort order; `update` replaces in place and re-sorts when the name changes; `remove` drops the entry; a `permission-denied` rejection classifies as `'permission-denied'` and an `unavailable` one as `'offline'`; every method returns `'not-signed-in'` when the session is not authorized; the cached list reads as empty after the session's uid changes.

### Success Criteria:

#### Automated Verification:

- Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`
- Production build type-checks: `npm run build`
- Development build type-checks: `npm run build -- --configuration development`

#### Manual Verification:

- None — this phase has no user-visible surface

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding.

---

## Phase 3: Roster surface — route, navigation, component

### Overview

The teacher-facing half: a guarded `/students` route, a header entry point, and one component doing add / list / edit / delete.

### Changes Required:

#### 1. Route

**File**: `src/app/app.routes.ts`

**Intent**: Add the roster as a third route behind `authGuard`, declared before the wildcard. Extend the file's own doc comment, which currently states routing stops at the shell — that sentence becomes wrong the moment this route exists.

**Contract**: `{ path: 'students', component: StudentRosterComponent, canActivate: [authGuard] }`, placed between `''` and `'**'`. No lazy loading, consistent with the rest of the file.

#### 2. Header navigation

**File**: `src/app/shared/components/UI/header/header.component.{ts,html,scss}`

**Intent**: Give the roster an entry point and a way back. Both links live inside the existing `@if (email(); as address)` block, so the sign-in screen keeps only the language toggle — FR-018's requirement that the toggle appears on every screen is what makes that block's boundary load-bearing.

**Contract**: Two `routerLink` entries — reports (`/`) and students (`/students`) — with `routerLinkActive` marking the current one; `HeaderComponent` adds `RouterLink` and `RouterLinkActive` to its `imports`. Labels are translate keys (`students.navLink`, `students.navReports`). No change to the sign-out button or the language toggle.

#### 3. Roster component

**File**: `src/app/students/student-roster/student-roster.component.{ts,html,scss}`

**Intent**: One standalone component owning the whole surface. Layout follows `TemplatePanelComponent`: a form inside `app-form-wrapper` above a list, `MatSnackBar` for outcome messages, an inline retry for a failed load, per-row in-flight state. A list rather than a `mat-table` — four values per student read fine as a two-line row, and a Material table would drag in the `data-table-cells` mixin and its row-height caveats for no gain.

**Contract**:

- Form: `app-input-text` for `studentName` (required) and `name`; `app-select` for `sex` (`sexes`, required) and `class` (`classes`). All four go through the shared wrappers — `src/CLAUDE.md` forbids a raw `mat-form-field` outside a table cell.
- Mode: an `editingId: WritableSignal<string | null>`. `null` means the form adds; a value means it edits that student. Entering edit patches the form, scrolls it into view (`block: 'nearest'`) and focuses the first field; Cancel resets to add mode. The submit button's label switches between `students.add` and `students.saveChanges`.
- A total `Readonly<Record<StudentsFailure, string>>` map of failure → translate key, so adding a failure member fails compilation instead of surfacing as "something went wrong".
- Delete reuses `ConfirmDialogComponent` unchanged, opened with `{ titleKey, messageKey, messageParams: { name }, confirmKey, cancelKey, confirmVariant: 'danger' }`, and normalizes anything other than `true` to a refusal.
- States rendered: loading, load-failed (with retry), empty, populated.
- `app-button` inside the form must pass `[type]` explicitly — the component's default resolves to *submit* in HTML.
- SCSS `@use`s `src/assets/styles/utils/index` and the pattern mixins; no hardcoded colours, sizes, radii, or shadows.

#### 4. Component spec

**File**: `src/app/students/student-roster/student-roster.component.spec.ts`

**Intent**: Cover the flows a teacher can reach, with a fake `StudentsService` and a fake `MatDialog`.

**Contract**: Spreads `translateTestingImports`. Covers — the list renders what the service signal holds; submitting in add mode calls `create` and clears the form; Edit patches the form and switches the button label, and submitting calls `update` with that id; Cancel returns to add mode without writing; Delete opens the dialog and only calls `remove` when it closes `true`; a failed `load` renders the retry and a second attempt succeeds.

#### 5. Translations

**File**: `src/assets/i18n/pl.json`, `src/assets/i18n/en.json`

**Intent**: FR-018 — new surfaces ship both languages in the same change. A `students` block alongside `auth` and `templates`.

**Contract**: Keys for the nav links, section title and lead, the four field labels, add / save-changes / cancel / edit / delete / retry, loading / empty / saved / updated / deleted, the delete-confirmation title, message (interpolating `{{name}}`), and confirm label, and one entry per `StudentsFailure` member. Key parity between the two files is a maintained invariant — verify counts match.

### Success Criteria:

#### Automated Verification:

- Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`
- Both builds type-check: `npm run build` and `npm run build -- --configuration development`
- i18n key parity: `pl.json` and `en.json` have the same key count

#### Manual Verification:

- With `npm run emulators` plus `npm start`, and a seeded `allowedUsers` document: add a student, see them listed, edit each of the four fields, delete behind the dialog
- The header shows both nav links only when signed in; the sign-in screen still shows only the language toggle
- PL/EN switching relabels every string on the roster, the dialog included
- Signing in as a second seeded account shows an empty roster, and the first account's students are not visible
- Visiting `/students` while signed out lands on the sign-in screen
- The four report forms are unchanged — open each one and confirm nothing moved

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding.

---

## Phase 4: Verification and documentation

### Overview

Run every gate together, then bring the documents into agreement with the code.

### Changes Required:

#### 1. Conventions file

**File**: `src/CLAUDE.md`

**Intent**: Three sections become incomplete once this slice lands: the folder map (no `src/app/students/`), the navigation description (which states the router stops at the shell), and the Firestore seam paragraph (which names `src/app/templates/` as the only pattern). `context/foundation/lessons.md` makes contradicted sections in-scope for the same change.

**Contract**: Add `src/app/students/` to the folder map; correct the router paragraph to name the third route and say what it is for; note that `students` is the first mutable collection and that its rule allows `update`; record the navigation consequence — leaving the shell resets the active tab and drops unsaved report-form state.

#### 2. Roadmap

**File**: `context/foundation/roadmap.md`

**Intent**: Record the outcome the way `S-01` and `S-02` are recorded, including the two deliberate departures from the PRD.

**Contract**: `S-03` status → done (with the deploy date once Phase 5 runs); an `Outcome (…)` block naming the four-field identity record, the closed-select `class`, the auto-id decision, and the first `update` rule; update the "At a glance" and "Backlog Handoff" rows; note under `S-04` that the roster stores exactly `STUDENT_IDENTITY_FIELDS` and that a spec asserts it; leave Open Roadmap Question #1 (GDPR) **open** and add that student data is now live.

#### 3. PRD deviation record

**File**: `context/foundation/prd.md`

**Intent**: FR-005 says "free-text class label" and §Non-Goals says students hold "a name and a free-text class label". The implementation stores four fields with `class` as a closed select. Leaving the PRD unamended would make it disagree with shipped behaviour on a data-minimization claim — the one claim it makes about minors' data.

**Contract**: Annotate FR-005 and the matching §Non-Goals bullet with a dated amendment naming what is stored, why `sex` is included (required control, gendered PDF wording, otherwise re-entered per report), and why `class` is a select (the report form's control is one). Do not touch Open Question #2.

#### 4. Infrastructure notes

**File**: `context/foundation/infrastructure.md`

**Intent**: Check for statements enumerating collections or describing the rules surface; update only what this change contradicts.

**Contract**: Add `students` wherever collections are listed. No other edits.

#### 5. Change record

**File**: `context/changes/student-roster/change.md`

**Contract**: `status: implemented`, `updated: <today>`.

### Success Criteria:

#### Automated Verification:

- Rules tests pass: `npm run test:rules`
- Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Lint clean: `npm run lint`
- Both builds type-check: `npm run build` and `npm run build -- --configuration development`

#### Manual Verification:

- No document left contradicting another — `src/CLAUDE.md`, `firestore.rules`, the roadmap and the PRD agree on what is stored and where
- The full FR walkthrough on the emulators once more: FR-005 add, FR-006 list, FR-007 edit, FR-008 delete, FR-018 both languages

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation before proceeding.

---

## Phase 5: Release

### Overview

Publish, rules first. A client shipped ahead of its rules meets `permission-denied` on every roster call.

### Changes Required:

#### 1. Merge to the integration branch

**Intent**: Feature work happens on `10xdevs-S03`; `10xdevs` is the deploy base. `src/CLAUDE.md` is explicit that deploying from `master` would silently roll production back past the sign-in gate.

**Contract**: Merge into `10xdevs`, then `git branch --show-current` must print `10xdevs` before anything is built.

#### 2. Deploy

**Intent**: Rules, then hosting — the order `S-02`'s Phase 6 used.

**Contract**: `npm run test:rules` → `npx firebase deploy --only firestore:rules` → `npm run build` → confirm `dist/browser/index.html` exists → `npx firebase deploy --only hosting`.

### Success Criteria:

#### Automated Verification:

- Rules tests pass immediately before the rules deploy: `npm run test:rules`
- Build output present: `ls dist/browser/index.html`
- Current branch is the deploy base: `git branch --show-current` prints `10xdevs`

#### Manual Verification:

- On `https://britannia-reports.web.app`: sign in, add a student, edit them, delete them
- A second seeded account sees only its own roster
- The four report forms still render and still download a PDF
- No `permission-denied` in the console during any roster action — if one appears after a clean sign-in, suspect App Check before the rules (`src/CLAUDE.md` records that it presents on the Firestore call, not on sign-in)

---

## Testing Strategy

### Unit Tests (Karma + Jasmine, next to their sources):

- `students.service.spec.ts` — validation, cache behaviour across an account switch, sort order after create and after a rename, error classification, `not-signed-in` on every method
- `student-roster.component.spec.ts` — add, edit-then-save, cancel, delete-confirmed, delete-refused, load failure then retry
- `student-domain.spec.ts` — the roster domain equals `STUDENT_IDENTITY_FIELDS`

### Rules Tests (`node --test`, outside `src/`):

- `test/rules/students.test.mjs` — owner CRUD including update; another allowlisted teacher denied all four; a signed-in non-allowlisted account denied on its own subtree; unverified email denied; unauthenticated denied

### Manual Testing Steps:

1. `npm run emulators` in one terminal, `npm start` in another; seed an `allowedUsers` document for the signing-in address through the emulator UI
2. Sign in, open Students from the header, add a student with all four fields
3. Reload the page — the student is still listed (proves it persisted, not just cached)
4. Edit the name and the class; confirm the list re-sorts
5. Delete behind the dialog; cancel once first and confirm nothing was removed
6. Switch PL/EN and confirm every string on the roster and in the dialog changes
7. Sign out, sign in as a second seeded account, confirm an empty and disjoint roster
8. Navigate to `/students` while signed out — expect the sign-in screen
9. Open each of the four report forms and download one PDF — expect no change

## Performance Considerations

One `getDocs` per roster mount, matching the templates panel and the Spark 50K reads/day budget the risk register names. No listeners. Sorting and filtering happen client-side over a list that is small by construction — a teacher's own students, not a school's.

## Migration Notes

None. `students` is a new collection; no existing document is read or rewritten. Rolling back means deploying the previous rules and the previous bundle; documents already written stay, invisible to a client with no roster surface.

## References

- Roadmap slice: `context/foundation/roadmap.md` → S-03, Backlog Handoff, Open Roadmap Question #1
- PRD: FR-005…FR-008, FR-018, §Non-Goals, Open Question #2
- Pattern to copy: `src/app/templates/templates.gateway.ts`, `src/app/templates/templates.service.ts`, `src/app/templates/template-panel/template-panel.component.ts`
- Rules shape and rationale: `firestore.rules` (closing comment)
- Rules-test reference: `test/rules/report-templates.test.mjs`
- Identity domain: `src/app/templates/template-domain.ts:74`
- Conventions: `src/CLAUDE.md`; recurring rules: `context/foundation/lessons.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Store contract — rule and rules tests

#### Automated

- [x] 1.1 Rules tests pass: `npm run test:rules`
- [x] 1.2 The new suite fails when the rule is temporarily narrowed, then passes again once restored

#### Manual

- [x] 1.3 Emulator `evaluation error` lines confirmed as the known `isAllowlisted()` artefact

### Phase 2: Data layer — model, gateway, service

#### Automated

- [ ] 2.1 Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- [ ] 2.2 Lint clean: `npm run lint`
- [ ] 2.3 Production build type-checks: `npm run build`
- [ ] 2.4 Development build type-checks: `npm run build -- --configuration development`

### Phase 3: Roster surface — route, navigation, component

#### Automated

- [ ] 3.1 Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- [ ] 3.2 Lint clean: `npm run lint`
- [ ] 3.3 Both builds type-check
- [ ] 3.4 i18n key parity between `pl.json` and `en.json`

#### Manual

- [ ] 3.5 Add, list, edit and delete work against the emulators
- [ ] 3.6 Header nav appears only when signed in; sign-in screen keeps only the language toggle
- [ ] 3.7 PL/EN switching relabels the roster and the dialog
- [ ] 3.8 A second seeded account sees a disjoint, empty roster
- [ ] 3.9 `/students` while signed out lands on the sign-in screen
- [ ] 3.10 The four report forms are visually unchanged

### Phase 4: Verification and documentation

#### Automated

- [ ] 4.1 Rules tests pass: `npm run test:rules`
- [ ] 4.2 Unit tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- [ ] 4.3 Lint clean: `npm run lint`
- [ ] 4.4 Both builds type-check

#### Manual

- [ ] 4.5 No document contradicts another (`src/CLAUDE.md`, `firestore.rules`, roadmap, PRD)
- [ ] 4.6 Full FR walkthrough: FR-005, FR-006, FR-007, FR-008, FR-018

### Phase 5: Release

#### Automated

- [ ] 5.1 Rules tests pass immediately before the rules deploy
- [ ] 5.2 Current branch is the deploy base: `git branch --show-current` prints `10xdevs`
- [ ] 5.3 Build output present: `ls dist/browser/index.html`

#### Manual

- [ ] 5.4 Add / edit / delete a student on production
- [ ] 5.5 A second seeded account sees only its own roster on production
- [ ] 5.6 The four report forms still render and still download a PDF
- [ ] 5.7 No `permission-denied` during any roster action
