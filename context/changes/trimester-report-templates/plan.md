# Trimester/Semester Report Templates — Implementation Plan

## Overview

Roadmap slice **S-02**, the north star: a teacher saves the reusable half of a filled-out
trimester/semester report as a named template, sees a list of their own templates, applies one to a
new report (with a confirmation prompt before overwriting non-empty fields), deletes templates they
no longer want, and downloads the PDF.

Two things ride along, and neither is optional. The first is the **Firebase emulator suite plus a
rules-testing harness**, deferred by `S-01` on an argument that expires the moment a per-teacher
collection exists (`firestore.rules:75-104`, `infrastructure.md:143-155`, `src/CLAUDE.md:46-50`). The
second is the **field-domain boundary** — which controls a template owns and which it must never
touch. `S-04` (student picker) is built on the assumption that those two sets are disjoint, so the
boundary drawn here is a contract, not an implementation detail, and this plan makes it
machine-checked rather than documented.

## Current State Analysis

**Auth and data.** `S-01` landed the gate: `src/app/auth/` holds `SessionService` (the one
`SessionState` signal) plus two gateways that own every Firebase SDK call. Firestore has exactly one
collection, `allowedUsers`, read-only to the account each document names, writable by nobody
(`firestore.rules:28-33`). Everything else is denied by the catch-all.

**`SessionState` carries no `uid`.** It exposes `email` and `role`
(`src/app/model/auth.interface.ts:35`). Per-teacher rules must key on `request.auth.uid` — and
`firestore.rules:54-56` warns explicitly against reaching for the email because this file happens to
show the email version first. So exposing `uid` is the first change in the session layer.

**No emulator, and dev writes to production.** No `emulators` block in `firebase.json`, no
`connect*Emulator` calls, no `useEmulators` flag. `src/CLAUDE.md:46-50` states this plainly and adds:
"treat anything you run locally as writing to production." `infrastructure.md:112` scores that H/H and
names this slice as the point where the exposure stops being a read-only allowlist and becomes real
teacher data.

**The trimester/semester form is the most constrained surface in the repo.**

- 48 controls, of which 14 are `FormArray`s. Only 26 are bound anywhere in
  `semestr-report.component.html`; the other 22 are unreachable through the UI, a fact
  `semestr-report.fixture.ts:21-24` records deliberately.
- `semestr-report.component.spec.ts:63-163` freezes the exact control names and the exact set of
  `FormArray`s. The comment at line 61 says a later change that legitimately adds a control updates
  that list **in the same change, deliberately**.
- Three visibility booleans live *outside* the form — `isCheckedBook`, `isCheckedOwnTitle`,
  `isChecked` (`semestr-report.component.ts:121-126`) — and they gate whether `studentBookTitle`,
  `ownTitleStudentBook` and `examRecommendationResult` are rendered at all. The form value alone does
  not determine what the teacher sees.
- `ownEducationMaterial` holds a mix of types: the radio buttons bind `"1"` and `"2"`, while the
  handlers write `true` and `false` (`semestr-report.component.ts:244-264`).
- `src/CLAUDE.md:7` makes PDF fidelity a hard guardrail and `docs/pdf-fidelity-check.md:14` makes the
  procedure mandatory for any change touching `*-report.component.ts`. The trimester/semester
  reference PDFs are committed (`docs/pdf-fidelity/reference/semestr-{minimal,maximal}.pdf`), so the
  "before" side of the comparison is free for this report type.

**No dialog and no snackbar exist anywhere in the app.** The FR-011 confirmation prompt is the first
`MatDialog` in the codebase.

**Navigation has two layers that must not merge** (`src/CLAUDE.md:33-38`): the router decides whether
you are in the app; `TabData.tabs` decides which report you are looking at. Switching tabs remounts
the report component through `NgComponentOutlet`, which destroys form state — which is why the
template surface belongs inside the report form and not on a tab or a route of its own.

**i18n.** New surfaces use a nested namespace — `auth.*` at `src/assets/i18n/en.json:261`. Both
bundles ship in the same change (`src/CLAUDE.md:66`); key parity is currently 267/267.

## Desired End State

A signed-in teacher opens the trimester/semester report and sees a **Templates** panel above the
form. They fill the cohort-level fields (course, book, teachers, realized material, signature, report
type, date), type a name, and save. The panel then lists that template. On the next report they pick
it from the list and press Apply: the cohort fields fill in, a dialog first lists exactly which
non-empty fields will be overwritten or cleared, student-identity fields and per-student assessment
fields are untouched, and the generated PDF is indistinguishable from one typed by hand. They can
delete a template. Every string works in Polish and English.

Underneath: templates live at `users/{uid}/reportTemplates/{templateId}`, a Firestore rule allows a
teacher to read, create and delete only under their own `uid` and forbids updates outright,
`npm run test:rules` proves that rule against the emulator in three scenarios, and `npm start`
against `useEmulators: true` no longer touches production data.

**How to verify it:** `npm run lint` clean, `npm test` green, `npm run test:rules` green, both
production and development builds type-check, the PDF-fidelity comparison for both semestr fixtures
recorded under `## Progress`, and the manual checklist in each phase walked in a real browser.

### Key Discoveries:

- The 48 controls partition cleanly into four disjoint sets (template / student-identity /
  per-student assessment / unreachable), and the four sets sum to exactly 48 — so the boundary can be
  asserted as an exhaustive partition of `Object.keys(form.controls)` rather than described in prose.
- Using the normalized name as the document id plus `allow update: if false` turns two separate
  requirements — unique names, and PRD's "templates are write-once" non-goal — into one
  rules-enforced invariant.
- `docs/pdf-fidelity-check.md:139-148` documents a `cmp -l` supporting signal: for a same-machine
  pair, differences confined to `/CreationDate` and the trailer `/ID` prove the content streams are
  byte-identical. With committed semestr references that makes this slice's fidelity check cheap.
- `@firebase/rules-unit-testing` needs a Node runner, and Node's built-in `node --test` plus
  `firebase emulators:exec` covers it without adding Jest or Vitest — which `src/CLAUDE.md:80`
  classifies as explicit future work, not a side effect of another change.
- `tsconfig.spec.json` includes only `src/**/*.spec.ts`, and ESLint lints only `src/**/*.{ts,html}`.
  A rules spec placed outside `src/` and written as `.mjs` is invisible to Karma, to the TypeScript
  spec project, and to the linter — no configuration fights.

## What We're NOT Doing

- **No template editing.** PRD Non-Goals: templates are write-once; delete and re-save. Enforced in
  rules, not just in UI.
- **No templates for the year-end, Cambridge, or Teddy Eddie forms.** Those three forms are not
  opened at all by this change.
- **No student roster and no student picker.** `S-03` and `S-04`. This change never writes to
  `studentName`, `name`, `sex`, or `class`.
- **No template sharing, no report history, no PDF archive.** PRD Non-Goals.
- **No per-student assessment fields in the template domain.** A deliberate narrowing — see
  Implementation Approach.
- **No CI integration for `npm run test:rules`.** It is a local, on-demand script. There is no CI in
  this repo (`.github/` does not exist) and adding one is parked in the roadmap.
- **No migration of `npm test` to a Node runner.** Karma + Jasmine stays the browser test runner.
- **No changes to the `pdfmake` document definition** in `semestr-report.component.ts`. The builder
  and its inputs are untouched; only two new methods are added alongside it.
- **No `allowedUsers` schema change.** The allowlist stays keyed on email; only the session's
  in-memory state gains `uid`.

## Implementation Approach

**The field domain is narrow on purpose.** A template owns exactly the ten controls that are
properties of a *cohort*, not of a student:

| Control | Default in `createForm()` |
| --- | --- |
| `reportType` | `ReportType.TRIMESTER` |
| `date` | `null` |
| `teachers` | `null` |
| `ownEducationMaterial` | `false` |
| `studentBookTitle` | `null` |
| `ownTitleStudentBook` | `null` |
| `course` | `null` |
| `realizedMaterial` | `null` |
| `signature` | `null` |
| `isExamRecommendation` | `false` |

The six required descriptive-mark selects, `frequency`, `avgMark`, `additionalComment`,
`recommendationToCambridgeExam` and the two `examRecommendation*` value controls stay out. They are
judgements about one child; a template that pre-filled them would make "teacher overlooked one
select" mean "a parent received a PDF carrying another student's grade" — the worst available failure
for this product, and not worth the handful of clicks it would save. `realizedMaterial` (the large
textarea) and every organizational select *are* in the domain, so the mechanical bulk of retyping is
still removed.

**Storage keys ownership on the path, not on a field.** `users/{uid}/reportTemplates/{templateId}`
makes the rule a comparison against a path segment, which structurally cannot exhibit the
`teacherUid`-vs-`teacherId` failure that `firestore.rules:67-72` and `infrastructure.md:111` describe
as the project's top risk — an over-permissive rule that never fails loudly.

**Apply is deterministic, and emptiness is detected explicitly.** A stored template always carries
every key of its domain, and Apply writes all of them, including `null`. Separately, Apply compares
the template against a single `TEMPLATE_DOMAIN_DEFAULTS` constant and does nothing when they match —
which is how US-01's "an empty template applies as a no-op" and FR-011's "replaces all
template-controlled fields" both hold at once. Because Apply can clear a field the teacher typed, the
confirmation dialog lists fields it will **clear** as well as fields it will **overwrite**.

**Forward compatibility lives in the code, not in the documents.** The document carries
`schemaVersion: 1`; Apply iterates the `TEMPLATE_DOMAIN` constant, treats a key missing from the
document as that key's default, and ignores keys the constant does not know. When `S-04` widens the
domain, templates saved today keep working.

**The panel is its own component and touches `form` only through a payload.**
`app-template-panel` owns its own small form; `SemestrReportComponent` keeps its 48 controls exactly
as they are and gains two methods — one that reads the domain out of `form`, one that writes a domain
payload into it. That is what keeps the frozen contract spec and the PDF-fidelity fixtures honest, and
it is the seam `S-04` will reuse for the student picker.

**The Firebase seam is repeated, not reinvented.** A `templates.gateway.ts` holds every
`@angular/fire/firestore` call; a `templates.service.ts` holds the decisions (list, save, delete,
duplicate detection, emptiness, overwrite diff). This mirrors `auth.gateway.ts` /
`allowlist.gateway.ts` / `session.service.ts` and exists for the same reason: the service can be
driven with fakes.

## Critical Implementation Details

**The three visibility booleans must be derived on apply, or the PDF lies.** `studentBookTitle`,
`ownTitleStudentBook` and `examRecommendationResult` render only when `isCheckedBook`,
`isCheckedOwnTitle` and `isChecked` respectively are true, but all three live outside `form`. Applying
a template that sets `studentBookTitle` without raising `isCheckedBook` puts the value into
`form.value` — and therefore into the PDF — behind a field the teacher cannot see. Apply must derive
the trio from the payload it just wrote, using the same mapping the three `onCheckboxChange*` handlers
encode: `ownEducationMaterial === "1"` ⇒ book-from-list, `=== "2"` ⇒ own title, `=== true` ⇒ own
materials with both title controls null. `isChecked` is not in the template domain and stays false;
`examRecommendationResult` is a per-student field, so a template never puts a value behind it.

**Specs use the native date adapter; the app uses the moment adapter.** `app.config.ts:55` provides
`provideMomentDateAdapter`, so `MatDatepickerInput` writes a `Moment` into the `date` control at
runtime — while every spec provides `provideNativeDateAdapter` (`src/CLAUDE.md:82`), where it writes a
`Date`. A `date` round-trip through Firestore can therefore pass every spec and break in the browser,
which is exactly the class of defect `S-01` shipped three of. Store `date` as a calendar-date string
(`YYYY-MM-DD`, no time, no zone) and let the adapter deserialize it on the way back; both `Date` and
`Moment` expose the accessors needed to produce it, and `generatePDF`'s `new Date(form.value.date)`
accepts the string unchanged. Verify this one in a real browser, not only in a spec.

**Turning the emulator on breaks sign-in until the allowlist is seeded there.** The Auth and Firestore
emulators start empty, so a teacher who signs in against them is not on the allowlist and
`SessionService` refuses the session — the whole app becomes unusable locally the moment
`useEmulators` flips to true. The emulator data directory (imported on start, exported on exit) is
what makes the seed survive a restart, and seeding it once is part of Phase 1, not a follow-up.

**App Check attests to the real project and must be skipped under the emulator.** `provideAppCheck`
sits in the same providers array; leaving it active while Firestore points at localhost buys nothing
and drags the per-machine debug-token dance into every new dev environment. Omit the provider when
`environment.useEmulators` is true.

**`ownEducationMaterial` is heterogeneous and must survive the round-trip as-is.** Its value is
`"1" | "2" | true | false`. Do not normalize it to a boolean or to a string on the way into Firestore:
the radio group's `[value]` bindings and the `generatePDF` fallback chain
(`semestr-report.component.ts:352-360`) both depend on the current mix.

---

## Phase 1: Emulator suite, rules harness, and the per-teacher rule

### Overview

Stand up the thing three documents have been pointing at since `S-01`, and write the first
per-teacher rule behind it. Nothing user-visible ships in this phase.

### Changes Required:

#### 1. JDK on the development machine

**File**: none — human, one-time.

**Intent**: The Firestore emulator runs on the JVM and `infrastructure.md:153` records the JDK as
still absent as of 2026-07-28. Nothing else in this phase can be verified without it.

**Contract**: `java -version` prints a version ≥ 11. Any JDK distribution is acceptable; record which
one was installed in the change's notes so the next machine can match it.

#### 2. Emulator configuration

**File**: `firebase.json`

**Intent**: Add an `emulators` block for `auth` and `firestore` plus the emulator UI, so the app and
the rules spec have something local to talk to.

**Contract**: New top-level `"emulators"` key only — `hosting.public` and the `firestore.rules`
pointer are untouched. `infrastructure.md:127` says not to edit this file's existing keys, and
`src/CLAUDE.md:119` explains why `hosting.public` may never drift from `angular.json`'s
`outputPath`. Ports: Firestore 8080, Auth 9099, UI 4000. Set `singleProjectMode: true`.

#### 3. Environment flag

**Files**: `src/environments/environment.model.ts`, `environment.ts`, `environment.prod.ts`

**Intent**: A single boolean that decides whether the app talks to emulators.

**Contract**: `Environment` gains `useEmulators: boolean`. `environment.ts` sets it `true`;
`environment.prod.ts` sets it `false`. Both files must be edited in the same commit — `src/CLAUDE.md:116`
records that `npm run build` type-checks only the prod file, so an error in the dev file survives every
default gate.

#### 4. Emulator wiring in the providers array

**File**: `src/app/app.config.ts`

**Intent**: Point Auth and Firestore at the emulators when the flag is set, and drop App Check in
that case.

**Contract**: Inside the existing `provideAuth` / `provideFirestore` factories, call
`connectAuthEmulator` / `connectFirestoreEmulator` when `environment.useEmulators`. The
`provideAppCheck(...)` entry becomes conditional — spread it into `providers` only when the flag is
false. The order established by `src/CLAUDE.md:42` still holds: `provideFirebaseApp` first. The
`FIREBASE_APPCHECK_DEBUG_TOKEN` assignment at module scope stays where it is and keeps its comment;
it is now unreachable in the emulator path but still correct for a non-emulator dev build.

#### 5. The per-teacher rule

**File**: `firestore.rules`

**Intent**: Open `users/{uid}/reportTemplates/{templateId}` to exactly one teacher, and forbid
updates so PRD's write-once non-goal is enforced by the store rather than by the UI.

**Contract**:

```
match /users/{uid}/reportTemplates/{templateId} {
  allow read, create, delete: if request.auth != null && request.auth.uid == uid;
  allow update: if false;
}
```

Ownership is the path segment, not a document field. The `users/{uid}` parent document is never
written and needs no rule of its own; the catch-all deny keeps it closed. Do not add a
`schemaVersion` assertion — it would break the forward compatibility Phase 2 builds in.

#### 6. Rewrite the instruction block in the rules file

**File**: `firestore.rules` (the comment block at lines 42-105)

**Intent**: That block addresses "the next slice that adds a collection" and tells it to build the
harness. This *is* that slice. Leaving the block as written makes the file instruct a reader to do
work that is already done, in the same file that now contains the result.

**Contract**: Rewrite it as a record: which collections are open and on what shape of rule, that
ownership keys on the path here and why that was chosen over an owner field, that the harness exists
and how to run it, and what the next slice (`S-03`) inherits. Keep the `teacherUid`/`teacherId`
cautionary tale — it is still the reason the path-keyed shape was picked. This is the
`lessons.md` rule about a document contradicting itself, applied to the file being edited.

#### 7. Rules spec and the npm script

**Files**: `test/rules/report-templates.rules.mjs` (new), `package.json`

**Intent**: Make the three scenarios `infrastructure.md:153` names into a repeatable command.

**Contract**: `@firebase/rules-unit-testing` as a devDependency; no new test runner —
`node --test` plus `firebase emulators:exec` (both already available). Script:
`"test:rules": "firebase emulators:exec --only firestore \"node --test test/rules\""`. Coverage,
minimum: teacher A reads and writes their own document; teacher B is denied read, create and delete
against A's document; an unauthenticated caller is denied everything; and an update to an existing
document is denied for the owner too. The file lives outside `src/`, so Karma
(`tsconfig.spec.json` includes only `src/**/*.spec.ts`), the TypeScript spec project, and ESLint
(`src/**/*.ts`) all ignore it — do not add it to any of them.

#### 8. Emulator data directory and startup script

**Files**: `package.json`, `.gitignore`

**Intent**: The emulators start empty, so the allowlist entry that lets you sign in locally has to
survive a restart.

**Contract**: `"emulators": "firebase emulators:start --import=./.emulator-data --export-on-exit"`,
and `.emulator-data/` added to `.gitignore`. Seed one `allowedUsers` document through the emulator UI
once, then exit the emulator so it exports. Local development is now two commands, which is a change
to the documented workflow — Phase 5 records it.

### Success Criteria:

#### Automated Verification:

- `java -version` reports a JDK ≥ 11
- `npx firebase emulators:start` boots Firestore and Auth without error
- `npm run test:rules` passes all four scenarios
- `npm run lint` exits 0
- `npm test -- --watch=false --browsers=ChromeHeadless` stays green (50/50)
- `npm run build` type-checks; `npm run build -- --configuration development` type-checks

#### Manual Verification:

- With `useEmulators: true`, `npm start` reaches the sign-in screen and the browser console shows no
  Firebase connection errors
- Signing in against the Auth emulator with a seeded `allowedUsers` document reaches the shell
- Signing in with an address that is *not* seeded shows the existing "no access" message — the gate
  still behaves as `S-01` built it
- Stopping and restarting the emulators preserves the seeded allowlist document

**Implementation Note**: pause here for manual confirmation before Phase 2.

---

## Phase 2: Session `uid` and the template data layer

### Overview

Expose the identifier the rule compares against, then build the domain constant, the gateway, and the
service. Still nothing user-visible.

### Changes Required:

#### 1. `uid` on the session state

**Files**: `src/app/model/auth.interface.ts`, `src/app/auth/session.service.ts`

**Intent**: The rule keys on `request.auth.uid`; nothing in the app currently knows it.

**Contract**: `SessionState`'s `authorized` variant gains `uid: string`. `AuthorizedAccount` in
`session.service.ts:19` gains the same, populated from the `User` already in hand in
`resolveAccount`. The allowlist lookup still keys on email — the two identifiers stay distinct, as
`firestore.rules:54-56` insists.

#### 2. Session specs

**Files**: `src/app/auth/session.service.spec.ts`, `src/app/auth/auth.guard.spec.ts`

**Intent**: Three literal `authorized` states in specs stop type-checking once the variant grows a
field.

**Contract**: `session.service.spec.ts:105`, `auth.guard.spec.ts:58` and `:92` gain a `uid`. Add one
assertion that the resolved state carries the `uid` from the auth emission — otherwise nothing proves
the wiring beyond the compiler.

#### 3. Template domain constant

**File**: `src/app/templates/template-domain.ts` (new)

**Intent**: One place that answers "which controls does a template own", plus their defaults, plus
the schema version. Every other file reads it.

**Contract**: Exports `TEMPLATE_SCHEMA_VERSION = 1`, `TEMPLATE_DOMAIN` (the ten control names from
Implementation Approach, as a readonly tuple), and `TEMPLATE_DOMAIN_DEFAULTS` (the ten defaults,
matching `createForm()` exactly). Also exports the three sibling sets the boundary spec asserts
against — `STUDENT_IDENTITY_FIELDS` (4), `PER_STUDENT_FIELDS` (12), `UNREACHABLE_FIELDS` (22) — so
the partition lives next to the domain it partitions. No Angular imports; this is data.

#### 4. Template model

**File**: `src/app/model/report-template.interface.ts` (new)

**Intent**: The stored document's shape and the payload the panel exchanges with the report.

**Contract**: `ReportTemplateFields` (keyed by `TEMPLATE_DOMAIN`), `ReportTemplate`
(`id`, `name`, `fields`, `createdAt`), and `ReportTemplateDraft` (`name` + `fields`, no id). Document
shape: `{ schemaVersion, name, nameKey, createdAt, fields }` where `nameKey` is the normalized name
and also the document id. `date` inside `fields` is a `YYYY-MM-DD` string or `null`;
`ownEducationMaterial` is `string | boolean` and is stored verbatim.

#### 5. Templates gateway

**File**: `src/app/templates/templates.gateway.ts` (new)

**Intent**: Every `@angular/fire/firestore` call for templates, and nothing else — the same seam
`allowlist.gateway.ts` established.

**Contract**: `list(uid)`, `create(uid, draft)`, `remove(uid, templateId)`. One-shot `getDocs`, not
`collectionData`/`onSnapshot` — `allowlist.gateway.ts:26-30` records the Spark-quota reason and
`infrastructure.md:115` scores leaky listeners as a live risk. Wrap calls in
`runInInjectionContext`, as both existing gateways do. Rejections propagate; this file makes no
decisions and maps no errors.

#### 6. Templates service

**File**: `src/app/templates/templates.service.ts` (new)

**Intent**: All the decisions: normalize names, reject duplicates and invalid names, detect an empty
template, and compute what an apply would overwrite or clear.

**Contract**:
- `nameKey(name)` — trim, collapse internal whitespace, lowercase. It is both the uniqueness key and
  the document id.
- Name validation rejects: empty after trim, longer than 60 characters, containing `/`, or starting
  with `__`. The last two are Firestore document-id constraints, and a name that violates them would
  fail at the write with an opaque error instead of a message.
- `save(draft)` rejects a name whose `nameKey` matches a template already in the loaded list, with a
  distinct "name already exists" outcome. The rule's `allow update: if false` is the backstop for the
  race across two tabs; this check is what produces a usable message.
- `isEmpty(fields)` — true when every key equals `TEMPLATE_DOMAIN_DEFAULTS`.
- `diff(fields, currentFormValues)` returns two lists of control names: those that will be
  **overwritten** (current value non-default, template value different and non-default) and those
  that will be **cleared** (current value non-default, template value default). The dialog renders
  both; FR-011 only names the first, and the second exists because Apply writes `null`s.
- Errors from the gateway are mapped to a small discriminated result type — not rethrown raw — so the
  panel can tell "permission denied" from "offline" from "name taken" without inspecting Firebase
  error codes.

#### 7. Service spec

**File**: `src/app/templates/templates.service.spec.ts` (new)

**Intent**: The decisions above are where the product's correctness lives, and they are testable
without Firebase.

**Contract**: Driven by a fake gateway, in the style of `session.service.spec.ts`. Cases: name
normalization (case and whitespace collapse both produce one key), each rejection reason, `isEmpty`
true for defaults and false when any single domain field is set, `diff` classifying overwrite vs
clear vs untouched, and a gateway rejection surfacing as the mapped result rather than a throw. Model
the unobliging cases — a `getDocs` that rejects, a `create` that rejects with `permission-denied` —
because `infrastructure.md:155` records that fakes are more agreeable than Firebase and that is
where `S-01`'s defects lived.

### Success Criteria:

#### Automated Verification:

- `npm test -- --watch=false --browsers=ChromeHeadless` green, including the new service spec
- The session specs assert `uid` is carried through
- `npm run lint` exits 0
- `npm run build` and `npm run build -- --configuration development` both type-check

#### Manual Verification:

- Sign in against the emulator and confirm in the browser console (or a temporary log) that the
  session's `uid` matches the Auth emulator's user id — the rule compares against this exact value

**Implementation Note**: pause here for manual confirmation before Phase 3.

---

## Phase 3: Template panel, confirmation dialog, snackbar, and translations

### Overview

Build the surface in isolation and unit-test it. It is not mounted into the report yet, so nothing a
teacher can reach changes in this phase.

### Changes Required:

#### 1. Template panel component

**Files**: `src/app/templates/template-panel/template-panel.component.{ts,html,scss}` (new)

**Intent**: The whole user-visible surface: a list of the teacher's templates, a name input with
Save, an Apply action on the selected template, and Delete.

**Contract**: Standalone, Material-composed, selector `app-template-panel`. Inputs/outputs only —
`currentFields` in (what the report form currently holds, for the diff), `apply` out (the payload the
report should write), and it calls `TemplatesService` itself for list/save/delete. It owns its own
`FormControl` for the name; it never receives or touches `SemestrReportComponent.form`. Form fields
go through the shared wrappers (`app-input-text`, `app-button`), never a raw `mat-form-field` —
`src/CLAUDE.md:105`. Empty list renders an explanatory line, not a blank area. Failure to load the
list renders inline with a retry, because a snackbar cannot explain a list that is not there.

#### 2. Confirmation dialog

**Files**: `src/app/templates/confirm-dialog/confirm-dialog.component.{ts,html,scss}` (new)

**Intent**: The FR-011 prompt — the first dialog in the app, and the one `S-03` will reuse for
"delete a student".

**Contract**: Generic enough for both uses: a title key, a message key, an optional list of item
labels, and confirm/cancel label keys, all resolved through `ngx-translate` (FR-018). Returns a
boolean. Used here for two things — apply-over-non-empty-fields (listing overwritten and cleared
fields separately) and delete-a-template. `MatDialogModule` is imported by the components that use
it; no NgModule and no global provider beyond what Material needs.

#### 3. Snackbar for operation outcomes

**File**: `src/app/templates/template-panel/template-panel.component.ts`

**Intent**: Saved / deleted / failed, without a layout that shifts.

**Contract**: `MatSnackBar` with translated messages, one call site per outcome. The list-load failure
does **not** use it — that one is inline, per item 1. Duration and position use Material defaults;
don't invent a config surface for one screen.

#### 4. Translations

**Files**: `src/assets/i18n/pl.json`, `src/assets/i18n/en.json`

**Intent**: Every new string, in both languages, in the same change (`src/CLAUDE.md:66`).

**Contract**: One nested `templates` object, mirroring the existing `auth` namespace at
`en.json:261`. Append-only — no existing key is renamed or removed. Key parity must hold: both files
end with the same key count.

#### 5. Panel and dialog specs

**Files**: `template-panel.component.spec.ts`, `confirm-dialog.component.spec.ts` (new)

**Intent**: Cover the interaction rules that a later refactor would silently break.

**Contract**: Spread `translateTestingImports` and provide `provideNoopAnimations()` — Material
dialog and snackbar both animate (`src/CLAUDE.md:82`). Cases: an empty list renders the empty state;
Save with an invalid name never calls the service; Apply on a template that `isEmpty` emits nothing
(the US-01 no-op); Apply with a non-empty diff opens the dialog and emits only on confirm; Delete
opens the dialog and removes only on confirm; a failed save shows the snackbar and leaves the list
unchanged.

### Success Criteria:

#### Automated Verification:

- `npm test -- --watch=false --browsers=ChromeHeadless` green, including both new specs
- Key parity between `pl.json` and `en.json` verified (same key count, same nested paths)
- `npm run lint` exits 0
- `npm run build` and `npm run build -- --configuration development` both type-check

#### Manual Verification:

- Nothing yet — the panel is unmounted. Confirm only that the app is unchanged: sign in, open all
  four report tabs, and see no visual or behavioural difference.

**Implementation Note**: pause here for manual confirmation before Phase 4.

---

## Phase 4: Wire the panel into the trimester/semester report

### Overview

Mount the panel, implement collect and apply against the form, and prove the two guardrails: the
frozen form-model contract and PDF fidelity.

### Changes Required:

#### 1. Mount the panel

**File**: `src/app/semestr-report/semestr-report.component.html`

**Intent**: A Templates section above the existing first section, inside the same `<form>` layout
conventions.

**Contract**: One new `<section class="form-section">` holding `<app-template-panel>` at the top of
the template, bound to the component's collect method for `currentFields` and its apply handler for
the `apply` output. No existing section, control binding, or `app-form-wrapper` is moved or altered —
the fixture at `semestr-report.fixture.ts:28-30` records template facts in prose, and every existing
binding it describes must stay true.

#### 2. Collect and apply on the report component

**File**: `src/app/semestr-report/semestr-report.component.ts`

**Intent**: Read the template domain out of `form`; write a domain payload into `form` and bring the
three visibility booleans back into agreement with it.

**Contract**: Two public methods, both driven by `TEMPLATE_DOMAIN` rather than a hand-written field
list. Apply uses `patchValue` over the domain keys only — never `setValue` on the whole form, which
would reach the other 38 controls. Then it derives `isCheckedBook` / `isCheckedOwnTitle` from
`ownEducationMaterial` using the mapping the existing `onCheckboxChange*` handlers encode (see
Critical Implementation Details); `isChecked` is not in the domain and is left alone. The `date`
value is converted to and from `YYYY-MM-DD` here, at the form boundary, so no other file has to know
whether the control holds a `Moment` or a `Date`. **The `pdfmake` document definition and every
method it calls are untouched.**

#### 3. Extend the form-model contract spec

**File**: `src/app/semestr-report/semestr-report.component.spec.ts`

**Intent**: The existing spec proves the control names did not change. Add the assertion that makes
the S-04 boundary machine-checked instead of documented.

**Contract**: `EXPECTED_CONTROLS` and `EXPECTED_ARRAYS` stay exactly as they are — this change adds no
control, and that is now a checked fact. Add a describe block asserting that `TEMPLATE_DOMAIN`,
`STUDENT_IDENTITY_FIELDS`, `PER_STUDENT_FIELDS` and `UNREACHABLE_FIELDS` are pairwise disjoint and
that their union equals `Object.keys(form.controls)` exactly — 10 + 4 + 12 + 22 = 48. A future change
that adds a control, or moves one across the boundary, now fails a test instead of quietly breaking
`S-04`. Update the comment at line 52-62 to say the freeze survived this slice and what the new
partition assertion guarantees.

#### 4. PDF-fidelity comparison

**Files**: none — procedure, plus a note under `## Progress`

**Intent**: This change edits `semestr-report.component.ts`, which
`docs/pdf-fidelity-check.md:14` makes the trigger for the mandatory procedure.

**Contract**: Follow `docs/pdf-fidelity-check.md`. The "before" side for this report type is the
committed `docs/pdf-fidelity/reference/semestr-{minimal,maximal}.pdf` — no worktree rebuild needed.
Run `npm run test:capture` (headed Chrome, `pl-PL` locale — §3), compare both semestr pairs against
the §6 checklist, and use the `cmp -l` signal from §7 as supporting evidence. Record the outcome
under `## Progress` in the format §8 prescribes. The other three report types are not reachable by
this change and are not compared. If any difference appears, stop — an intentional visual change to
this form is not licensed by any FR here.

### Success Criteria:

#### Automated Verification:

- `npm test -- --watch=false --browsers=ChromeHeadless` green, including both semestr smoke fixtures
  and the new partition assertions
- The form-model contract spec still asserts the original 48 control names and 14 arrays
- `npm run test:rules` still passes
- `npm run lint` exits 0
- `npm run build` and `npm run build -- --configuration development` both type-check

#### Manual Verification:

- Fill the cohort fields, save a template, and see it appear in the list
- Apply it to a freshly opened form: all ten domain fields fill, and `studentName`, `name`, `sex`,
  `class` and every assessment field stay exactly as they were
- Apply over a form with non-empty cohort fields: the dialog lists the fields to be overwritten *and*
  the fields to be cleared, cancel changes nothing, confirm applies everything
- Save a template with the book-from-list option, apply it, and confirm the book select is **visible**
  with the right value — the visibility-boolean case
- Repeat with the "own title" option and with "own materials"
- Apply a template carrying a date and confirm the datepicker shows `DD.MM.YYYY` and the PDF renders
  the same date — this is the moment-vs-native adapter case, and a spec cannot catch it
- Save an empty template (all defaults): applying it changes nothing and shows no dialog
- Try to save a second template with the same name in different case: rejected with a clear message
- Delete a template: dialog, then it leaves the list
- Switch PL/EN with the panel open: every string in the panel and the dialog switches
- Download the PDF from a templated report and from a hand-typed report with the same values — they
  match

**Implementation Note**: this is the phase the guardrails guard. Do not proceed to Phase 5 until the
PDF comparison is recorded and the visibility-boolean and date cases have been walked in a browser.

---

## Phase 5: Documentation sync

### Overview

Several documents now describe a project that no longer exists. `lessons.md` makes fixing the
contradicted sections part of the same change, not a follow-up.

### Changes Required:

#### 1. Project conventions

**File**: `src/CLAUDE.md`

**Intent**: Its emulator section is now false, its command list is incomplete, and it has a new
architectural seam to name.

**Contract**: Replace the "There is no emulator suite" section (lines 46-50) with what exists: the
`emulators` block, the `useEmulators` flag, the conditional App Check provider, the two-command local
startup, the data directory, and the fact that a fresh emulator needs an allowlist seed before
sign-in works. Add `npm run emulators` and `npm run test:rules` to Common commands. Add a short
`src/app/templates/` entry to the Folder map and one line to the Architecture section: the gateway /
service split is the same seam as `src/app/auth/`, and Firestore calls belong behind it. Note that
the trimester/semester form's control set is frozen by an exhaustive partition assertion, and where
that partition is declared.

#### 2. Infrastructure record

**File**: `context/foundation/infrastructure.md`

**Intent**: Getting Started step 4 is the outstanding item this phase closes, and two risk-register
rows describe it as open.

**Contract**: Mark step 4 done with what was actually built and what was deliberately not (no CI
gate, `npm run test:rules` is a local script, `npm test` unchanged). Update the row at line 111
(over-permissive rules) to record that ownership is keyed on the path rather than an owner field, and
that the three scenarios are now machine-checked. Update line 112 (dev/prod sharing one project) to
record the emulator as available with the flag on by default in `environment.ts`. Note the JDK is now
present, and which one.

#### 3. Rules file header

**File**: `firestore.rules`

**Intent**: The Phase 1 rewrite covered the instruction block; the "Open collections" header at the
top still lists only `allowedUsers`.

**Contract**: Add the templates subcollection with its one-line shape summary, in the same style.

#### 4. Roadmap

**File**: `context/foundation/roadmap.md`

**Intent**: S-02's status, its resolved unknown, and Open Roadmap Question #5.

**Contract**: S-02 gains an outcome paragraph and a status. Its "empty template is undefined" unknown
is resolved — record the resolution (all keys stored, apply compares against a defaults constant).
Open Roadmap Question #5 closes for `S-02`; record what was built, and that `S-03` inherits a working
harness rather than the obligation to build one. Add the field-domain partition as a note under
`S-04`, since that is the slice that depends on it. Update the At-a-glance and Backlog Handoff rows.

#### 5. PRD open questions

**File**: `context/foundation/prd.md`

**Intent**: Two questions move.

**Contract**: Open Question #3 is already substantively resolved and the roadmap has been asking for
the PRD to agree (roadmap OQ#3) — close it, keeping the numbering. If Phase 6 completes, Open
Question #4 (cutover communication) is overtaken by events rather than answered: record that the
deploy shipped without the message, as a decision, not as a resolution.

#### 6. Change record

**File**: `context/changes/trimester-report-templates/change.md`

**Intent**: Status and date.

**Contract**: `status: implemented`, `updated` to today. Notes gain the PDF-fidelity verdict line and
the JDK version.

### Success Criteria:

#### Automated Verification:

- `npm run lint` exits 0 (documentation-only phase, but the gate is cheap)
- `npm test -- --watch=false --browsers=ChromeHeadless` still green

#### Manual Verification:

- `src/CLAUDE.md` no longer contains a sentence that contradicts the repo — specifically, nothing
  claims there is no emulator suite and nothing claims `npm start` is a single command
- A reader who knows nothing about this change can start the emulators, seed the allowlist, and sign
  in locally using only `src/CLAUDE.md`
- Roadmap, PRD and `infrastructure.md` agree with each other about whether the harness exists

**Implementation Note**: pause here for manual confirmation before Phase 6.

---

## Phase 6: Deploy to live and enable App Check enforcement

### Overview

The first hosting deploy since `S-05a`. It publishes three merged-but-undeployed slices at once
(`S-05b`, `S-01`, `S-02`) and removes public-URL access from anyone not on the allowlist.

**This phase ships the FR-004 regression without the cutover message that PRD Open Question #4 and
roadmap OQ#2 call for.** That was decided deliberately during planning — see Open Risks &
Assumptions. Anyone holding a bookmark to `britannia-reports.web.app` will meet a sign-in screen with
no advance notice.

### Changes Required:

#### 1. Flip the environment for production

**File**: `src/environments/environment.prod.ts`

**Intent**: Confirm, not change — `useEmulators` must be `false` on the production build, and this is
the one value whose being wrong would point the live app at a localhost that does not exist.

**Contract**: `useEmulators: false`. Verify by inspecting the built bundle for the emulator host
string, not only by reading the source: `fileReplacements` is what makes this file the one that
ships, and `src/CLAUDE.md:116` records that only this file is type-checked by a default build.

#### 2. Build and verify the artifact

**Files**: none — commands.

**Intent**: `firebase deploy` exits 0 over an empty directory and publishes nothing over a live site
(`infrastructure.md:109`).

**Contract**: `npm run build`, then confirm `dist/browser/index.html` exists. A missing file means
stop, not deploy anyway.

#### 3. Deploy rules and hosting

**Files**: none — commands.

**Intent**: Rules first, then hosting, so the store is never reachable by a client whose rules have
not shipped — the ordering `F-01` used when it created the database.

**Contract**: `npx firebase deploy --only firestore:rules`, then
`npx firebase deploy --only hosting`. Record the hosting version id from the CLI output; rollback is
`firebase hosting:versions:clone` and takes under a minute (`infrastructure.md:101`). Firestore data
is **not** covered by a hosting rollback.

#### 4. App Check: observe, then enforce

**Files**: none — Firebase Console.

**Intent**: Enforcement has been unowned since `F-01` (roadmap OQ#6) because it needs a deployed
client. There is now one.

**Contract**: With the live app deployed, sign in and use it so real attestations flow, then check
App Check → Firestore in the Console for a verified-request ratio near 100% before switching
enforcement on. Enforcing first would lock out every legitimate request if the reCAPTCHA key or the
domain is misconfigured. After enforcing, sign in again and save a template — a broken App Check
surfaces as `permission-denied` on the Firestore call, not as a sign-in failure.

#### 5. Post-deploy verification against production

**Files**: none — manual.

**Intent**: The store now holds real teacher data and dev/prod share one project. This is the last
moment where a wrong rule is cheap to discover.

**Contract**: With a second seeded account, confirm one teacher cannot see the other's templates
through the live app. The rules spec proves the store enforces it; this confirms the client asks the
question the way the rule expects.

### Success Criteria:

#### Automated Verification:

- `npm run build` succeeds and `dist/browser/index.html` exists
- `npx firebase deploy --only firestore:rules` succeeds
- `npx firebase deploy --only hosting` reports a non-zero file count from `dist/browser`
- `npm run test:rules` passed before the deploy (re-run if any rule changed since Phase 1)

#### Manual Verification:

- `https://britannia-reports.web.app` loads the sign-in screen for a signed-out visitor
- A seeded account signs in, reaches the shell, and all four report tabs render
- Saving, listing, applying and deleting a template works against production Firestore
- A downloaded PDF from the live app matches the Phase 4 comparison
- A second seeded account sees only its own templates
- App Check shows verified requests before enforcement is enabled, and the app still works after
- PL/EN switching works on the live sign-in screen and inside the panel

**Implementation Note**: this phase is the one to cut if the schedule runs out — see Open Risks.
Everything before it is a complete, merged, verified change.

---

## Testing Strategy

### Unit Tests (Karma + Jasmine, in the browser):

- `TemplatesService`: name normalization and every rejection reason; `isEmpty` across defaults and
  single-field-set states; `diff` classifying overwrite / clear / untouched; gateway rejections
  arriving as mapped results
- `TemplatePanelComponent`: empty state; invalid name never reaching the service; empty-template apply
  emitting nothing; dialog gating both apply and delete; snackbar on failure
- `ConfirmDialogComponent`: returns the boolean, renders translated content, renders an item list when
  given one
- `SessionService` / guards: `uid` carried through the authorized state
- `SemestrReportComponent`: the existing 48-control and 14-array contract, unchanged, plus the new
  exhaustive-partition assertion
- Fakes must model the unobliging cases — a `getDocs` that rejects, a `create` rejected with
  `permission-denied`. `infrastructure.md:155` records that this is where `S-01`'s three
  browser-only defects lived.

### Rules Tests (`npm run test:rules`, Node + emulator):

- Teacher A reads, creates and deletes under their own `uid`
- Teacher B is denied read, create and delete against A's document
- An unauthenticated caller is denied everything
- An update to an existing document is denied, including for the owner — the write-once invariant

### PDF Fidelity:

Per `docs/pdf-fidelity-check.md`, for the trimester/semester report only (the other three are not
reachable by this change). Committed references are the "before" side. Outcome recorded under
`## Progress` in the §8 format.

### Manual Testing Steps:

1. Start the emulators, seed one `allowedUsers` document, sign in locally
2. Fill only the ten cohort fields, save as "Klasa 5 semestr"
3. Reload, apply the template — confirm the ten fields fill and the other 38 controls are untouched
4. Fill `course` by hand, apply again — the dialog must list `course` as overwritten
5. Fill `realizedMaterial` by hand and apply a template whose `realizedMaterial` is empty — the
   dialog must list it as **cleared**, and confirming must clear it
6. Save one template per book option (list / own title / own materials) and apply each — the correct
   field must be **visible** every time
7. Apply a template carrying a date; check the datepicker display and the PDF date
8. Save a template with all defaults; applying it must do nothing and show no dialog
9. Attempt a duplicate name in different case; expect the rejection message
10. Delete a template through the dialog
11. Toggle PL/EN with the panel open and the dialog open
12. Generate a PDF from a templated report and from an identically hand-typed one and compare

## Performance Considerations

Reads are one-shot `getDocs` per panel load, not a live listener — the Spark-quota concern
`allowlist.gateway.ts:26-30` and `infrastructure.md:115` both name. Template counts per teacher are
in single digits, so the list is loaded once and reused for the duplicate-name check rather than
issuing a query per save. Nothing in this change adds work to the `pdfmake` path.

## Migration Notes

No data migration: the collection is new and PRD `## Constraints & Compatibility` records that the
system has no historical data. Forward compatibility is handled in code — `schemaVersion: 1` plus a
code-side `TEMPLATE_DOMAIN` means templates saved today survive `S-04` widening the domain, with any
key the document lacks treated as that key's default.

Rollback: hosting rolls back in under a minute via
`firebase hosting:versions:clone`; Firestore documents do not roll back with it. A rules rollback is
a redeploy of the previous `firestore.rules`.

## References

- Roadmap slice: `context/foundation/roadmap.md` → S-02
- PRD: `context/foundation/prd.md` → US-01, FR-009…FR-012, FR-014, FR-018
- Emulator/harness obligation: `context/foundation/infrastructure.md` → Getting Started step 4, risk
  register rows on over-permissive rules and shared dev/prod project
- Rules guidance written for this slice: `firestore.rules:42-105`
- Prior Firebase seam to mirror: `src/app/auth/session.service.ts`, `auth.gateway.ts`,
  `allowlist.gateway.ts`
- PDF fidelity procedure: `docs/pdf-fidelity-check.md`
- Design language and shared form wrappers: `docs/design-language.md`, `src/CLAUDE.md:94-109`
- Frozen form contract: `src/app/semestr-report/semestr-report.component.spec.ts:52-163`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename
> step titles. See `references/progress-format.md`.

### Phase 1: Emulator suite, rules harness, and the per-teacher rule

#### Automated

- [x] 1.1 `java -version` reports a JDK ≥ 11 — f0c08c5
- [x] 1.2 `npx firebase emulators:start` boots Firestore and Auth without error — f0c08c5
- [x] 1.3 `npm run test:rules` passes all four scenarios — f0c08c5
- [x] 1.4 `npm run lint` exits 0 — f0c08c5
- [x] 1.5 `npm test -- --watch=false --browsers=ChromeHeadless` stays green — f0c08c5
- [x] 1.6 `npm run build` type-checks — f0c08c5
- [x] 1.7 `npm run build -- --configuration development` type-checks — f0c08c5

#### Manual

- [x] 1.8 With `useEmulators: true`, `npm start` reaches sign-in with no Firebase console errors — f0c08c5
- [x] 1.9 Signing in against the Auth emulator with a seeded allowlist document reaches the shell — f0c08c5
- [x] 1.10 A non-seeded address still shows the existing "no access" message — f0c08c5
- [x] 1.11 Restarting the emulators preserves the seeded allowlist document — f0c08c5

### Phase 2: Session `uid` and the template data layer

#### Automated

- [x] 2.1 `npm test -- --watch=false --browsers=ChromeHeadless` green, including the service spec — 8a822b2
- [x] 2.2 Session specs assert `uid` is carried through the authorized state — 8a822b2
- [x] 2.3 `npm run lint` exits 0 — 8a822b2
- [x] 2.4 `npm run build` type-checks — 8a822b2
- [x] 2.5 `npm run build -- --configuration development` type-checks — 8a822b2

#### Manual

- [x] 2.6 The session's `uid` matches the Auth emulator's user id — 8a822b2

### Phase 3: Template panel, confirmation dialog, snackbar, and translations

#### Automated

- [x] 3.1 `npm test -- --watch=false --browsers=ChromeHeadless` green, including both new specs — f386745
- [x] 3.2 `pl.json` and `en.json` key parity verified — f386745
- [x] 3.3 `npm run lint` exits 0 — f386745
- [x] 3.4 `npm run build` type-checks — f386745
- [x] 3.5 `npm run build -- --configuration development` type-checks — f386745

#### Manual

- [x] 3.6 All four report tabs are visually and behaviourally unchanged (panel not yet mounted) — f386745

### Phase 4: Wire the panel into the trimester/semester report

#### Automated

- [x] 4.1 `npm test -- --watch=false --browsers=ChromeHeadless` green, both semestr smoke fixtures included
- [x] 4.2 The form-model contract spec still asserts the original 48 control names and 14 arrays
- [x] 4.3 The exhaustive-partition assertion passes (10 + 4 + 12 + 22 = 48, pairwise disjoint)
- [x] 4.4 `npm run test:rules` still passes
- [x] 4.5 `npm run lint` exits 0
- [x] 4.6 `npm run build` type-checks
- [x] 4.7 `npm run build -- --configuration development` type-checks

#### Manual

- [x] 4.8 Save a template from the cohort fields and see it listed
- [x] 4.9 Apply fills the ten domain fields and leaves the other 38 controls untouched
- [x] 4.10 Apply over non-empty fields lists overwritten *and* cleared fields; cancel is a no-op
- [x] 4.11 All three book options round-trip with the correct field **visible**
- [x] 4.12 A template with a date round-trips in the datepicker and in the PDF
- [x] 4.13 An all-defaults template applies as a no-op with no dialog
- [x] 4.14 A duplicate name in different case is rejected with a clear message
- [x] 4.15 Delete works through the dialog
- [x] 4.16 PL/EN switching works in the panel and in the dialog
- [x] 4.17 PDF-fidelity comparison recorded for both semestr fixtures

#### PDF fidelity check

- Date: 2026-07-30
- Report types compared: trimester/semester (both fixtures)
- Before: committed references at `docs/pdf-fidelity/reference/semestr-{minimal,maximal}.pdf`
- Verdict: no visible differences
- Supporting signal (§7): identical file sizes (43 865 / 47 850 bytes), and every byte `cmp -l`
  reports as differing sits in the two non-deterministic regions — the `/CreationDate` string and the
  trailer `/ID`. Content streams are byte-identical.
- Note for the next run: `docs/pdf-fidelity/captured/` held artifacts from a previous capture, so
  Chrome wrote the new run as `<fixture> (1).pdf` and the first comparison silently used the stale
  files. Caught on the timestamps and redone. `docs/pdf-fidelity-check.md` does not warn about this —
  see Phase 5.

### Phase 5: Documentation sync

#### Automated

- [ ] 5.1 `npm run lint` exits 0
- [ ] 5.2 `npm test -- --watch=false --browsers=ChromeHeadless` still green

#### Manual

- [ ] 5.3 No sentence in `src/CLAUDE.md` contradicts the repo (emulator suite, single-command start)
- [ ] 5.4 A newcomer can start emulators, seed the allowlist and sign in using `src/CLAUDE.md` alone
- [ ] 5.5 Roadmap, PRD and `infrastructure.md` agree on whether the harness exists

### Phase 6: Deploy to live and enable App Check enforcement

#### Automated

- [ ] 6.1 `npm run build` succeeds and `dist/browser/index.html` exists
- [ ] 6.2 `npx firebase deploy --only firestore:rules` succeeds
- [ ] 6.3 `npx firebase deploy --only hosting` reports a non-zero file count from `dist/browser`
- [ ] 6.4 `npm run test:rules` passed before the deploy

#### Manual

- [ ] 6.5 The live URL loads the sign-in screen for a signed-out visitor
- [ ] 6.6 A seeded account signs in and all four report tabs render
- [ ] 6.7 Save / list / apply / delete works against production Firestore
- [ ] 6.8 A live-app PDF matches the Phase 4 comparison
- [ ] 6.9 A second seeded account sees only its own templates
- [ ] 6.10 App Check shows verified requests, then enforcement is enabled and the app still works
- [ ] 6.11 PL/EN switching works on the live sign-in screen and in the panel
