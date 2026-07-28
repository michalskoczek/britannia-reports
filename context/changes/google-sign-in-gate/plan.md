# Google Sign-in Gate (S-01) — Implementation Plan

## Overview

Turn Britannia Reports from a public tool into a signed-in one. A teacher signs in with Google, the app
checks their address against a developer-seeded allowlist in Firestore, and only then renders the four
existing report forms. Anyone else lands on a sign-in screen and cannot reach a form.

This is roadmap slice `S-01` (`context/foundation/roadmap.md`), covering FR-001 through FR-004 plus the
gating half of FR-014 and the preservation guardrails FR-015–FR-017 and FR-018.

## Current State Analysis

**The shell has no navigation layer.** `AppComponent` (`src/app/app.component.html:1-11`) renders
`app-header` plus `app-tab-group` plus an `*ngComponentOutlet` driven by `TabData.tabs`
(`src/app/shared/static-data/tab-data.ts:8`). There is no `provideRouter`, no `Routes`, and no guard
anywhere — though `@angular/router@~20.3.21` already sits in `dependencies` and `firebase.json` already
carries the SPA rewrite. Gating can therefore sit entirely above the report components: not one of the
four report templates needs to change.

**The Firebase platform exists but nothing uses it.** F-01 (`context/changes/identity-and-data-platform/`)
enabled the Google provider, created Firestore in `eur3`, registered App Check in monitoring mode, and
appended four `@angular/fire` providers to `appConfig.providers` (`src/app/app.config.ts:54-62`). Those
providers are **lazy** — `app.config.ts` is the only file in the tree importing `@angular/fire`, so
`initializeApp()` has never actually run. This change makes the first real Firebase call in the project's
history, which means it is also the first time any Firebase config value is proven correct.

**Firestore is live, empty, and denies everything.** `firestore.rules:13-15` is an unconditional deny-all
plus a long commented sketch of the per-collection ownership pattern. This change writes the first
conditional rule.

**The style layer is a published contract.** `docs/design-language.md` §2–§4 lists the tokens, pattern
mixins, and shared components a new surface composes; §6 records that `$britannia-red` was kept with no
consumer specifically because "`S-01` may want the brand red for sign-in error states"; §5 records that
the fifth copy of the elevation shadow in `tab-group.component.scss:15` is "S-01's to absorb when it
builds the sign-in surface".

**PDF fidelity is not triggered.** `docs/pdf-fidelity-check.md` §1 names four triggers — the pdfmake
builders, the base64 assets, the Cambridge helper, the pdfmake version. This change touches none of them,
so the capture procedure does not run. The existing Karma suite (four `*-report.component.spec.ts`) stays
as the smoke barrier proving each report type still mounts and renders.

## Desired End State

Opening the app shows a brief loading state, then either the sign-in screen or the familiar four-tab
report surface — never a flash of the wrong one. Signing in with an allowlisted Google account reaches the
tabs, with the account's address and a sign-out button in the header. Signing in with any other Google
account returns to the sign-in screen with a message saying the account has no access, and leaves no
Firebase session behind. The language toggle works on the sign-in screen and everywhere else. The four
report forms behave exactly as before and produce identical PDFs.

Verified by: `npm run lint`, `npm test -- --watch=false --browsers=ChromeHeadless`, `npm run build`, plus a
manual pass through the sign-in, denial, and sign-out flows on `localhost` and a spot-check of all four
report tabs.

### Key Discoveries

- `@angular/router@~20.3.21` is already installed and unused — no dependency change to introduce routing.
- `src/app/app.component.html:2` — the header must stay above the router outlet, not move into the shell,
  or the sign-in screen loses its language toggle and breaks FR-018 ("every screen — existing and new").
- `context/foundation/infrastructure.md:25` — `@angular/fire@20` registers its providers lazily, so "the
  app boots without Firebase errors" proves nothing until something injects `Auth` or `Firestore`.
- `context/foundation/infrastructure.md:27` — on `localhost`, `@angular/fire` forces App Check into debug
  mode; the first real call prints a debug token that must be registered by hand, per machine and browser
  profile.
- `context/foundation/infrastructure.md` risk register — leaky `onSnapshot` listeners against Spark's
  50K reads/day is a live risk; the allowlist check is therefore a one-shot `getDoc`, not a subscription.
- `docs/design-language.md` §4 — form surfaces compose `app-form-wrapper` / `app-button`, never a raw
  `mat-form-field`; the sign-in screen follows the same composition.
- `src/CLAUDE.md` — Karma + Jasmine is pinned; `translateTestingImports` must be spread into any spec
  rendering a translate-aware component.

## What We're NOT Doing

- **No emulator suite and no `@firebase/rules-unit-testing` harness.** Deliberately deferred to `S-02` /
  `S-03` — see "Open Risks & Assumptions" in the brief and Phase 5's documentation sync. This is a
  conscious override of `context/foundation/infrastructure.md` → Getting Started step 4, recorded rather
  than skipped.
- **No App Check enforcement.** The client ships wired; the console toggle stays off.
- **No hosting deploy.** Not to live, not to a preview channel. The public-URL regression waits on the
  director's cutover message (Open Roadmap Question #2). Verification is `localhost` only.
- **No collections beyond `allowedUsers`.** Students (`S-03`) and templates (`S-02`) are not introduced,
  designed, or pre-seeded here.
- **No changes inside the four report components**, their templates, their form models, or their pdfmake
  builders. Gating wraps them; it does not enter them.
- **No route per report type.** The tab registry stays the composition mechanism; routing is exactly two
  routes deep.
- **No in-app invite UI, no director-specific behaviour.** The `role` field is stored and read; nothing
  branches on it yet (FR-002's role scaffold).
- **No visual change to the three older report forms.** That is `S-05b`.

## Implementation Approach

Two routes, one guard, one collection. `AppComponent` keeps the header and gains a `router-outlet`;
today's tab surface moves verbatim into a new `ShellComponent` behind `authGuard`. A `SessionService`
composes two thin gateways over the Firebase SDK into a single state signal, and everything else — guard,
sign-in screen, header — reads that signal.

The gateway seam is what makes the testing decision meaningful. With the emulator deferred, unit tests are
the only automated barrier this change has; putting the raw SDK calls behind `AuthGateway` and
`AllowlistGateway` keeps all the decision logic in a class that a spec can drive with fakes, instead of
scattered across components that would need the SDK mocked.

Phases run data-layer first, then logic, then wiring, then appearance, then documents — so the sign-in
screen is never built against a rule that does not exist yet, and no phase leaves the app in a state where
a teacher can reach a form they should not.

## Critical Implementation Details

**Timing & lifecycle — the outlet stays in the DOM.** `authGuard` returns an observable that does not emit
until the session state leaves `resolving`, so the router simply holds the navigation pending and nothing
activates. The boot indicator must therefore be an overlay *alongside* `<router-outlet>`, not an `@if`
wrapped *around* it. Conditionally removing the outlet makes route activation depend on the outlet
registering after a pending navigation resolves — a subtle ordering that works until it doesn't. Render the
outlet unconditionally.

**State sequencing — the denial reason must outlive the sign-out that follows it.** When an allowlist
lookup comes back empty, the service calls `signOut()`, which immediately pushes the auth stream back to
`null` and would otherwise collapse the state to plain `anonymous`, discarding the reason the user was
rejected. Keep the denial in a separate signal that survives the sign-out and is cleared only when the next
sign-in attempt starts.

**Debug & observability — the first Firebase call is the first proof of anything.** Nothing in this project
has ever executed `initializeApp()`. On `localhost` the first `Auth` or `Firestore` injection puts App
Check into debug mode and logs a freshly generated debug token; register it via Firebase Console → App
Check → Apps → Manage debug tokens before assuming a failure is a code bug. A malformed `apiKey` or site
key surfaces here and nowhere earlier.

---

## Phase 1: Allowlist collection, rules, and seeding runbook

### Overview

Create the first real Firestore surface: a read-only, email-keyed allowlist, its security rule, a seeded
first account, and the written procedure for adding more. Nothing in the app reads it yet.

### Changes Required

#### 1. Security rules

**File**: `firestore.rules`

**Intent**: Open exactly one collection for reading by the one caller entitled to it — the signed-in user
whose verified Google address matches the document id — and keep writing closed to everybody, since FR-003
makes seeding a developer action performed in the console.

**Contract**: A new `match /allowedUsers/{email}` block inside
`match /databases/{database}/documents`, alongside (not replacing) the existing deny-all catch-all. The
document id is the lowercased Google address; the comparison is non-obvious enough to pin exactly:

```
match /allowedUsers/{email} {
  allow read: if request.auth != null
              && request.auth.token.email_verified == true
              && request.auth.token.email.lower() == email;
  allow write: if false;
}
```

`.lower()` on the token side is what makes the rule robust against a differently-cased address; the
runbook (below) is what keeps the stored id lowercase. `email_verified` is free hardening — Google
accounts always carry it.

#### 2. The illustrative comment block

**File**: `firestore.rules` (trailing comment, lines 20-65)

**Intent**: That block instructs whoever writes the first conditional rule to build a rules-testing harness
first. This change writes that rule and does not build the harness — leaving the instruction as-is would
make the file contradict what sits above it in the same file.

**Contract**: Rewrite the block to (a) record that `allowedUsers` is now live and what shape it took,
(b) state plainly that the harness was deferred and to which slice, and (c) keep the `teacherUid` /
`teacherId` typo warning intact and pointed at `S-02` / `S-03`, where per-teacher ownership rules and the
real leak risk arrive.

#### 3. Seeding runbook

**File**: `docs/teacher-allowlist-runbook.md` (new)

**Intent**: FR-003 makes console seeding the only onboarding path in the entire MVP. Written down once, it
stops living in one person's memory.

**Contract**: Collection name, document id convention (lowercased Google address, and why lowercase is
load-bearing given the rule), the `role` field and its two accepted values, the exact console click-path,
and how to verify the seed took (sign in as that account). Includes the removal path — deleting the
document revokes access at the next sign-in.

#### 4. Seed the first accounts

**File**: none — Firebase Console action

**Intent**: Nothing after Phase 1 can be tested without at least one allowlisted account.

**Contract**: `allowedUsers/<your-lowercased-google-address>` with `role: "teacher"`. Seed a second
document with `role: "director"` if a second Google account is available — otherwise flip the first
document's role temporarily during Phase 3's manual pass to confirm both values load.

### Success Criteria

#### Automated Verification

- Rules deploy cleanly: `npx firebase deploy --only firestore:rules`
- Rules compile without warnings in the deploy output

#### Manual Verification

- Firebase Console → Firestore → Rules shows the `allowedUsers` block live alongside the deny-all
- `allowedUsers/<seeded email>` exists with a `role` field
- `docs/teacher-allowlist-runbook.md` can be followed start to finish by someone who did not write it
- The trailing comment in `firestore.rules` no longer instructs a step this change skipped

**Implementation Note**: Pause for manual confirmation before Phase 2.

---

## Phase 2: Session layer

### Overview

All the gate's decision logic, behind two thin SDK gateways, with no UI and no routing. This is the phase
that carries the automated test coverage.

### Changes Required

#### 1. Session and allowlist types

**File**: `src/app/model/auth.interface.ts` (new)

**Intent**: Name the states the rest of the change branches on, in the folder `src/CLAUDE.md` reserves for
types with no runtime code.

**Contract**: `UserRole = 'teacher' | 'director'`; `AllowlistEntry { role: UserRole }`; and a discriminated
`SessionState` union over `status: 'resolving' | 'anonymous' | 'authorized' | 'denied'`, where `authorized`
carries `email` and `role`, and `denied` carries a reason discriminating "not on the allowlist" from
"lookup failed". Every consumer in later phases switches on `status`.

#### 2. Auth gateway

**File**: `src/app/auth/auth.gateway.ts` (new)

**Intent**: Isolate every `@angular/fire/auth` call into one injectable so the logic above it is testable
without mocking the SDK.

**Contract**: Injectable (`providedIn: 'root'`), injecting `Auth`. Exposes the current user as an
observable, `signInWithGoogle()` using `signInWithPopup` with `GoogleAuthProvider`, and `signOut()`.
Persistence is `browserLocalPersistence` (the SDK default for web — set it explicitly so the choice is
visible rather than inherited). No decision logic lives here.

#### 3. Allowlist gateway

**File**: `src/app/auth/allowlist.gateway.ts` (new)

**Intent**: One-shot lookup of an address against `allowedUsers`, isolated for the same reason.

**Contract**: `lookup(email: string): Promise<AllowlistEntry | null>` — `getDoc` on
`doc(firestore, 'allowedUsers', email.toLowerCase())`; resolves `null` when the document does not exist and
**rejects** when the read itself fails. That distinction is what the fail-closed messaging in the service
depends on, so it must not be flattened into a single `null`. Deliberately `getDoc`, not `docData` /
`onSnapshot` — a live listener per session is exactly the Spark-quota leak the risk register warns about,
and the allowlist does not change while someone is signed in.

#### 4. Session service

**File**: `src/app/auth/session.service.ts` (new)

**Intent**: The single source of truth for "is this person allowed in", composed from the two gateways and
consumed by the guard, the sign-in screen, and the header.

**Contract**: Injectable (`providedIn: 'root'`) exposing a `Signal<SessionState>` plus `signIn()` and
`signOut()`. Pipeline: auth stream → no user gives `anonymous`; a user triggers a lookup, a hit gives
`authorized`, a miss gives `denied` **and calls `signOut()`**, a rejection gives `denied` with the
technical reason. Initial value is `resolving` until the first auth emission has been processed. See
"Critical Implementation Details" for why the denial reason needs its own signal to survive the sign-out.

#### 5. Session service spec

**File**: `src/app/auth/session.service.spec.ts` (new)

**Intent**: With the emulator deferred, this spec is the change's primary automated barrier.

**Contract**: Fakes for both gateways. Cases: starts `resolving`; no user resolves to `anonymous`;
allowlisted user resolves to `authorized` carrying email and role; non-allowlisted user resolves to
`denied` with the not-allowlisted reason **and** triggers `signOut()`; a rejected lookup resolves to
`denied` with the failure reason and does not report the user as authorized; the denial reason survives the
sign-out that follows it and clears on the next `signIn()`.

### Success Criteria

#### Automated Verification

- Lint passes: `npm run lint`
- Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Production build type-checks: `npm run build`
- Dev build type-checks: `npm run build -- --configuration development`

#### Manual Verification

- The four report tabs still render and download PDFs (nothing has been wired yet — this confirms the new
  files did not disturb the bundle)

**Implementation Note**: Pause for manual confirmation before Phase 3.

---

## Phase 3: Routing, shell extraction, guard, and sign-in screen

### Overview

Wire the session layer to a two-route surface. After this phase the gate works end-to-end: unauthenticated
visitors cannot reach a form, allowlisted teachers can, and both can switch language.

### Changes Required

#### 1. Route table

**File**: `src/app/app.routes.ts` (new)

**Intent**: The minimum routing surface FR-004 needs — a sign-in address and a guarded everything-else.

**Contract**: `sign-in` → `SignInComponent`, guarded by a redirect-if-authorized guard so a signed-in user
never sees it; `''` → `ShellComponent`, guarded by `authGuard`; `**` → redirect to `''`. No lazy loading —
the whole app is one bundle and adding chunk boundaries here buys nothing.

#### 2. Router provider

**File**: `src/app/app.config.ts`

**Intent**: Register the router alongside the existing global providers.

**Contract**: `provideRouter(routes)` appended to `appConfig.providers`. The Firebase providers keep their
order and `provideFirebaseApp` stays first. No NgModule — `src/CLAUDE.md` is explicit and `@angular/fire`
does not need one.

#### 3. Guards

**File**: `src/app/auth/auth.guard.ts` (new)

**Intent**: Turn session state into a routing decision without ever deciding while the state is still
`resolving`.

**Contract**: Two `CanActivateFn`s. `authGuard` waits for the first non-`resolving` state, then returns
`true` for `authorized` and a `UrlTree` to `/sign-in` otherwise. `signInGuard` mirrors it: `true` unless
the state is `authorized`, in which case a `UrlTree` to `/`. Both return an observable so the router holds
the navigation pending rather than deciding early — see "Critical Implementation Details".

#### 4. Shell component

**File**: `src/app/shell/shell.component.ts` / `.html` (new)

**Intent**: Give the four report tabs a component to live in behind the guard, moving today's markup
without changing it.

**Contract**: Standalone; holds the `activeTab` field and `emitTab` handler moved verbatim from
`AppComponent`, and a template holding the `<main class="main-wrapper">` block — `app-tab-group` plus the
`*ngComponentOutlet` — exactly as it reads today. No stylesheet: `.main-wrapper` carries no component-scoped
rules, and `.wrapper` stays with `AppComponent`.

#### 5. App component

**File**: `src/app/app.component.ts` / `.html`

**Intent**: Become the router host and the boot indicator, while keeping the header visible on every screen.

**Contract**: Template keeps `<div class="wrapper">` and `<app-header>`, replaces the `<main>` block with
`<router-outlet>`, and adds a boot indicator rendered **alongside** the outlet while the session state is
`resolving`. `app.component.scss` is untouched — `.wrapper` has not moved. `imports` drops
`TabGroupComponent` and `NgComponentOutlet`, gains `RouterOutlet`.

#### 6. Sign-in screen

**File**: `src/app/auth/sign-in/sign-in.component.ts` / `.html` / `.scss` (new)

**Intent**: The one new user-visible surface: a title, a Google sign-in button, and the failure messages.

**Contract**: Standalone, composing `app-button` (`[translateKey]`, `(clicked)`) per `docs/design-language.md`
§4 — never a raw `mat-button`. Renders, from the session signal: nothing extra in the normal case; the
"no access" message for a not-allowlisted denial; and the "could not verify access, try again" message with
a retry affordance for a lookup failure. Handles a blocked popup as a third failure message rather than a
silent no-op. Styling is minimal here — Phase 4 brings it onto the design language.

#### 7. Header identity and sign-out

**File**: `src/app/shared/components/UI/header/header.component.ts` / `.html`

**Intent**: Show which account is signed in — the difference between a personal and a school Google account
is invisible otherwise, and from `S-02` onward it decides whose data is on screen.

**Contract**: Inject `SessionService`; when the state is `authorized`, render the email and a sign-out
control next to the existing language toggle. Nothing renders in any other state, so the sign-in screen
keeps only the toggle. The language toggle and `ngOnInit`'s `setDefaultLang` are untouched. **This file is
shared with `S-05b`** — keep the diff to the additive block.

#### 8. Translations

**File**: `src/assets/i18n/pl.json`, `src/assets/i18n/en.json`

**Intent**: FR-018 requires new surfaces to ship bilingual from day one.

**Contract**: One nested `auth` object appended to both files, same keys in both: sign-in title, the Google
sign-in button, sign-out, the checking-access indicator, the no-access message, the verification-failed
message, retry, and the blocked-popup message. Nesting keeps the addition to a single block in a file
`S-05b` also appends to. No existing key is renamed or removed.

#### 9. Guard and sign-in specs

**File**: `src/app/auth/auth.guard.spec.ts`, `src/app/auth/sign-in/sign-in.component.spec.ts` (new)

**Intent**: Cover the two units that turn session state into user-visible behaviour.

**Contract**: Guard spec, with a fake session service: does not decide while `resolving`; `true` for
`authorized`; `UrlTree` to `/sign-in` for `anonymous` and for both denial reasons; `signInGuard` sends an
authorized user to `/`. Component spec, spreading `translateTestingImports` per `src/CLAUDE.md`: renders,
the button calls `signIn()`, and each denial reason renders its own message.

### Success Criteria

#### Automated Verification

- Lint passes: `npm run lint`
- Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Production build type-checks: `npm run build`
- Dev build type-checks: `npm run build -- --configuration development`

#### Manual Verification

- App Check debug token from the first Firebase call is registered in the console (expect this on the very
  first run — it is not a bug)
- Loading `localhost:4200` signed out shows the loading indicator, then the sign-in screen — no flash of
  the report tabs
- Signing in with the seeded account reaches the four tabs; the header shows that address
- Reloading while signed in goes straight to the tabs with no flash of the sign-in screen
- Signing in with a non-allowlisted Google account returns to the sign-in screen with the no-access
  message, and the Firebase Console shows no active session for it
- Navigating to `/sign-in` while signed in bounces back to the tabs; a nonsense path also lands on the tabs
- Sign-out from the header returns to the sign-in screen
- The language toggle works on the sign-in screen and on the report tabs, in both directions
- All four report tabs open, accept input, and download a PDF that looks like it always did

**Implementation Note**: Pause for manual confirmation before Phase 4.

---

## Phase 4: Visual language pass

### Overview

Bring the new surfaces onto the published design language and settle the one handoff
`docs/design-language.md` assigns to this slice.

### Changes Required

#### 1. Sign-in screen styling

**File**: `src/app/auth/sign-in/sign-in.component.scss`

**Intent**: Make the new screen look like it belongs to the same app as the Teddy Eddie form.

**Contract**: `@use` the token barrel and the pattern barrel per `docs/design-language.md` §2–§3;
`card-surface` with a full radius for the standalone card (the default is bottom-corners-only because cards
normally sit under a section-title bar); `$britannia-blue` for the title, `$font`, `$distance-*` for
spacing, `$britannia-red` for the denial message. No hardcoded hex values, px font sizes, radii, or
shadows — tokens exist for all of them.

#### 2. Header identity block styling

**File**: `src/app/shared/components/UI/header/header.component.scss`

**Intent**: Seat the email and sign-out control in the existing header layout without disturbing it.

**Contract**: Additive rules inside the existing `.header` block, reusing `ds.$distance-*` and
`ds.$britannia-blue`. The tablet breakpoint block already repositions `.button-wrapper` absolutely — the new
block must not collide with it at either width.

#### 3. Absorb the fifth elevation-shadow copy

**File**: `src/assets/styles/patterns/` consumers — `src/app/shared/components/UI/tab-group/tab-group.component.scss`

**Intent**: `docs/design-language.md` §5 records the tab bar's hand-written copy of the elevation shadow as
"`S-01` should absorb it when it builds the sign-in surface". Doing it here closes the handoff while the
style layer is already open.

**Contract**: Replace the literal shadow declaration with `ds.$shadow-1`. The full `20px` radius stays as
it is — it is not the card's bottom-only radius and is not what is being unified. Must be a visual no-op;
verify with the CSS diff in `docs/design-language.md` §7.4, not by eye alone.

### Success Criteria

#### Automated Verification

- Lint passes: `npm run lint`
- Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Production build type-checks: `npm run build`
- `tab-group.component.scss` compiles to identical CSS before and after, per `docs/design-language.md` §7.4

#### Manual Verification

- The sign-in screen reads as the same visual language as the Teddy Eddie tab — card, radius, shadow,
  colours, type
- The denial message is legible and clearly an error state
- Header layout is intact above and below the 768px breakpoint, signed in and signed out
- The tab bar looks unchanged

**Implementation Note**: Pause for manual confirmation before Phase 5.

---

## Phase 5: Documentation sync

### Overview

Leave the project's written record describing the system that now exists. Three documents currently assert
things this change made false, and `context/foundation/lessons.md` makes fixing that in the same change a
standing rule.

### Changes Required

#### 1. Infrastructure record

**File**: `context/foundation/infrastructure.md`

**Intent**: The document's Current State says Firestore holds zero collections and deny-all rules; Getting
Started step 4 calls the emulator a hard `S-01` prerequisite; two risk-register rows are written from
`S-01`'s point of view as a future event. All four are now stale.

**Contract**: Update Current State (one collection, first conditional rule live, first real Firebase call
made, App Check still monitoring-only). Rewrite step 4 to record that the harness was **deferred by
decision** with the reasoning — the allowlist is read-only and holds no student data, so the pre-mortem's
cross-teacher leak surface does not exist yet — and to move the prerequisite to `S-02` / `S-03`, where it
does. Update the two risk rows accordingly, raising rather than lowering the emphasis on the deferred
harness. Record that data ownership in later slices keys on `request.auth.uid` while the allowlist keys on
email, so the two are not confused.

#### 2. Project conventions

**File**: `src/CLAUDE.md`

**Intent**: It states "There is no Angular Router" as architecture and describes the emulator situation in
terms that this change invalidates.

**Contract**: Replace the no-router statement with the actual composition — two routes, guard,
`ShellComponent`, and the tab registry still driving what is inside the shell. Update the emulator
paragraph to match the deferral recorded in `infrastructure.md`. Add `src/app/auth/` and `src/app/shell/` to
the folder map, and note the session contract (`SessionService` as the single source of session truth, the
gateway seam and why it exists).

#### 3. Roadmap

**File**: `context/foundation/roadmap.md`

**Intent**: Close out `S-01`'s entry and carry the deferred prerequisite forward so `S-02` and `S-03` do
not rediscover it mid-planning.

**Contract**: Update the `S-01` row and slice entry (status; both Unknowns resolved, with the answers).
Update the `S-02` / `S-03` entries and the Backlog Handoff notes to name the emulator + rules-testing
harness as inherited work. Add the deferral to `## Open Roadmap Questions`.

#### 4. PRD

**File**: `context/foundation/prd.md`

**Intent**: Open Question #3's caveat says the Firestore database has not been created and the Google
provider is not enabled — both untrue since F-01 — and that "FR-005 / FR-009 implementation is still gated
on both steps".

**Contract**: Update that caveat to the executed state. Do not restate implementation detail in the PRD;
one corrected paragraph is the whole edit.

#### 5. Change record

**File**: `context/changes/google-sign-in-gate/change.md`

**Contract**: `status: planned` → the post-implementation status, `updated` to today's date.

### Success Criteria

#### Automated Verification

- Lint passes: `npm run lint`
- Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- Production build succeeds: `npm run build`

#### Manual Verification

- No document in `context/foundation/` or `src/CLAUDE.md` still describes the app as router-less or
  Firestore as empty
- The emulator deferral is findable from `infrastructure.md`, `src/CLAUDE.md`, and `roadmap.md`, with the
  same reasoning in each
- A reader starting `S-02` learns about the inherited harness debt without reading this plan

---

## Testing Strategy

### Unit Tests

- `SessionService` — the full state machine: `resolving` start, `anonymous`, `authorized` with role,
  `denied` on an allowlist miss (plus the forced sign-out), `denied` on a lookup rejection, and denial-reason
  survival across the sign-out.
- `authGuard` / `signInGuard` — pending while `resolving`, and the correct `boolean` or `UrlTree` for every
  terminal state.
- `SignInComponent` — renders, triggers `signIn()`, and shows the right message per failure mode.

### Integration Tests

None. Genuine integration coverage here means the emulator, which is deliberately out of scope — the manual
checklist below stands in for it, and that trade is recorded as an accepted risk.

### Manual Testing Steps

1. Sign out fully, load `localhost:4200`, confirm loading indicator → sign-in screen with no flash of tabs.
2. Sign in with the seeded account; confirm the four tabs and the address in the header.
3. Reload; confirm no flash of the sign-in screen.
4. Sign out; confirm return to the sign-in screen.
5. Sign in with a non-allowlisted Google account; confirm the no-access message and that no session remains.
6. Simulate a lookup failure (offline, or temporarily deploy a rule that denies the read); confirm the
   distinct "could not verify" message and that retry works once connectivity returns. **Restore the rule.**
7. Block popups in the browser and attempt sign-in; confirm the blocked-popup message.
8. Visit `/sign-in` while signed in, and a nonsense path; confirm both land on the tabs.
9. Toggle PL/EN on the sign-in screen and on a report tab.
10. Open each of the four report tabs, fill enough to generate, and download the PDF; compare against
    expectation by eye.

## Performance Considerations

One extra Firestore document read per auth state change, deliberately not a subscription. At a single
school's volume this is a rounding error against Spark's 50K reads/day, and it avoids adding a long-lived
listener to a codebase that already carries listener-leak warnings.

## Migration Notes

No data migration — this is the project's first collection. Rollback is a code revert plus redeploying the
deny-all rule; the `allowedUsers` documents are inert once the rule is gone, and no user data exists to
preserve. Nothing is deployed to hosting, so the live site is unaffected by this change either way.

## References

- Roadmap slice: `context/foundation/roadmap.md` → S-01
- Requirements: `context/foundation/prd.md` → FR-001..FR-004, FR-014..FR-018
- Platform state and the deferred harness: `context/foundation/infrastructure.md` → Current State, Getting
  Started step 4, Risk Register
- Prior foundation: `context/changes/identity-and-data-platform/plan.md`
- Style contract: `docs/design-language.md`
- Fidelity guardrail: `docs/pdf-fidelity-check.md` §1
- Conventions: `src/CLAUDE.md`
- Standing rules: `context/foundation/lessons.md`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Allowlist collection, rules, and seeding runbook

#### Automated

- [x] 1.1 Rules deploy cleanly: `npx firebase deploy --only firestore:rules` — ca0458e
- [x] 1.2 Rules compile without warnings in the deploy output — ca0458e

#### Manual

- [x] 1.3 Console shows the `allowedUsers` block live alongside the deny-all — ca0458e
- [x] 1.4 `allowedUsers/<seeded email>` exists with a `role` field — ca0458e
- [x] 1.5 `docs/teacher-allowlist-runbook.md` is followable by someone who did not write it — ca0458e
- [x] 1.6 The trailing comment in `firestore.rules` no longer instructs a skipped step — ca0458e

### Phase 2: Session layer

#### Automated

- [x] 2.1 Lint passes: `npm run lint` — b29afa0
- [x] 2.2 Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless` — b29afa0
- [x] 2.3 Production build type-checks: `npm run build` — b29afa0
- [x] 2.4 Dev build type-checks: `npm run build -- --configuration development` — b29afa0

#### Manual

- [x] 2.5 The four report tabs still render and download PDFs — b29afa0

### Phase 3: Routing, shell extraction, guard, and sign-in screen

#### Automated

- [x] 3.1 Lint passes: `npm run lint` — 8f5940f
- [x] 3.2 Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless` — 8f5940f
- [x] 3.3 Production build type-checks: `npm run build` — 8f5940f
- [x] 3.4 Dev build type-checks: `npm run build -- --configuration development` — 8f5940f

#### Manual

- [x] 3.5 App Check debug token registered in the console — 8f5940f
- [x] 3.6 Signed out: loading indicator → sign-in screen, no flash of tabs — 8f5940f
- [x] 3.7 Seeded account reaches the four tabs; header shows the address — 8f5940f
- [x] 3.8 Reload while signed in goes straight to the tabs, no flash of sign-in — 8f5940f
- [x] 3.9 Non-allowlisted account gets the no-access message and leaves no session — 8f5940f
- [x] 3.10 `/sign-in` while signed in, and a nonsense path, both land on the tabs — 8f5940f
- [x] 3.11 Sign-out from the header returns to the sign-in screen — 8f5940f
- [x] 3.12 Language toggle works on the sign-in screen and on the report tabs — 8f5940f
- [x] 3.13 All four report tabs still download a PDF that looks unchanged — 8f5940f

### Phase 4: Visual language pass

#### Automated

- [x] 4.1 Lint passes: `npm run lint` — 3efa55c
- [x] 4.2 Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless` — 3efa55c
- [x] 4.3 Production build type-checks: `npm run build` — 3efa55c
- [x] 4.4 `tab-group.component.scss` compiles to identical CSS before and after (design-language §7.4) — 3efa55c

#### Manual

- [x] 4.5 Sign-in screen reads as the Teddy Eddie visual language — 3efa55c
- [x] 4.6 Denial message is legible and clearly an error state — 3efa55c
- [x] 4.7 Header layout intact above and below 768px, signed in and signed out — 3efa55c
- [x] 4.8 Tab bar looks unchanged — 3efa55c

### Phase 5: Documentation sync

#### Automated

- [x] 5.1 Lint passes: `npm run lint`
- [x] 5.2 Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- [x] 5.3 Production build succeeds: `npm run build`

#### Manual

- [x] 5.4 No foundation document still describes the app as router-less or Firestore as empty
- [x] 5.5 The emulator deferral is findable from all three documents with consistent reasoning
- [x] 5.6 A reader starting `S-02` learns about the inherited harness debt without reading this plan
