<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Google Sign-in Gate (S-01)

- **Plan**: `context/changes/google-sign-in-gate/plan.md`
- **Scope**: Full plan — Phases 1–5 of 5 (git range `49f9fd9..HEAD`, 6 commits)
- **Date**: 2026-07-28
- **Verdict at review**: REJECTED → **after triage: APPROVED**
- **Findings**: 1 critical, 5 warnings, 4 observations — 6 fixed, 3 skipped with recorded rationale, 1 accepted

## Verdicts

| Dimension | At review | After triage |
|-----------|-----------|--------------|
| Plan Adherence | WARNING | WARNING (accepted — documented deviations) |
| Scope Discipline | WARNING | PASS |
| Safety & Quality | FAIL | PASS |
| Architecture | PASS | PASS |
| Pattern Consistency | WARNING | PASS |
| Success Criteria | PASS | PASS |

`REJECTED` followed the rubric mechanically: a CRITICAL finding makes Safety & Quality a FAIL, and any critical FAIL rejects. It was never a "rewrite this" verdict — the critical fix was a `try/catch` plus a `catchError`, nothing is deployed, and the architecture underneath held up under scrutiny.

### Triage outcome (2026-07-28)

**Fixed**: F1 (critical — poisoned session signal), F2 (boot timeout + `EmptyError` leak + unguarded header sign-out), F3 (`toObservable` effect leak), F4 (session without an `email` claim), F6 (all errors reported as blocked pop-up), F9 (no in-flight state), F10 partially (three doc corrections).

**Skipped, with rationale recorded on each finding**: F5 (gateway + header specs — deferred to `S-02` to land with the emulator harness it already inherits), F7 (`signIn()` predicate — leaves the docblock and `src/CLAUDE.md` overstating the guarantee), F8 (side effects surviving `switchMap` cancellation — unreachable in MVP flows).

**Verification after all fixes**: `npm run lint` clean, **38/38** tests (one added), `npm run build` and `npm run build -- --configuration development` both type-check, and the two `EmptyError` lines that used to print on a green run are gone.

**Two carried risks** worth naming before `S-02` starts: `allowlist.gateway.ts`'s `email.toLowerCase()` is load-bearing for the security rule and still has no test (F5), and `signIn()` does not wait for a settled state despite two documents saying it does (F7).

### What passed, and on what evidence

- **Automated criteria (all 5 phases)** — re-run for this review: `npm run lint` clean; `npm test -- --watch=false --browsers=ChromeHeadless` = **37/37 SUCCESS**; `npm run build` and `npm run build -- --configuration development` both succeed (the two pdfmake CommonJS warnings are pre-existing). Criterion 4.4 verified directly: `$shadow-1` in `src/assets/styles/utils/_elevation.scss` is byte-identical to the triple removed from `tab-group.component.scss:15`, so the absorption is a provable visual no-op.
- **The hard PDF-fidelity guardrail held.** `git diff --name-only 49f9fd9..HEAD` contains zero files under `semestr-report/`, `year-report/`, `cambridge-report/`, or `teddy-eddie-report/`. No report template, form model, or pdfmake builder was touched.
- **The security rule is sound**, checked against every failure mode. `allow write: if false` is present (`firestore.rules:32`); the deny-all catch-all at `:35-37` still covers everything else; a token with no `email` claim fails closed because `email_verified == true` short-circuits first; and `request.auth.token.email.lower() == email` binds the wildcard to the caller's own address, so the `teacherUid`/`teacherId` over-permission shape the file's own comment warns about does not apply here.
- **Architecture matches the plan's load-bearing decisions.** `<router-outlet>` renders unconditionally with the boot indicator *alongside* it (`app.component.html:4-12`), not wrapped around it. The header stays above the outlet, so FR-018's toggle survives on the sign-in screen. Every raw SDK call sits behind a gateway. The allowlist read is a one-shot `getDoc`; there is no `onSnapshot` anywhere. Exactly two routes; `role` is stored and read but nothing branches on it. All "What We're NOT Doing" boundaries held.
- **i18n parity is exact** — the `auth` block has an identical 8-key set in both files, all genuinely translated, matching the existing nested-object precedent.
- **The two load-bearing test claims hold.** `session.service.spec.ts:134-146` really does prove the denial reason survives the forced sign-out (the fake's `signOut` pushes `user$.next(null)`, which is the emission that would otherwise collapse the state), and `auth.guard.spec.ts:40-46` really does prove the guard withholds its decision while `resolving`.

## Findings

### F1 — An unhandled `signOut()` rejection permanently poisons the session signal and kills the app

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/session.service.ts:131-137
- **Detail**: `refuse()` does `await this.authGateway.signOut()` with no `try`. Firebase's `signOut` can reject — network drop, token-refresh failure, IndexedDB error — and those are the *same* conditions that produce a `lookup-failed` in the first place, so the double-fault path is realistic rather than theoretical. When it rejects, `resolveAccount` rejects, so `from(this.resolveAccount(user))` at `:50` errors, and `switchMap` propagates that error into the `toSignal` source. Verified directly in `node_modules/@angular/core/fesm2022/rxjs-interop.mjs:228-231` and `:246-253`: `toSignal` stores the error as `StateKind.Error`, tears down the subscription, and the returned `computed` **re-throws on every subsequent read, forever**. From that instant `this.account()` throws → `state()` throws → `AppComponent.isResolving()` throws during template evaluation, and both guards' `toObservable` effects error out, so every navigation fails. There is no recovery short of a page reload, and if the underlying condition persists the reload re-enters the same path. The same hazard applies to any error emitted by `authGateway.user$` itself, which has no `catchError` either.
- **Fix**: Wrap the `signOut()` inside `refuse()` in `try/catch` — a failed sign-out should still yield the denial — and add a `catchError` to the outer pipe feeding `toSignal` that maps an unexpected error to `null` plus `denial.set('lookup-failed')`, so the stream survives instead of latching.
  - Strength: Restores the invariant the whole state machine is built on — that the session signal always holds a readable state. Both edits are local to one file and the existing seven `SessionService` cases pin the behaviour around them.
  - Tradeoff: Genuinely swallowing a Firebase error means a failed sign-out leaves a live credential behind while the UI says denied; that is still strictly better than a dead app, but it deserves a `console.error` so it is visible.
  - Confidence: HIGH — the `toSignal` error-latching behaviour was read in the installed source, not inferred.
  - Blind spot: Not reproduced end-to-end in a browser; the reasoning is from the code path, since forcing a `signOut` rejection needs the emulator this slice deliberately deferred.
- **Decision**: FIXED — `try/catch` around the `signOut()` in `refuse()`, plus a `catchError` that maps a failed resolution to `null` + `denial.set('lookup-failed')`. The `catchError` was placed **inside** `switchMap` rather than on the outer pipe as originally written: on the outer pipe it would have caught the error but still ended `user$`, so the next sign-in would never emit. Inside, only the one resolution attempt dies and the auth stream survives. Both paths log via `console.error`. Lint clean, `session.service.spec.ts` 10/10.

### F2 — Nothing on the Firebase seam has a timeout, and `settledOnce` leaks an opaque `EmptyError` today

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/session.service.ts:47-53, :100-104; src/app/auth/auth.guard.ts:16-24
- **Detail**: Two halves of one gap. **The boot side:** `SessionState` starts `resolving` and leaves it only when `authState()` emits — and the spec's own comment at `session.service.spec.ts:36-38` records that it emits nothing until Firebase has restored or failed to restore a session. Both guards wait on `filter(status !== 'resolving')`, so if that emission never arrives (bad `apiKey`, App Check refusal, hostile network) the router holds navigation forever and `app.component.html:6` shows the spinner and "checking access" indefinitely, with no timeout, no error state in the union, and nothing to tell the user. This is the failure the plan's own "Debug & observability" note anticipates, but the code has no way to report it, so it presents as a hang. **The settle side:** `settledOnce` uses `firstValueFrom(toObservable(state).pipe(filter(...)))`, which **rejects with `EmptyError`** when the injector is destroyed before the predicate holds. That is happening now: `session.service.spec.ts:183` and `:199` `void` promises that never settle, and Karma prints two `ERROR: EmptyErrorImpl{... 'no elements in sequence'}` lines during a **37/37 green** run. In real code that rejection lands in the sign-in catch and is rendered as "pop-up blocked" (see F6), while `HeaderComponent.signOut()` (`header.component.ts:52-55`) has no catch at all — a rejection there skips `router.navigate(['/sign-in'])` and leaves the user inside the shell with a dead session.
- **Fix A ⭐ Recommended**: Bound the resolving window — add a `timeout` to the auth stream feeding `account` and let expiry surface through the existing `denied`/`lookup-failed` channel, so the user gets `auth.verificationFailed` and a retry instead of an infinite spinner. Separately, make the two specs `await` their promises and wrap `HeaderComponent.signOut()` in `try/catch` that navigates regardless.
  - Strength: Reuses the denial channel and message this change already built and tested; converts an unfalsifiable hang into a visible, recoverable state, and fails open toward the sign-in screen rather than the shell, so the gate is never weakened.
  - Tradeoff: The timeout constant is a guess — too short and a cold-network first load shows a spurious error. Needs a spec case and a comment justifying the value.
  - Confidence: MED — the mechanism is straightforward and the union already carries a failure branch, but the right duration is not derivable from the repo and only a real deploy will calibrate it.
  - Blind spot: Unverified how `@angular/fire`'s App Check interceptor behaves when its token fetch stalls; the timeout may fire on a request that would still have succeeded.
- **Fix B**: Leave the timing alone; add the escape hatch to the boot indicator only — after N seconds render a "still checking… reload" affordance beside the spinner — plus the same spec and `try/catch` cleanups.
  - Strength: Touches no state machine and no guard, so it cannot weaken the gate or destabilise the passing `SessionService` cases. Purely additive.
  - Tradeoff: Treats the symptom; `signIn()` and `signOut()` keep their unbounded wait and nothing records *why* it hung.
  - Confidence: HIGH — a template-local change with no interaction surface.
  - Blind spot: No help if the hang occurs after the shell has activated rather than during boot.
- **Decision**: FIXED via Fix A, with one improvement on the written approach. Rather than letting `timeout` error the stream, it uses `timeout({ first: 15_000, with: () => concat(of(TIMED_OUT), user$) })`, which **resubscribes** instead of erroring — so a merely-late emission still lands and corrects the state, and the stream survives for every later sign-in. Erroring would have left `user$` dead, making the "try again" in the message a lie. Only the *first* emission is bounded; an established session is never timed out. Expiry routes through the existing `denied`/`lookup-failed` channel, so no new i18n key was needed. Also: `HeaderComponent.signOut()` now navigates in a `finally`-equivalent `try/catch`, and `session.service.spec.ts:175` settles its previously-pending `signIn()` promise. Verified: lint clean, **37/37**, both builds type-check, and the two `EmptyError` lines are gone from the run.

### F3 — Every `signIn()`, `signOut()`, and guard run leaks a live effect that is never destroyed

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/session.service.ts:100-104, src/app/auth/auth.guard.ts:20-23
- **Detail**: `toObservable` creates its effect with `manualCleanup: true` and registers teardown on `injector.get(DestroyRef).onDestroy(...)` — on *injector destruction*, not on unsubscribe. `settledOnce` passes `this.injector`, which for a `providedIn: 'root'` service is the root `EnvironmentInjector`; `settledState()` calls `inject(Injector)` inside a `CanActivateFn`, which for these non-lazy, provider-less routes also resolves to the root injector. Neither is destroyed before app teardown. `firstValueFrom` and `take(1)` unsubscribe the subscriber but leave the effect running, so it keeps re-reading `state()` on every session change for the lifetime of the page. One permanent effect accumulates per navigation and per sign-in/sign-out, unbounded in an SPA that is never reloaded. Growth is slow here (routing is rare, two routes only), which is why this is a WARNING and not a CRITICAL — but it also contradicts `src/CLAUDE.md`'s own stated convention: "For subscription cleanup, use `takeUntil`, `async` pipe, or `destroyRef` — pick one per file."
- **Fix**: Create the `toObservable(this.state)` once as a private field on `SessionService` and have both `settledOnce` and the guards' `settledState` pipe off that single instance — or derive the settled observable from the raw gateway stream instead of the signal.
  - Strength: Collapses an unbounded set of effects into exactly one, and puts the single subscription where the service's lifetime already governs it.
  - Tradeoff: The guards must then reach into `SessionService` for the observable rather than building their own, which slightly widens the service's public surface.
  - Confidence: MED — the leak mechanism is confirmed in the installed `rxjs-interop` source, but the practical impact at this app's navigation volume is small.
  - Blind spot: Not measured — no profiling was done to confirm the retained-memory cost is material rather than merely untidy.
- **Decision**: FIXED — `SessionService` now exposes `state$`, one `toObservable(this.state)` created once in a field initializer. `settledOnce` pipes off it, and `auth.guard.ts`'s `settledState` reads it instead of calling `toObservable` per guard run. `SessionService`'s `Injector` injection and the guard's `inject(Injector)` both became unnecessary and were removed. `auth.guard.spec.ts` switched from `useValue` to `useFactory` so the fake can build a real `state$` in an injection context. Lint clean, 37/37, both builds type-check.

### F4 — A Firebase user with no `email` claim is reported as anonymous while their session stays alive

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/session.service.ts:106-109
- **Detail**: `resolveAccount` returns bare `null` for `!user?.email` *without* calling `refuse()`. Because `denial` is still `null`, `state()` collapses to `{ status: 'anonymous' }` — the only path in the machine where a signed-in Firebase user is described as signed out. The consequences compound: no message is shown, the user is bounced to `/sign-in`, and pressing "Sign in with Google" re-opens a chooser that silently re-selects the same account, producing a loop with no explanation — while the persisted Firebase credential is never cleared. Google always supplies `email` today, so this is not reachable in practice; it is a hole in a state machine that is otherwise rigorous about never leaving a session half-established, and it is the one branch of `resolveAccount` with no test.
- **Fix**: `return this.refuse('not-allowlisted')` instead of bare `null`, so the Firebase session is always terminated and the user always gets a message.
- **Decision**: FIXED (code only — the user chose not to add a test for this branch, since Google always supplies `email` and the fix is defence in depth). Lint clean, 37/37.

### F5 — The two gateways and the header sign-out have no specs at all

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/allowlist.gateway.ts, src/app/auth/auth.gateway.ts, src/app/shared/components/UI/header/header.component.ts:52-55
- **Detail**: Only three specs were added, and all three fake both gateways wholesale — so the files containing every raw SDK call have zero coverage, and the suite passes unchanged even if the real calls are wrong. The most security-load-bearing line in the change is `allowlist.gateway.ts:33`, `const documentId = email.toLowerCase()`, because it is the *only* thing that makes `firestore.rules:31` match: drop it and every teacher with a mixed-case Google address gets `permission-denied` → `lookup-failed`, with no test noticing. Also uncovered: the `ROLES.includes` rejection branch, and the `runInInjectionContext` wrapping whose absence the specs cannot see. Separately there is no `header.component.spec.ts`, so the sign-out navigation — the exact defect class `src/CLAUDE.md` records this project already got bitten by ("guards run on activation, not on session change") — is unverified. Its mirror *is* tested (`sign-in.component.spec.ts:51-58` asserts `navigate(['/'])`); deleting `header.component.ts:54` would leave a user in a fully-rendered shell with a dead session and a green suite. The spec header's claim to be "the gate's primary automated barrier" overstates what is actually covered.
- **Fix**: Add a thin `allowlist.gateway.spec.ts` mocking `doc`/`getDoc` that asserts the exact document path for a mixed-case address plus the missing-doc and bad-`role` branches, and a `header.component.spec.ts` mirroring the sign-in spec to assert `navigate(['/sign-in'])`.
- **Decision**: SKIPPED — deferred to `S-02`, to land with the emulator suite and `@firebase/rules-unit-testing` harness that slice already inherits as a hard prerequisite (Open Roadmap Question #5). The gateway coverage gap and the rules-testing gap are the same gap, so splitting them across two changes buys nothing. **Carried risk**: until then, the `email.toLowerCase()` at `allowlist.gateway.ts:33` is load-bearing for the security rule and unprotected by any test — treat it as a line not to touch casually.

### F6 — Every non-cancel sign-in error is reported to the user as "pop-up blocked"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/sign-in/sign-in.component.ts:63-72
- **Detail**: The catch filters out the three cancellation codes in `CANCELLED_BY_USER` and then sets `popupFailed` for *everything else*. So `auth/unauthorized-domain`, `auth/network-request-failed`, an App Check rejection, a malformed `apiKey`, and F2's `EmptyError` all render `auth.popupBlocked` — "Allow pop-ups for this page and try again." This matters more than it looks: the app has never been deployed, and `auth/unauthorized-domain` is the single most likely failure on the first hosting deploy. The screen will blame the user's pop-up blocker for a Firebase Console misconfiguration, sending whoever debugs it down the wrong path. `sign-in.component.spec.ts:85` only ever exercises `auth/popup-blocked`, so the spec cannot see the over-reach.
- **Fix**: Match the popup message on the popup codes specifically and fall back to `auth.verificationFailed` — which already reads "Access could not be checked… try again" — for every other code, still logging the code.
- **Decision**: FIXED — added a `POPUP_BLOCKED` allowlist (`auth/popup-blocked`, `auth/popup-blocked-by-browser`); every other non-cancellation code now falls back to `auth.verificationFailed`. The boolean `popupFailed` became a key-carrying `attemptFailure` signal (exposed as `attemptFailureKey`), so the component no longer hardcodes which message an attempt failure produces. New spec case asserts `auth/unauthorized-domain` renders `auth.verificationFailed`, not the pop-up message. Lint clean, **38/38**.

### F7 — `signIn()` resolves while the session is still resolving, contradicting its own contract

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/session.service.ts:76-81
- **Detail**: The docblock and `src/CLAUDE.md` both promise that `signIn()` "does not resolve until the state stops describing the old session", but the predicate is `state.status !== 'anonymous'` — and `resolving` satisfies it. So the moment the auth stream emits the user and the lookup begins, `settledOnce` fires and `signIn()` returns with the session still unresolved. It is harmless today only because `authGuard` then holds the subsequent `router.navigate(['/'])`. There is also no timing test for it: `signOut()` has a dedicated one (`:148-173`), `signIn()` has none, and in the single test that calls it (`:175`) the fake never pushes a user, so the promise is left permanently pending and the `void` swallows it.
- **Fix**: Tighten the predicate to `status === 'authorized' || status === 'denied'`, and add the mirror of the `signOut` timing test.
- **Decision**: SKIPPED — harmless today because `authGuard` holds the navigation regardless, and the change is in the one method whose timing three shipped defects already came from. **The docs are now the thing that is wrong**: `session.service.ts`'s docblock and `src/CLAUDE.md` both claim `signIn()` waits for a settled state, and it does not. Either tighten the predicate or correct both texts before `S-02` relies on the promise.

### F8 — `resolveAccount`'s side effects outlive `switchMap` cancellation

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/session.service.ts:50, :126, :131-137
- **Detail**: When a new auth emission arrives, `switchMap` unsubscribes from the in-flight `from(promise)` and correctly discards its *value* — but the promise keeps running, and its `denial.set(...)` and the `signOut()` inside `refuse()` still execute against the session that replaced it. A slow or failing lookup for a superseded user can therefore stamp a spurious denial onto, or force a sign-out of, the newer session. Hard to trigger today (it needs two rapid auth emissions, and the sign-out button only renders when `authorized`), but it is exactly the kind of window this codebase's own conventions say to model in fakes.
- **Fix**: Capture the user's identity at the start of `resolveAccount` and no-op the side effects if the gateway's current user no longer matches.
- **Decision**: SKIPPED — needs two auth emissions inside one lookup round-trip, which no flow in the MVP produces. Revisit if `S-02`/`S-03` add anything that re-authenticates without a full page transition.

### F9 — No in-flight state on the sign-in button

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/app/auth/sign-in/sign-in.component.html:6-10
- **Detail**: `signIn()` is an async chain — popup, allowlist round-trip, `settledOnce`, navigation — and nothing disables the button or shows progress while it runs. On a slow lookup the screen is visually identical to idle, so the natural response is to click again, and each click calls `signInWithPopup` afresh. Combined with F2's unbounded wait, a stalled sign-in gives the teacher no signal at all.
- **Fix**: Add a `pending` signal set around a `try`/`finally` in `signIn()` and bind it to the button's disabled state.
- **Decision**: FIXED — `SignInComponent` gained a `pending` signal set in `try`/`finally`. `ButtonComponent` had no `disabled` input, so one was added (`input<boolean>(false)`, bound on the `mat-raised-button`) — an **additive** extension of the shared component, which `docs/design-language.md` §4 permits, and the §4 input list was updated to match. Lint clean, 38/38, both builds type-check.

### F10 — Plan and documentation bookkeeping

- **Severity**: 📝 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence / Scope Discipline / Pattern Consistency
- **Location**: src/assets/i18n/en.json:252-261, src/app/auth/auth.gateway.ts:31-43, src/app/app.component.scss:12-26, docs/design-language.md, src/CLAUDE.md:74, docs/teacher-allowlist-runbook.md
- **Detail**: Five small divergences, none behavioural. (a) Phase 3 §8 enumerated a `retry` key; the shipped set substitutes `signInLead`. The behaviour survives — the Google button doubles as retry and `verificationFailed` ends in "try again" — and PL/EN parity is exact. (b) Phase 2 §2 required persistence set explicitly; the code inherits `getAuth()`'s default and documents why in nine lines (an explicit `setPersistence` threw `cls is not a constructor` because `browserLocalPersistence` is not on `@angular/fire`'s zone-wrapped export list). A well-handled deviation, recorded in three places — but the resulting behaviour has no check anywhere, automated or manual. (c) Phase 3 §5 said `app.component.scss` would be untouched; it gained 15 lines styling the boot indicator the same phase authorised in the template. (d) `docs/design-language.md` appears in no phase's file list, but its edit retires the three "No consumer" markers and the fifth-shadow entry that Phase 4 resolved — and `tab-group.component.scss:15-17` cites §5, so leaving it stale would have made a code comment false. Both (c) and (d) are plan omissions rather than scope creep, and (d) is what `context/foundation/lessons.md` requires. (e) Doc drift introduced by this change's own Phase 5: `src/CLAUDE.md:74` still calls `tab-data.ts` "the tab registry that drives `AppComponent`", though the change moved that into `ShellComponent` — as the same file correctly says two sections earlier. Also `docs/teacher-allowlist-runbook.md` never mentions the invalid-`role` case even though `allowlist.gateway.ts:49-54` deliberately routes it to "could not be verified".
- **Fix**: Correct `src/CLAUDE.md:74` to name `ShellComponent`; add the invalid-`role` case to the runbook; add "close the browser, reopen, confirm still signed in" to the pre-deploy manual checklist; leave (a), (c), (d) as accepted, correcting the plan's claims if it is kept as a record.
- **Decision**: FIXED for (e) and the checklist; (a), (b), (c), (d) ACCEPTED as recorded. `src/CLAUDE.md` now names `ShellComponent`; `docs/teacher-allowlist-runbook.md` gained the invalid-`role` exception to its "not an allowlist problem" advice; and `context/deployment/deploy-plan.md`'s verification checklist gained four `S-01` items — authorized-domains registration (the `auth/unauthorized-domain` trap behind F6), the browser-restart persistence check that F10(b) had no cover for, a non-allowlisted-account check, and a pointer to the App Check enforcement decision (Open Roadmap Question #6).
