<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Identity and Data Platform (F-01)

- **Plan**: `context/changes/identity-and-data-platform/plan.md`
- **Scope**: Full plan — Phases 1–4 of 4 (all Progress rows `[x]`)
- **Date**: 2026-07-23
- **Commits**: `0afe6ce` (p1) → `b801497` → `5727895` → `110979d` (p2) → `0bb8c75` (p3) → `d2ebf68` (p4) → `fce516b` (epilogue)
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 2 warnings, 3 observations
- **Triage** (2026-07-23): F1 fixed (Fix A, on a second pass) · F2 fixed · F3 fixed + recorded as a rule · F4, F5 skipped

> **All warnings resolved.** F1 was skipped on the first triage pass and fixed immediately afterwards at the user's request. `context/foundation/infrastructure.md` and `plan.md` row 3.9 now agree: no Firebase code executes in F-01 because `@angular/fire`'s providers are lazy and nothing injects them.

> **Reviewer independence caveat.** Phases 3–4 were implemented by the same agent conducting this review. To compensate, every automated criterion was re-run from scratch at HEAD, and every claim below is grounded in the committed diff, installed `node_modules` source, or live CLI output rather than recollection. A fresh reviewer would still hold independence this review does not.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

## Scope detection

Change commits touched 12 files. No unplanned source file was modified; no planned file was left unimplemented.

| File | Status |
|---|---|
| `firestore.rules` | in plan AND in diff — MATCH |
| `firebase.json` | in plan AND in diff — MATCH |
| `package.json`, `package-lock.json` | in plan AND in diff — MATCH |
| `angular.json` | in plan AND in diff — MATCH |
| `src/app/app.config.ts` | in plan AND in diff — MATCH |
| `src/environments/{environment.model,environment,environment.prod}.ts` | in plan AND in diff — MATCH |
| `context/foundation/infrastructure.md` | in plan AND in diff — MATCH (+ EXTRA, see F3) |
| `src/CLAUDE.md` | in plan AND in diff — MATCH (+ EXTRA, see F3) |
| `context/changes/identity-and-data-platform/*` | change-folder bookkeeping, expected |

`.claude/skills/*`, `.claude/.10x-cli-manifest.json` and root `CLAUDE.md` also appear in the `0afe6ce^..HEAD` range but belong to `610a1e8 chore(toolkit): install 10x-impl-review skill (m2l3)` — a separate change, correctly excluded.

## Success criteria — all re-run at HEAD

| Step | Check | Result |
|---|---|---|
| 1.2 | `firebase.json` valid JSON; `hosting` unchanged | PASS — keys `firestore, hosting`; whole-change diff is +3 lines, 0 removed; `hosting.public` still `dist/browser` |
| 1.3 / 3.4 | `npm test -- --watch=false --browsers=ChromeHeadless` | PASS — TOTAL: 5 SUCCESS |
| 2.1 | Firestore in `eur3` | PASS — `firestore:databases:get "(default)"` → `Location: eur3` |
| 2.2 | Rules deploy | NOT RE-RUN — deploying is a production write; a review must not perform one. Verified indirectly instead (see "What came back clean") |
| 3.1 | `npm run build` with file replacement | PASS — exit 0; bundle contains `production:!0`, proving `environment.prod.ts` was substituted |
| 3.2 | `dist/browser/index.html` exists | PASS — 81561 bytes |
| 3.3 / 4.2 | `npm run lint` | PASS — "All files pass linting" |
| 3.5 | No `@angular/*` drift | PASS — and verified far more deeply than the criterion asks (see "What came back clean") |
| 3.11 | `npm run build -- --configuration development` | PASS — exit 0 |
| 4.1 | No stale "Firestore absent" claims | PASS — grep returns nothing |

Manual rows 1.5, 2.3–2.8, 3.6, 3.7, 3.10, 4.3–4.5 were confirmed by the user at their gates. Row 3.9 is the exception — see F2.

## Findings

### F1 — No Firebase provider factory ever executes, so "boots clean" certifies almost nothing — and `infrastructure.md` records the wrong reason

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: `src/app/app.config.ts:54-62`; `context/foundation/infrastructure.md` (App Check bullet)
- **Detail**:

  Three pieces of evidence, each independently checkable:

  1. `@angular/fire@20.0.1` registers `provideFirebaseApp`, `provideAppCheck`, `provideAuth`, and `provideFirestore` as **lazy** providers. `grep -c "ENVIRONMENT_INITIALIZER\|APP_INITIALIZER"` returns **0** for all four of `angular-fire-{app,app-check,auth,firestore}.mjs`. `provideAppCheck` returns `makeEnvironmentProviders([...])` with a `multi` `useFactory` and no eager hook — Angular does not instantiate these until something injects them.
  2. Nothing in `src/` injects them. `app.config.ts` is the only file in the entire source tree that imports `@angular/fire`; there is no `inject(Auth)`, `inject(Firestore)`, `inject(AppCheck)`, or `inject(FirebaseApp)` anywhere.
  3. Therefore `initializeApp()` and `initializeAppCheck()` **never run** at runtime in F-01.

  This is not a code defect — the wiring is correct and will work the instant `S-01` injects something. But it invalidates two recorded claims:

  - **Criterion 3.6** ("app boots with no Firebase-related console errors") is trivially satisfied because no Firebase code executes. It verifies that the SDK compiles and bundles; it does not verify that anything initializes. Marking it `[x]` is literally true and materially misleading.
  - **The plan's Desired End State #5** asserts the app boots "with Firebase providers **initialized**". Providers are *registered*, not initialized. The plan overstates what this phase can demonstrate — a plan flaw, not an implementation one.
  - **`infrastructure.md`'s App Check bullet** says the likely reason no debug token appeared is that "reCAPTCHA v3 accepts `localhost` outright." **That explanation is wrong.** `@angular/fire` sets `globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN ??= true` on localhost (`angular-fire-app-check.mjs:36`), which puts App Check in *debug* mode where reCAPTCHA is bypassed entirely — so reCAPTCHA was never the deciding factor. And in fact neither path ran, because App Check never initialized. The SDK would otherwise have printed the token via an unconditional `console.log` (`@firebase/app-check` `index.esm2017.js:1498`, whose source comment reads "Not using logger because I don't think we ever want this accidentally hidden").

  Left uncorrected, the next slice inherits a confident, wrong causal story in the document it reads first.

- **Fix A ⭐ Recommended**: Correct the `infrastructure.md` App Check bullet to state the real reason (providers are lazy and nothing injects them, so no Firebase code ran), and soften the plan/Progress language so 3.6 reads as "bundles and boots without breaking the existing app" rather than implying initialization was proven.
  - Strength: Grounded in three independently verifiable facts; removes a false claim from the load-bearing onboarding doc at doc-edit cost. Also correctly reframes what F-01 actually demonstrated, which is real and worth having: the SDK bundles, budgets hold, and the existing app is unbroken.
  - Tradeoff: F-01 still ships wiring no test or boot has ever exercised. The first real proof lands in `S-01`.
  - Confidence: HIGH — verified against installed `node_modules` source and an exhaustive grep of `src/`.
  - Blind spot: Not verified whether a future `@angular/fire` minor adds an eager initializer, which would change this behavior silently.
- **Fix B**: Also add a minimal smoke check that forces initialization — e.g. inject `FirebaseApp` once at bootstrap, or a spec that builds a `TestBed` with `appConfig`'s Firebase providers and asserts `initializeApp` ran.
  - Strength: Converts 3.6 from a near-vacuous check into a real one, and would catch a malformed `firebaseConfig` now rather than in `S-01`.
  - Tradeoff: Adds code F-01's own scope section excludes ("No auth session surface", "provideAuth() and nothing more"), and a Karma spec touching Firebase drags network/IndexedDB behavior into a suite that is currently hermetic and 0.2s.
  - Confidence: MEDIUM — the TestBed variant is straightforward, but forcing App Check init under Karma may need the debug-token hatch and could prove flaky.
  - Blind spot: Have not checked whether `initializeAppCheck` under ChromeHeadless works without a registered debug token.
- **Decision**: FIXED via Fix A (2026-07-23) — skipped on the first triage pass, then fixed on request. The `infrastructure.md` App Check bullet now states the real reason (lazy providers, nothing injects them, so `initializeApp()` and `initializeAppCheck()` never run and reCAPTCHA is never reached) and spells out the two consequences for `S-01`: that "boots with no Firebase errors" does not validate any config value, and that the debug-token path — not reCAPTCHA — is what engages on `localhost`. The plan's Desired End State #5 still reads "providers initialized" and was left as-is; it is a historical planning artifact, and `plan.md` row 3.9 plus this document now carry the accurate account.

### F2 — Progress row 3.9 is marked `[x]` for work that was not performed, on a premise that does not hold

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `context/changes/identity-and-data-platform/plan.md` → Progress → Phase 3 → Manual → 3.9
- **Detail**: The row reads `[x] 3.9 App Check debug token registered in Firebase Console — N/A: no token was needed or printed; reCAPTCHA v3 accepted localhost`. Per F1, the stated reason is wrong, and no token was generated either — App Check never initialized, so the SDK never reached `readOrCreateDebugTokenFromStorage()`. The honest state is neither "done" nor "not applicable" but **untestable at F-01**: the criterion cannot be exercised until something injects a Firebase service. Marking it `[x]` is the rubber-stamp pattern this review is meant to catch, and it was applied to my own work.
- **Fix**: Reword the annotation to "N/A at F-01 — App Check never initializes because nothing injects it; first testable in `S-01`", so `/10x-archive` and future readers see an accurate reason rather than a wrong one.
- **Decision**: FIXED (2026-07-23) — row 3.9 now records the lazy-provider reason and states plainly that the criterion is untestable at F-01 rather than satisfied. Note that F1 was skipped, so `infrastructure.md` still carries the superseded "reCAPTCHA accepted `localhost`" explanation; the plan and that document now disagree on this point.

### F3 — Phase 4 shipped edits beyond its "Changes Required" contract

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `context/foundation/infrastructure.md` (risk register); `src/CLAUDE.md` (no-emulator paragraph)
- **Detail**: Phase 4's contract named three edits: the Current State bullets, the Getting Started steps, and a `src/CLAUDE.md` architecture/environments entry. The implementation additionally rewrote the risk register (closed the `eur3` row, restated the rules-leak row, added two new rows) and added a no-emulator/shared-prod-project paragraph to `src/CLAUDE.md`. Both were disclosed at the time and both are defensible — the register still prescribed `firebase init firestore`, the exact command the plan spends a paragraph warning against, so leaving it would have shipped a document contradicting itself. This is disclosed drift, not hidden drift, but it is EXTRA relative to the contract and belongs on the record.
- **Fix**: Accept as-is and note in the plan that Phase 4's scope expanded to keep `infrastructure.md` internally consistent.
- **Decision**: FIXED + ACCEPTED-AS-RULE (2026-07-23) — rule "Updating a document includes the sections the new content contradicts" appended to `context/foundation/lessons.md` (file created by this triage), and a "Scope note" added to Phase 4 in `plan.md` recording both extra edits.

### F4 — Phase 2 marked the reCAPTCHA site key "captured" without naming a destination, and it was lost

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `context/changes/identity-and-data-platform/plan.md` → Progress → Phase 2 → 2.7
- **Detail**: Row 2.7 ("reCAPTCHA site key and six SDK config values captured") was marked `[x]` at Phase 2, but "captured" named no destination file. The six SDK values were recoverable via `apps:sdkconfig`; the site key was not, and existed only in the user's head. Phase 3 stalled on it and needed a round-trip to retrieve it. Now remediated — the key is recorded in `infrastructure.md`. The generalizable defect is that a success criterion whose output is a *value* must name where the value lands, or it certifies nothing durable.
- **Fix**: Already remediated for this change. Worth recording as a recurring rule via `/10x-lesson`: any plan criterion of the form "capture X" must name the file X is written to.
- **Decision**: SKIPPED (2026-07-23) — the concrete loss is already remediated (the site key lives in `infrastructure.md`), and the user judged the general rule not worth persisting. The pattern is left unrecorded, so a future plan can write a destination-less "capture X" criterion again.

### F5 — `change.md` flipped to `implemented` before the Phase 4 manual gate was confirmed

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `context/changes/identity-and-data-platform/change.md`
- **Detail**: The implement ritual flips `status: implemented` after the final phase's SHA write-back. The edit was made while writing Phase 4's file changes, before the manual gate for 4.3–4.5 returned. Net effect is nil — the flip sat dirty in the working tree and only landed in `d2ebf68`, which was committed after the user confirmed. Recorded for completeness because a self-review should not be lenient about its own ritual ordering.
- **Fix**: None needed; note the ordering for future runs.
- **Decision**: SKIPPED (2026-07-23) — net effect was nil and nothing needed changing.

## What came back clean

**The lockfile did not drift, and this was checked properly rather than taken on trust.** Criterion 3.5 as written only inspects `package.json` — which would not catch npm silently bumping transitive dependencies of existing packages. `0bb8c75` showed 3348 changed lines with 907 deletions in `package-lock.json`, which looks alarming for a two-package install. Parsing both lockfile revisions and diffing the `packages` maps: **115 added, 0 removed, 0 version changes on pre-existing packages.** The deletions were npm re-sorting entries. No supply-chain surprise; the criterion's spirit holds even though its letter is weak.

**The deployed ruleset matches the committed file.** The Phase 1 review's comment-only fixes landed in `5727895` (2026-07-22 14:48), over 23 hours *before* the Phase 2 rules deploy in `110979d` (2026-07-23 14:26). The store was never live under a ruleset the repo does not describe — and the ordering was verified by commit timestamp, not assumed.

**The deny-all is complete, not partial.** `allow read, write: if false` under `match /{document=**}` covers get/list/create/update/delete across every path. The illustrative ownership scaffold sits in comments outside the `service` block and carries an explicit placement note plus the pre-mortem warning — it cannot be uncommented into an accidentally-working permissive rule.

**The `dist/browser` coupling survived.** `firebase.json`'s whole-change diff is three added lines and zero removed; `hosting.public` is untouched. `src/CLAUDE.md:68` and `infrastructure.md` both record that an earlier document revision got this backwards and that acting on it would have shipped an empty deploy over the live site. Phase 3 edited `angular.json` — the one file that could have broken the coupling — and touched only `fileReplacements`, leaving `outputPath` alone.

**File replacement was verified by observation, not by configuration.** Rather than trusting that `fileReplacements` was well-formed, the production bundle was grepped for `production:!0` — proving `environment.prod.ts` was actually substituted. The three-file environment arrangement (`environment.model.ts` never replaced) is the only structure that gives dev and prod a shared compile-time contract, and it is implemented correctly.

**`initializeAppCheck(undefined, {...})` is correct.** `@firebase/app-check`'s signature is `initializeAppCheck(app?: FirebaseApp, options?: AppCheckOptions)` — the app parameter is optional and falls back to the default app. This is the documented `@angular/fire` pattern, not a mistake.

**Standalone-only held.** No `AppModule`, no NgModule anywhere. `infrastructure.md` flags agent-generated NgModule scaffolding as a known failure mode for exactly this wiring task, and it did not happen. The four providers were appended to the existing `appConfig.providers` array without restructuring it, with `provideFirebaseApp` first.

**No secrets were committed.** The `apiKey` and reCAPTCHA site key are public by design — they ship in the SPA bundle and are documented as such in three places. Firestore rules, not key secrecy, protect the data.

**The five existing specs pass unchanged.** They do not import `appConfig`, so the global-provider change could not reach them — the plan predicted this and it held.
