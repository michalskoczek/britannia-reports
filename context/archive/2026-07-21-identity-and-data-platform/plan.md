# Identity and Data Platform (F-01) Implementation Plan

## Overview

Provision the Firebase identity and persistence platform that every subsequent slice depends on: enable the Google sign-in provider, create a Firestore database in `eur3`, register App Check in monitoring mode, and wire all three into the app's standalone provider config — with security rules that deny everything by default.

This is roadmap item **F-01**, a foundation. It ships no user-visible behavior. Its entire value is that `S-01` (sign-in gate), `S-02` (templates), and `S-03` (roster) each find an identity provider to call and a store to persist into, already locked to a region and closed to all access.

## Current State Analysis

Verified against the live tree on 2026-07-21, not inherited from the roadmap's 2026-07-10 snapshot:

- **Firestore does not exist.** `npx firebase firestore:databases:list` returns `No databases found` (exit 0, CLI authenticated against project `britannia-reports`). The `eur3` region is a *recorded decision*, not an executed one.
- **Google auth provider is not enabled.** There is no CLI verb for enabling sign-in providers — this is a manual Firebase Console step.
- **No persistence dependency exists.** `package.json` has neither `firebase` nor `@angular/fire`. `provideHttpClient()` serves the ngx-translate loader, nothing else.
- **`src/app/app.config.ts:25-41` is the only global provider surface.** It wires `provideHttpClient()`, `provideTranslateService(...)`, `LOCALE_ID`, `MAT_DATE_LOCALE`, `MAT_FORM_FIELD_DEFAULT_OPTIONS`, and `provideMomentDateAdapter(MY_FORMATS)`. There is no `AppModule` anywhere — `@angular/fire`'s standalone idioms match this codebase exactly.
- **There is no `src/environments/` folder and no `fileReplacements` in `angular.json`.** This change introduces both as a new build convention.
- **`firebase.json` has no `firestore` key and no `emulators` block** — only `hosting` (`public: dist/browser`, SPA rewrite).
- **`@angular/router@20.3.21` is already a dependency but entirely unused.** No `provideRouter`, no routes, no guards. The navigation surface belongs to `S-01`, not here.

### Key Discoveries

- **`appConfig` is imported by exactly one file** — `src/main.ts:3`. None of the five existing spec files (`date`, `form-wrapper`, `input-text`, `select`, `teddy-eddie-form`) reference it; they configure their own `TestBed` imports. Adding Firebase providers therefore **cannot** break the existing Karma suite. This removes the largest regression risk a global-provider change normally carries.
- **Production budgets are generous** — `angular.json:77-82` sets initial `maximumWarning: 5mb` / `maximumError: 10mb`. The base64 banner blobs in `src/app/shared/baner-base64.ts` already dominate the bundle, so the Firebase SDK's weight is a non-issue.
- **`firebase.json:3` `public: "dist/browser"` is correct and must not be "fixed"** — it is coupled to `angular.json:43-45` `outputPath.base: "dist"`, with `browser` appended by `@angular/build:application`. `src/CLAUDE.md:68` and `infrastructure.md:78` both record that an earlier document revision got this backwards and that acting on it would have shipped an empty deploy over the live site.
- **`@firebase/rules-unit-testing` is Node-only, and this project is pinned to Karma + Jasmine (browser)** — `src/CLAUDE.md:52` forbids introducing new runners during routine work. Rules tests cannot run under Karma. This conflict is why the rules-testing harness is deferred (see "What We're NOT Doing").
- **The roadmap contradicts itself on the allowlist** — F-01's Unlocks line promises `S-01` "an allowlist to read," while its Outcome says "No collections, no schemas." Resolved in favor of the Outcome: no collections ship here.

## Desired End State

When this plan is complete:

1. A Firestore database exists in the `britannia-reports` project, located in `eur3` (Europe multi-region), containing zero collections and zero documents.
2. `firestore.rules` is deployed to that database and denies every read and write to every path, for every caller — authenticated or not.
3. The Google sign-in provider is enabled in Firebase Console, with `britannia-reports.web.app` and `localhost` authorized. Preview-channel domains are **not** authorized here — see Phase 2 Change 3 for why that is `S-01`'s to handle.
4. App Check is registered with a reCAPTCHA v3 provider in **monitoring (unenforced)** mode.
5. `npm run build`, `npm run lint`, and `npm test` all pass, and the app boots at `localhost:4200` with Firebase providers initialized and no console errors.
6. `infrastructure.md` and `src/CLAUDE.md` describe the world as it now is.

**How to verify:** `firebase firestore:databases:list` shows one database with `locationId: eur3`; the Firebase Console shows the Google provider enabled and App Check registered as unenforced; the app boots clean; the build, lint, and test commands exit 0.

## What We're NOT Doing

Deliberately out of scope, each with the decision that put it there:

- **No collections, no schemas, no queries.** Including the FR-003 teacher allowlist — `S-01` introduces it when it first reads one. The roadmap's own scope-discipline warning applies: every collection is introduced by the slice that uses it.
- **No rules-testing harness.** `infrastructure.md:127` recommends adopting `@firebase/rules-unit-testing` before the first Firestore deploy, and that recommendation is *deferred, not rejected* — see "Open Risks" and the handoff note to `S-01`. It is defensible here only because the deployed rules are an unconditional deny-all whose correctness is legible in four lines. It stops being defensible the moment a conditional rule appears.

- **No emulator suite.** No `emulators` block in `firebase.json`, no `connect*Emulator` calls, no `useEmulators` flag. F-01 ships zero collections, deny-all rules, and no code that reads or writes Firestore or Auth — there is no local traffic for an emulator to intercept, and `firebase deploy --only firestore:rules` already compiles the rules server-side. The suite's real costs (a JDK prerequisite, a two-command dev startup, emulator ports to keep in sync) buy nothing here. **`S-01` adopts it together with the rules-testing harness**, which is the first thing that genuinely requires it.
- **No auth session surface.** No user-state service, no signal, no observable, no guard, no sign-in UI. `provideAuth()` and nothing more. `S-01` owns the session contract.
- **No navigation layer.** No `provideRouter`, no routes. `S-01` decides between a router and a shell-level conditional.
- **No hosting redeploy.** F-01 changes nothing a user can see; only `firestore:rules` is deployed. Shipping the Firebase SDK to the live site with no feature using it is pure regression risk.
- **No App Check enforcement.** Registered and monitoring only; `S-01` flips enforcement once there is real traffic to observe.
- **No usage or quota alerts.** Deferred until a slice generates traffic.
- **No second Firebase project.** Dev and prod share `britannia-reports`.
- **No CI/CD.** Parked in the roadmap; unchanged here.

## Implementation Approach

Four phases, ordered so that the store is never reachable while unprotected.

The non-obvious ordering choice is that **`firestore.rules` is authored before the database is created**. The naive sequence — create the database, then write rules — leaves a live store sitting on default rules for however long the next phase takes. Writing the rules first means the deploy follows database creation within the same phase, seconds apart. Choosing **production mode** at creation closes the window entirely, since production-mode defaults are themselves deny-all; the explicit deploy then replaces a default we do not control with a committed artifact we do.

Phase 2 is isolated into its own phase because it is where infrastructure comes into existence and where the one-way region decision lands. Its Console steps (Google provider, App Check) cannot be automated at all; its CLI steps are non-interactive and can be, which keeps the irreversible region value in a reviewable command rather than an interactive prompt.

## Critical Implementation Details

**The `eur3` region is a one-way door.** A Firestore database's location cannot be changed after creation — correcting it means creating a new database and migrating data, and nothing in the tooling warns you. This plan passes the region as an explicit `--location=eur3` flag rather than answering an interactive prompt, specifically so the irreversible value is reviewable in the command itself instead of typed under pressure. `eur3` is Europe multi-region — not `europe-west1`, not any single-region option, and not a default.

**App Check will block local development unless a debug token is registered first.** In the browser, `initializeAppCheck` with a reCAPTCHA provider fails on `localhost` because there is no verifiable app attestation. The escape hatch must be set on `self` *before* `initializeAppCheck` runs, and the token it prints to the console must then be registered in Firebase Console under App Check → Apps → Manage debug tokens. This is per-machine and per-browser-profile:

```typescript
// must execute before initializeAppCheck(), dev only
(self as unknown as Record<string, unknown>)['FIREBASE_APPCHECK_DEBUG_TOKEN'] = true;
```

Because App Check ships in monitoring mode, a missing debug token degrades to noisy console warnings rather than broken requests — but the warnings are alarming and worth pre-empting.

**`angular.json` and `firebase.json` output paths are coupled.** This plan does not touch `outputPath` or `hosting.public`, and must not. If a future step ever changes one, it changes both in the same commit — `firebase deploy` publishes an empty directory over the live site and exits 0.

## Phase 1: Security Rules and Firebase Config Scaffolding

### Overview

Author the deny-all security rules and extend `firebase.json` to point at them. Entirely local — no infrastructure is provisioned and nothing is deployed in this phase.

### Changes Required

#### 1. Firestore security rules

**File**: `firestore.rules` (new, repo root)

**Intent**: Establish the locked-by-default posture the whole foundation exists to guarantee, and hand `S-01` the intended ownership pattern without shipping a live rule it could copy blindly.

**Contract**: `rules_version = '2'`, a `service cloud.firestore` block, and a single `match /databases/{database}/documents` containing `match /{document=**}` with `allow read, write: if false;`. Below it, a commented scaffold showing the per-collection ownership shape future slices will need — a `request.auth.uid == resource.data.<ownerField>` comparison — annotated to make clear it is illustrative and that the owner field name is `S-01`'s to choose.

The comment must carry an explicit warning: the pre-mortem in `infrastructure.md:72` describes a month-long cross-teacher data leak caused by a single field-name typo in exactly this kind of rule (`teacherUid` where the field was `teacherId`). Whoever uncomments this writes rules tests first.

#### 2. Firebase project configuration

**File**: `firebase.json`

**Intent**: Register the rules file so `firebase deploy --only firestore:rules` has a source.

**Contract**: Add a top-level `firestore` key with `rules: "firestore.rules"`. Leave the existing `hosting` block byte-for-byte unchanged.

**No `emulators` block ships here.** The emulator suite is deferred to `S-01` — see "What We're NOT Doing". F-01 has no code that reads or writes Firestore, zero collections, and deny-all rules, so there is no local traffic for an emulator to intercept. Its Java runtime prerequisite, its effect on the dev startup ritual, and its `firebase.json` surface all arrive with `S-01`, alongside the rules-testing harness that actually requires it.

### Success Criteria

#### Automated Verification

- `firebase.json` remains valid JSON and the `hosting` block is unchanged: `git diff firebase.json`
- Existing test suite still passes: `npm test -- --watch=false --browsers=ChromeHeadless`

Rules **syntax** is not verified in this phase. Nothing local can compile a rules file once the emulator is out of scope; `firebase deploy --only firestore:rules` in Phase 2 compiles them server-side and fails loudly on a parse error, which is the real gate.

#### Manual Verification

- The commented ownership scaffold in `firestore.rules` reads as clearly illustrative, not as live rule code

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 2: Infrastructure Provisioning (human-gated)

### Overview

Create the Firestore database, deploy the deny-all rules to it immediately, enable the Google sign-in provider, authorize domains, and register App Check in monitoring mode.

Steps 1, 2, and 5 are non-interactive CLI commands and may be executed by an agent. **Steps 3 and 4 are Firebase Console work that no agent can perform** — there is no CLI verb for enabling a sign-in provider or registering App Check. The phase still gates on a human, but only for those two steps.

### Changes Required

#### 1. Firestore database creation

**Action**: `npx firebase firestore:databases:create "(default)" --location=eur3`

**Intent**: Create the default Firestore database in the recorded region, with the region supplied as an explicit argument rather than answered at a prompt.

**Contract**: Run the command exactly as written. Verify eligibility first with `npx firebase firestore:locations` and confirm `eur3` appears — the region is one-way, see Critical Implementation Details.

**Do not use `npx firebase init firestore`.** An earlier revision of this plan called for it; that was wrong on two counts. It writes `firestore.indexes.json` and an `"indexes"` key into `firebase.json`, silently editing the file Phase 1 authored and adding an artifact no phase tracks. And it presents no "production mode vs test mode" choice — that prompt belongs to the Firebase Console creation flow, so an implementer looking for it stalls in the one phase where the next decision is irreversible. Verified against `firestore:databases:create --help` on firebase-tools@15 (2026-07-22): `--location` is a required flag and there is no mode flag, because a CLI-created database carries no seeded ruleset. Its posture comes entirely from the deploy in the next step, which is why that step follows immediately.

This command is non-interactive and touches no local file, so it — and the rules deploy below — may be executed by an agent. Only steps 3 and 4 of this phase require the Console.

#### 2. Deploy the deny-all rules

**Action**: `npx firebase deploy --only firestore:rules`

**Intent**: Replace the platform's default rules with the committed artifact, so the store's posture is version-controlled rather than inherited.

**Contract**: Runs immediately after database creation, in the same working session. Deploy output must name `firestore.rules` as the source and report success. This deploy is also the first and only compilation of the rules file — a syntax error surfaces here, not in Phase 1.

#### 3. Enable the Google sign-in provider

**Action**: Firebase Console → Authentication → Sign-in method

**Intent**: Give `S-01` an identity provider to call. No CLI verb exists for this.

**Contract**: Enable the **Google** provider. Under Authorized domains, confirm `britannia-reports.web.app` and `localhost` are present. Preview-channel URLs follow the pattern `britannia-reports--<channel>-<hash>.web.app` and are **not** covered by the base domain — sign-in fails on any preview channel until its specific domain is added, which is a trap `S-01` will hit if it is not recorded now.

#### 4. Register App Check in monitoring mode

**Action**: Firebase Console → App Check

**Intent**: Stand up the attestation infrastructure now, so `S-01` inherits a registered app and a site key rather than a Console setup step, and so no enforcement change ships against a deny-all store that cannot exercise it.

**Enforcement is not a single toggle, and this plan must not imply it is.** Turning enforcement on rejects any request that arrives without an attestation token — including the app's own, unless a client wired with `provideAppCheck` is actually deployed. F-01 does no hosting redeploy (see "What We're NOT Doing"), so the live site carries no App Check client regardless of what this repo contains. `S-01` owns the *sequence*: deploy a wired client first, confirm tokens appear in monitoring, only then enforce.

**Contract**: Register the existing web app (App ID `1:1039458477078:web:90de33b8569b522a060137`) with a **reCAPTCHA v3** provider. Leave Firestore enforcement **off** — monitoring only. Record the reCAPTCHA site key; Phase 3 needs it. The site key is not a secret.

#### 5. Capture the Firebase SDK config

**Action**: `npx firebase apps:sdkconfig WEB 1:1039458477078:web:90de33b8569b522a060137`

**Intent**: Obtain the config values Phase 3 writes into the environment files.

**Contract**: Yields `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`. These are **not secrets** — they ship inside the SPA bundle and are visible to every visitor. Firestore security rules, not key secrecy, protect the data (`infrastructure.md:24`).

### Success Criteria

#### Automated Verification

- Database exists in the correct region: `npx firebase firestore:databases:list` reports one database with `locationId: eur3`
- Rules deploy completes successfully: `npx firebase deploy --only firestore:rules`

#### Manual Verification

- Firebase Console → Firestore → Rules shows the deny-all rule as the live ruleset
- Firebase Console → Authentication → Sign-in method shows Google as Enabled
- Authorized domains include `britannia-reports.web.app` and `localhost`
- Firebase Console → App Check shows the web app registered with reCAPTCHA v3 and Firestore enforcement **off**
- The reCAPTCHA site key and the six SDK config values are captured and ready for Phase 3
- Firestore data browser shows zero collections

**Implementation Note**: Steps 3 and 4 are human-executed in the Console; steps 1, 2, and 5 are agent-runnable CLI commands. Confirm every item above before proceeding — Phase 3 hardcodes values captured here, and the `eur3` choice cannot be revisited.

---

## Phase 3: Environments Scaffold and SDK Wiring

### Overview

Introduce the `src/environments/` convention with build-time file replacement, install the Firebase SDK, and wire App, Auth, Firestore, and App Check into the standalone provider config.

### Changes Required

#### 1. Firebase SDK dependencies

**File**: `package.json`

**Intent**: Add the Angular-idiomatic Firebase bindings and the underlying SDK.

**Contract**: `npm install @angular/fire@^20 firebase`. `@angular/fire@20` is the line that matches `@angular/core@20.3.x`; per `src/CLAUDE.md:56` the Angular set moves as a unit, so do not let this install walk any `@angular/*` package. Verify `package.json` shows no `@angular/*` version drift after installing.

#### 2. Environment files

**Files**: `src/environments/environment.model.ts` (new), `src/environments/environment.ts` (new), `src/environments/environment.prod.ts` (new)

**Intent**: Give the app a build-time seam for configuration. Because dev and prod share one Firebase project, the `firebaseConfig` values are identical in both files — today the only difference is the `production` flag. The seam is established now so `S-01` has somewhere to put the first value that genuinely differs.

**Contract**: Both export a const named `environment` with an identical shape: `production: boolean`, `firebase: { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId }`, and `recaptchaSiteKey: string`.

`environment.ts` sets `production: false`; `environment.prod.ts` sets `production: true`. Both carry the Phase 2 values verbatim. A short header comment on each should state that these values are public by design and are not secrets, so no future contributor "fixes" them into a secret store.

**The shared interface lives in a third file.** Create `src/environments/environment.model.ts` exporting `export interface Environment { ... }`, and have both environment files declare `export const environment: Environment = { ... }`. The interface must **not** be exported from `environment.ts` and imported by `environment.prod.ts`: under `fileReplacements` the prod file *becomes* `environment.ts`, so that import resolves to the module itself. A third, never-replaced file is the only arrangement that gives the two files a compile-time shared contract — and file replacement otherwise gives no guarantee at all that the replacement satisfies the original's shape.

#### 3. Build-time file replacement

**File**: `angular.json`

**Intent**: Swap the environment file in production builds.

**Contract**: Add a `fileReplacements` array to `projects.britannia-reports.architect.build.configurations.production`, replacing `src/environments/environment.ts` with `src/environments/environment.prod.ts`. Do not touch `outputPath`, `budgets`, `styles`, or `scripts`.

#### 4. Global provider wiring

**File**: `src/app/app.config.ts`

**Intent**: Initialize Firebase App, Auth, Firestore, and App Check inside the existing standalone provider array.

**Contract**: Append to the existing `appConfig.providers` array — do not restructure what is there. Four providers, each a bare factory: `provideFirebaseApp(() => initializeApp(environment.firebase))`, `provideAppCheck(...)`, `provideAuth(() => getAuth())`, `provideFirestore(() => getFirestore())`.

**No emulator connection.** No `connectAuthEmulator`, no `connectFirestoreEmulator`, no branch on an emulator flag — the suite is deferred to `S-01` and there is no Firestore or Auth traffic in F-01 to route anywhere. `npm start` therefore stays a single command.

`provideAppCheck` uses `ReCaptchaV3Provider(environment.recaptchaSiteKey)` with `isTokenAutoRefreshEnabled: true`, and must be preceded by the debug-token assignment shown in Critical Implementation Details when `!environment.production`.

Ordering matters: `provideFirebaseApp` must come first, and the App Check debug-token assignment must execute before `initializeAppCheck`. **Do not introduce an `AppModule`** — `infrastructure.md:102` flags agent-generated NgModule scaffolding as a known failure mode here, and `src/CLAUDE.md:30` pins standalone-only.

### Success Criteria

#### Automated Verification

- Production build succeeds with file replacement applied: `npm run build`
- Build output exists: `ls dist/browser/index.html`
- Development build type-checks `environment.ts`: `npm run build -- --configuration development`
- Lint passes clean: `npm run lint`
- Existing test suite passes unchanged: `npm test -- --watch=false --browsers=ChromeHeadless`
- No `@angular/*` version drift introduced by the install: `git diff package.json`

The development build is a separate criterion because `angular.json:98` sets `defaultConfiguration: "production"` — so a plain `npm run build` applies `fileReplacements` and compiles `environment.prod.ts` **only**. With `tsconfig.app.json` using `files: ["src/main.ts"]`, nothing else pulls `environment.ts` into a type-check, and an error in it would otherwise survive every automated gate in this phase.

#### Manual Verification

These run in order — the first two are a sequence, not two independent checks:

- The App Check debug token printed on the **first** dev boot is registered in Firebase Console
- **After** that registration, `npm start` boots the app at `localhost:4200` with no Firebase-related console errors
- The four report tabs still render and still produce PDFs identical to before the change (PDF fidelity guardrail, `src/CLAUDE.md:7`)
- Language switching (PL/EN) still works on every existing screen

**Implementation Note**: The PDF fidelity check is not optional ceremony — it is the project's hardest guardrail. Generate a PDF from one report type before and after this phase with identical inputs and compare visually. Pause for manual confirmation before proceeding.

**On the first two steps**: the debug token does not exist until a boot prints it, so the first `npm start` of this phase **will** emit App Check warnings — that is expected, not a failure. Register the printed token, then restart and verify the clean boot. Do not treat the first boot's warnings as a regression, and do not attempt the clean-boot check before the token is registered.

---

## Phase 4: Documentation Sync

### Overview

Bring the load-bearing project documents into agreement with the world this change created. `infrastructure.md` currently asserts that Firestore does not exist and the Google provider is disabled — after Phase 2, that is false, and it is the document future agents read first.

### Changes Required

#### 1. Infrastructure state record

**File**: `context/foundation/infrastructure.md`

**Intent**: Correct the "Current State (verified)" section so it stops contradicting reality, and record the executed region choice.

**Contract**: Update the Firestore bullet (`:21-22`) from "not created / decision recorded (not yet executed)" to created, with the `eur3` location confirmed and the verification date. Update the Auth bullet (`:23`) to reflect the enabled Google provider and the authorized domains. Add a short App Check note recording monitoring mode and that enforcement is `S-01`'s to enable. In "Getting Started," mark steps 1–3 as executed; leave step 4 (rules-testing harness) standing as the open recommendation it now formally is.

#### 2. Project conventions

**File**: `src/CLAUDE.md`

**Intent**: Record the new build convention. This file is the contract future agents read before touching the codebase, and this change introduces a mechanic the project deliberately did not have.

**Contract**: Under "Architecture," extend the "Global providers live in `app.config.ts`" paragraph to name the four Firebase providers and the standalone-only constraint that governs them. Add a short entry documenting `src/environments/`: what the three files hold, that the Firebase config values are public by design, that `fileReplacements` swaps `environment.ts` for `environment.prod.ts` in production builds, and that `environment.model.ts` is the shared shape contract and must never be merged into either replaced file. Record that `npm run build` type-checks only the prod file, so `npm run build -- --configuration development` is the check for the dev one.

Do **not** add emulator commands — the suite is not part of this change.

**Scope note (added post-implementation, 2026-07-23).** Phase 4 shipped two edits beyond the three contracted above, both to keep the documents internally consistent rather than to add new material:

- `infrastructure.md` **risk register** — the `eur3` row still prescribed `firebase init firestore`, the exact command this plan warns against; it was closed. The rules-leak row was restated as the top risk carried into `S-01`, and two rows were added (shared dev/prod project; unproven `localhost` attestation) for risks the plan's Open Risks already named but the register did not carry.
- `src/CLAUDE.md` — a paragraph recording that no emulator suite exists and that local development therefore reads and writes the production Firebase project.

Recorded as a recurring rule in `context/foundation/lessons.md` → "Updating a document includes the sections the new content contradicts."

#### 3. Change identity

**File**: `context/changes/identity-and-data-platform/change.md`

**Intent**: Reflect lifecycle state.

**Contract**: Set `status` and refresh `updated` to the current date.

### Success Criteria

#### Automated Verification

- No stale claims remain that Firestore is absent: `grep -n "not created\|No databases found\|not enabled" context/foundation/infrastructure.md`
- Lint still passes: `npm run lint`

#### Manual Verification

- `infrastructure.md` "Current State" reads accurately against `firebase firestore:databases:list` output
- `src/CLAUDE.md` describes the environments convention clearly enough that a fresh agent would not reinvent or remove it
- The deferred emulator suite and rules-testing harness are visible as an explicit `S-01` prerequisite, not buried

---

## Testing Strategy

### Automated Tests

No new automated tests ship in this change, and that is a deliberate, recorded decision rather than an omission:

- **Rules tests** require `@firebase/rules-unit-testing`, which is Node-only, while this project is pinned to Karma + Jasmine in the browser (`src/CLAUDE.md:52`). Adding a second runner is explicit future work, and it belongs with the first conditional rule — which is `S-01`, not here.
- **Provider wiring** has no meaningful unit surface. `appConfig` is consumed only by `src/main.ts:3`; asserting that an array contains providers tests the framework, not this change.

The existing five spec files must continue to pass unchanged. They do not import `appConfig`, so a regression there would signal something genuinely unexpected.

### Manual Testing Steps

1. Run `npm start`. The first boot emits App Check warnings because no debug token exists yet — expected. Copy the token it prints and register it in Firebase Console under App Check → Apps → Manage debug tokens.
2. Restart `npm start`; confirm the app now boots with no Firebase console errors.
3. Open each of the four report tabs; confirm they render and behave as before.
4. Generate a PDF from one report type with inputs recorded before this change; compare visually against the pre-change PDF.
5. Toggle PL/EN on an existing screen; confirm translation still works.
6. Run `npm run build`; confirm it succeeds and `dist/browser/index.html` exists.
7. In Firebase Console, confirm: Firestore in `eur3` with zero collections, deny-all as the live ruleset, Google provider enabled, App Check registered and unenforced.

## Performance Considerations

The Firebase SDK adds meaningfully to the initial bundle, but production budgets are `5mb` warning / `10mb` error (`angular.json:77-82`) and the base64 image blobs already dominate. No budget pressure is expected; the `npm run build` success criterion in Phase 3 would surface it if wrong.

Spark plan daily quotas (50K reads / 20K writes) are irrelevant in this change — no code reads or writes. The quota risk arrives with `S-02`'s listeners, where `src/CLAUDE.md:64`'s subscription-cleanup convention becomes load-bearing.

## Migration Notes

**None.** The PRD records this explicitly (`## Constraints & Compatibility` → Data migration): the existing system has no backend persistence, so there is no historical data to backfill and no prior state to roll back.

**Rollback for this change is code-only.** Reverting the commits removes the providers, environment files, and rules from the app; the Firestore database and console settings stay. An empty database under deny-all rules is inert and costs nothing, and deleting it would not undo the `eur3` decision — that region choice is one-way regardless. The tradeoff accepted here is that the console would briefly hold state the repo does not describe.

## References

- Roadmap item: `context/foundation/roadmap.md` → F-01 (`## Foundations`)
- Platform decision, risk register, pre-mortem: `context/foundation/infrastructure.md`
- Requirements: `context/foundation/prd.md` → FR-001, FR-002, `## Access Control Changes`, Open Question #3
- Project conventions and hard guardrails: `src/CLAUDE.md`
- Provider surface this change extends: `src/app/app.config.ts:25-41`

## Open Risks & Assumptions

- **The rules-testing harness and the emulator suite are both deferred, and they arrive together.** `infrastructure.md:127` and its risk register call for `@firebase/rules-unit-testing` before the first Firestore deploy, and the pre-mortem (`infrastructure.md:72`) describes a month-long cross-teacher data leak from a single field-name typo. Deferral is defensible only while the rules are an unconditional deny-all. **`S-01` must stand up the emulator suite and the harness before it writes its first conditional rule** — one hard prerequisite, not two nice-to-haves. Budget the emulator's setup cost there: it needs a JDK (verified absent on the current machine as of 2026-07-22), an `emulators` block in `firebase.json`, a `useEmulators` flag in the environment shape, and `connect*Emulator` calls in `app.config.ts`.
- **Dev and prod share one Firebase project.** Harmless in F-01 (no data, deny-all, no code that touches the store), but from `S-01`'s first collection onward, development reads and writes the same store as production. The emulator is the mitigation and it does not exist yet — which is why `S-01` must adopt it before, not after, its first Firestore call.
- **App Check runs unenforced.** Between F-01 and `S-01`, App Check protects nothing. `S-01` owns flipping enforcement.
- **No usage or quota alerts are configured.** Accepted while traffic is zero; revisit when `S-02` introduces listeners.
- **`eur3` is irreversible.** Recorded in `infrastructure.md` and confirmed here. If Phase 2 selects any other location, the correct response is to stop and create a new database, not to proceed.
- **The App Check debug token is per-machine.** Any additional developer or browser profile hits console warnings until they register their own token.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Security Rules and Firebase Config Scaffolding

#### Automated

- [x] 1.2 `firebase.json` remains valid JSON and the `hosting` block is unchanged — 0afe6ce
- [x] 1.3 Existing test suite still passes — 0afe6ce

#### Manual

- [x] 1.5 Commented ownership scaffold reads as illustrative, not live rule code — 0afe6ce

### Phase 2: Infrastructure Provisioning (human-gated)

#### Automated

- [x] 2.1 Database exists with `locationId: eur3` — 110979d
- [x] 2.2 Rules deploy completes successfully — 110979d

#### Manual

- [x] 2.3 Console shows deny-all as the live ruleset — 110979d
- [x] 2.4 Google sign-in provider enabled — 110979d
- [x] 2.5 Authorized domains include production and localhost — 110979d
- [x] 2.6 App Check registered with reCAPTCHA v3, Firestore enforcement off — 110979d
- [x] 2.7 reCAPTCHA site key and six SDK config values captured — 110979d
- [x] 2.8 Firestore data browser shows zero collections — 110979d

### Phase 3: Environments Scaffold and SDK Wiring

#### Automated

- [x] 3.1 Production build succeeds with file replacement applied — 0bb8c75
- [x] 3.2 Build output `dist/browser/index.html` exists — 0bb8c75
- [x] 3.3 Lint passes clean — 0bb8c75
- [x] 3.4 Existing test suite passes unchanged — 0bb8c75
- [x] 3.5 No `@angular/*` version drift introduced by the install — 0bb8c75
- [x] 3.11 Development build type-checks `environment.ts` — 0bb8c75

#### Manual

- [x] 3.9 App Check debug token registered in Firebase Console — N/A at F-01: `@angular/fire` registers its providers lazily and nothing in `src/` injects them, so App Check never initializes and no token is ever generated or printed. Not "done" and not "not applicable" — untestable at this slice. First testable in `S-01`, on its first real Firestore/Auth call — 0bb8c75
- [x] 3.6 App boots at `localhost:4200` with no Firebase console errors — 0bb8c75
- [x] 3.7 Four report tabs render and PDF output is visually unchanged — 0bb8c75
- [x] 3.10 PL/EN switching still works on existing screens — 0bb8c75

### Phase 4: Documentation Sync

#### Automated

- [x] 4.1 No stale claims remain that Firestore is absent — d2ebf68
- [x] 4.2 Lint still passes — d2ebf68

#### Manual

- [x] 4.3 `infrastructure.md` Current State reads accurately against live CLI output — d2ebf68
- [x] 4.4 `src/CLAUDE.md` documents the environments convention clearly — d2ebf68
- [x] 4.5 Deferred emulator suite and rules-testing harness visible as an explicit `S-01` prerequisite — d2ebf68
