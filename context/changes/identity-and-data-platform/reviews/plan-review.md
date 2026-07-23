<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Identity and Data Platform (F-01)

- **Plan**: `context/changes/identity-and-data-platform/plan.md`
- **Mode**: Deep
- **Date**: 2026-07-22
- **Verdict**: REVISE → **SOUND** after triage (2026-07-22)
- **Findings**: 9 total. F1–F7 from the initial pass: all FIXED. F8–F9 added in a scoped App Check re-review: F8 ACCEPTED (scope call — App Check stays), F9 FIXED.

## Verdicts

| Dimension | Verdict (initial) | After triage |
|-----------|-------------------|--------------|
| End-State Alignment | WARNING | PASS |
| Lean Execution | PASS | PASS |
| Architectural Fitness | PASS | PASS |
| Blind Spots | FAIL | PASS |
| Plan Completeness | FAIL | PASS |

Overall REVISE rather than RETHINK: the strategy (rules before database, provisioning isolated, docs synced last) was sound throughout. Every FAIL had a bounded, local fix, and all seven findings were resolved in triage — see per-finding Decision fields.

Lean Execution improved as a side effect: cutting the emulator removed a `firebase.json` block, an environment flag, two `connect*Emulator` branches, three verification steps, and a JDK prerequisite from a change that had no traffic for any of it to protect.

## Grounding

6/6 existing paths ✓ (`src/environments/`, `firestore.rules` correctly absent — both are new in this change). 6/6 `src/CLAUDE.md` line refs exact. 5/5 `infrastructure.md` line refs exact. `appConfig` blast radius = 1 importer (`src/main.ts:3`), confirming the plan's key discovery. brief↔plan consistent. Progress↔Phase contract ✓ — one `## Progress` at bottom, 4 `### Phase N:` matching 4 `## Phase N:` with identical names, all 28 steps mapped to Success Criteria bullets, no checkboxes outside Progress. (Post-triage: 26 steps. Per the progress-format contract, deleted indices 1.1, 1.4, 3.8 leave gaps rather than being renumbered, and the new dev-build criterion took the next free index 3.11.) `context/foundation/lessons.md` and `docs/reference/contract-surfaces.md` absent — those checks skipped.

## Findings

### F1 — No JDK on this machine; the emulator suite cannot start

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 1 — Success Criteria 1.1, 1.4; Phase 3 — 3.8
- **Detail**: `java` is not on PATH, `JAVA_HOME` is empty, and no JDK exists under `C:\Program Files\Java`, `\Eclipse Adoptium`, or `\Microsoft`. The Firestore and Auth emulators are Java processes. Phase 1's first automated criterion (`npx firebase emulators:start --only auth,firestore`) fails immediately, as do manual step 1.4 and Phase 3's step 3.8. The plan makes the emulator load-bearing across three phases and never names the prerequisite.
- **Fix A ⭐ Recommended**: Add a JDK install as Phase 1 step 0, with a `java -version` precondition check.
  - Strength: The emulator is central to this plan's safety story (dev never touches the shared live store, per Open Risks). Removing it guts the mitigation.
  - Tradeoff: Adds an environment setup step to an otherwise repo-local plan; JDK version matters (11+).
  - Confidence: HIGH — verified absent by two independent probes.
  - Blind spot: Whether other developers already have a JDK; only this machine was checked.
- **Fix B**: Drop the emulator from F-01; defer to S-02 when there is data to protect.
  - Strength: F-01 writes nothing to Firestore, so the emulator guards a risk that does not yet exist.
  - Tradeoff: Reverses the brief's recorded "Emulator configured in F-01" decision; S-02 is where the habit is hardest to retrofit.
  - Confidence: MEDIUM — defensible, but reverses a recorded decision.
  - Blind spot: Unclear whether S-01's auth work needs the Auth emulator sooner than S-02.
- **Decision**: FIXED — via a third option raised in triage: the emulator is cut from F-01 **entirely**, not merely unverified. No `emulators` block in `firebase.json`, no `useEmulators` flag, no `connect*Emulator` calls. The user's challenge ("po co mi emulator?") held up on inspection: F-01 ships zero collections, deny-all rules, and no code that touches Firestore or Auth, so the emulator intercepts nothing, and `firebase deploy --only firestore:rules` already compiles the rules server-side. The JDK requirement moves to `S-01`, where the rules-testing harness genuinely needs it. This single decision also resolved F4 and F6 and removed the emulator half of F2.

### F2 — `firebase init firestore` will rewrite the firebase.json Phase 1 just authored

- **Severity**: ❌ CRITICAL
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Change 1 (Firestore database creation)
- **Detail**: Phase 1 hand-writes `firebase.json` with a `firestore` key and pinned `emulators` ports, and its contract insists `hosting` stay byte-for-byte unchanged. Phase 2 then runs `firebase init firestore`, which mutates that same file. Three unhandled consequences: (1) it prompts for an indexes file and writes `firestore.indexes.json` plus an `"indexes"` key into `firebase.json` — no phase mentions this file, nothing commits it, no criterion checks it; (2) it can rewrite the `firestore` block Phase 1 authored, and the only defensive instruction covers the rules file, not firebase.json itself; (3) the plan's contract asserts a "production mode vs test mode" prompt, but that choice belongs to the Console creation flow — `firebase init firestore` does not reliably present it, so an implementer stalls looking for a prompt that never appears, in the one phase where the next question is the irreversible region choice.
- **Fix A ⭐ Recommended**: Replace `firebase init firestore` with `npx firebase firestore:databases:create "(default)" --location=eur3`.
  - Strength: Puts the one-way region choice in an explicit flag instead of an unwarned interactive prompt — exactly the hazard "Critical Implementation Details" spends a paragraph on. Touches no local files, so Phase 1's firebase.json survives. Non-interactive, so this step stops being human-only.
  - Tradeoff: Phase 2's "no agent can execute this phase" framing weakens; the phase splits into agent-runnable (create + deploy rules) and console-only (Google provider, App Check) parts.
  - Confidence: HIGH — an explicit `--location` flag removes the entire class of prompt ambiguity.
  - Blind spot: Exact flag surface on firebase-tools@15 unverified; confirm with `npx firebase firestore:databases:create --help` first.
- **Fix B**: Keep `firebase init firestore`, but extend the contract to cover indexes and firebase.json reconciliation.
  - Strength: Preserves the plan's phase shape and single-human-session framing.
  - Tradeoff: Leaves the region choice on an unwarned prompt, keeps the mode-prompt assertion that may not hold, and adds a `git diff firebase.json` step to an already all-manual phase.
  - Confidence: MEDIUM — manages the hazard rather than removing it.
  - Blind spot: Whether init would also inject its own `emulators` defaults over Phase 1's pinned ports.
- **Decision**: FIXED via Fix A. Phase 2 Change 1 now calls `npx firebase firestore:databases:create "(default)" --location=eur3`, with a `firestore:locations` eligibility pre-check and an explicit "do not use `firebase init firestore`" note carrying the reasoning. Fix A's blind spot was closed during triage: `firestore:databases:create --help` on firebase-tools@15 confirms `--location` is a required flag and that **no mode flag exists** — which independently confirms the finding's claim that the "production vs test mode" prompt does not exist on this path. Phase 2's overview, Implementation Note, and the Implementation Approach section were all updated to reflect that steps 1, 2, and 5 are agent-runnable and only steps 3–4 need the Console.

### F3 — The environment-shape instruction produces a circular self-import

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — Change 2, `plan.md:218`
- **Detail**: The plan says "Export an explicit shared interface (or have `environment.prod.ts` type-annotate against the shape of `environment.ts`)". The parenthetical is a build break: under `fileReplacements`, `environment.prod.ts` *becomes* `environment.ts` in the production build, so a type import from `./environment` resolves to the module itself. The first branch never says where the interface lives, and the obvious reading — export it from `environment.ts` — hits the same wall.
- **Fix**: Specify a third, never-replaced file. Create `src/environments/environment.model.ts` exporting `export interface Environment { production: boolean; firebase: {...}; recaptchaSiteKey: string; }`, and have both environment files declare `export const environment: Environment = {...}`. Delete the parenthetical from `plan.md:218`.
- **Decision**: FIXED — Phase 3 Change 2 now names `environment.model.ts` as a third file and spells out why the interface must not live in a replaced file. `useEmulators` dropped from the shape per F1.

### F4 — `npm start` silently becomes emulator-dependent; step 3.6 can't pass alone

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 — Manual Verification 3.6 vs. 3.8
- **Detail**: `environment.ts` sets `useEmulators: true`, so every dev boot calls `connectAuthEmulator`/`connectFirestoreEmulator` against localhost. `connectAuthEmulator` reaches out during init and complains loudly when nothing answers. Step 3.6 asks for "no Firebase-related console errors" from a bare `npm start`; step 3.8 separately assumes the suite is up. As written 3.6 fails unless the reader infers the dependency. The plan changes the startup ritual from one command to two and never says so — Phase 4 only promises to add "the emulator commands" to Common commands, which understates it.
- **Fix**: Restate 3.6 as "with the emulator suite running, `npm start` boots clean at localhost:4200", and make Phase 4's `src/CLAUDE.md` contract explicitly record that `npm start` now requires `firebase emulators:start` in a second terminal.
  - Strength: Removes a verification step that cannot pass as written, and puts the new two-command ritual where the next agent reads it.
  - Tradeoff: None material — a wording and documentation fix.
  - Confidence: HIGH — follows directly from `useEmulators: true` in the dev environment file.
  - Blind spot: Whether the team would prefer `useEmulators: false` as the dev default with an opt-in flag; a real alternative, but it reverses a recorded decision.
- **Decision**: FIXED — dissolved by F1's resolution. With no `connect*Emulator` calls, `npm start` stays a single command and step 3.6 passes standalone. Step 3.8 deleted; Phase 4 now explicitly instructs *not* to add emulator commands to `src/CLAUDE.md`.

### F5 — Preview-channel domains promised in the end state, authorized by no phase

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Desired End State #3 vs. Phase 2 Change 3, Progress 2.5
- **Detail**: Desired End State #3 promises "production and preview-channel domains authorized." Phase 2's contract only says confirm `britannia-reports.web.app` and `localhost` are present, then describes preview-channel URLs as a trap S-01 will hit. Progress 2.5 reads "production and localhost." The end state promises something no phase delivers and no criterion checks.
- **Fix**: Make all three agree — either drop "preview-channel" from End State #3 (consistent with the plan's own reasoning that it is S-01's problem), or add the wildcard domain to Phase 2 Change 3 and to step 2.5.
- **Decision**: FIXED — "preview-channel" dropped from Desired End State #3, which now names `britannia-reports.web.app` and `localhost` explicitly and points at Phase 2 Change 3 for why preview channels are `S-01`'s. Phase 2 and Progress 2.5 were already correct and are unchanged.

### F6 — `emulators:start` never exits, so it cannot be an automated verification step

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — Automated Verification 1.1
- **Detail**: `npx firebase emulators:start --only auth,firestore` is a blocking foreground process. `/10x-implement` runs automated criteria as commands and waits for exit; this one hangs until timeout.
- **Fix**: Change 1.1 to `npx firebase emulators:exec --only auth,firestore "echo rules-ok"`, which boots the suite, runs the command, and exits non-zero on a rules parse error. Keep `emulators:start` in the Manual Testing Steps where it belongs.
- **Decision**: FIXED — dissolved by F1's resolution. Steps 1.1 and 1.4 deleted outright rather than rewritten. Phase 1 now states plainly that rules syntax is not verified locally and that Phase 2's server-side deploy is the real parse gate.

### F7 — `environment.ts` is type-checked by no automated criterion

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — Automated Verification 3.1
- **Detail**: `angular.json:98` sets `defaultConfiguration: "production"`, so `npm run build` applies fileReplacements and compiles `environment.prod.ts` — never `environment.ts`. `tsconfig.app.json` uses `files: ["src/main.ts"]`, so nothing else pulls it in. A type error in the dev environment file passes all five Phase 3 automated criteria and only surfaces at the manual `npm start`. This is exactly the drift F3's shared interface is meant to catch.
- **Fix**: Add `npm run build -- --configuration development` as a sixth automated criterion in Phase 3.
- **Decision**: FIXED — added as Phase 3 automated criterion, Progress step 3.11, with the reasoning recorded inline in the plan.

### F8 — App Check SDK wiring ships into F-01 with nothing to attest

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Lean Execution
- **Location**: Phase 3 Change 4; Critical Implementation Details; Progress 3.9 (20 references across the plan)
- **Raised**: 2026-07-22, in a scoped re-review prompted by the user asking whether App Check is needed at all.
- **Detail**: The plan states at line 367 that "Between F-01 and `S-01`, App Check protects nothing." Monitoring mode collects data only under traffic, and F-01 does no hosting redeploy, has no code reading Firestore, and ships zero collections — so the monitoring baseline is empty. Meanwhile the wiring adds a third-party reCAPTCHA script to the boot path of an SPA that currently makes no third-party requests, plus a per-machine, per-browser-profile `FIREBASE_APPCHECK_DEBUG_TOKEN` ritual. The Console *registration* is genuinely infrastructure provisioning (same category as enabling the Google provider, and F-01's actual charter); the `provideAppCheck` call is app code with no consumer.
- **Fix A ⭐ Recommended**: Keep Phase 2 Console registration; cut `provideAppCheck` from `app.config.ts` (three providers, not four), `recaptchaSiteKey` from the environment shape, the debug-token section, and step 3.9. Park the site key in `infrastructure.md` for `S-01`.
  - Strength: Splits along the line F-01's own charter draws — provision infrastructure, ship no app code without a consumer.
  - Tradeoff: `S-01` wires the provider itself, though it is already touching `app.config.ts` for the session contract.
  - Confidence: HIGH — the plan's own line 367 concedes the protective value is nil.
  - Blind spot: None significant.
- **Fix B**: Cut App Check from F-01 entirely, including Console registration.
  - Strength: Narrowest possible F-01.
  - Tradeoff: Loses the batching of the Console visit already required for the Google provider.
  - Confidence: MEDIUM.
  - Blind spot: None significant.
- **Decision**: ACCEPTED — user opted to keep App Check registration *and* wiring in F-01, accepting the dead code and the debug-token friction in exchange for `S-01` readiness. Scope unchanged; no plan edits made for this finding.

### F9 — Manual verification 3.6 cannot pass before 3.9, and the "single toggle" claim is inaccurate

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 Manual Verification (3.6 vs 3.9); Phase 2 Change 4 Intent (line 168)
- **Raised**: 2026-07-22, surfaced while scoping F8. Independent of F8's scope decision — these are defects in the App Check work the plan keeps.
- **Detail**: Two separate issues. (1) Step 3.6 requires "no Firebase-related console errors" on boot, but the App Check debug token can only be registered *after* a boot prints it — and line 77 says a missing token produces "alarming" warnings. So 3.6 cannot pass on first boot; it needs a boot → register → reboot cycle that the ordering does not express. This is the same shape as F4, re-entering through App Check rather than the emulator. (2) Phase 2 Change 4 justifies registration by saying `S-01` can "enable enforcement with a single toggle." Enforcement without a deployed client sending attestation tokens rejects the app's own requests — and F-01 explicitly does no hosting redeploy, so the toggle is not single in any variant of this plan.
- **Fix**: Reorder Phase 3 manual steps so debug-token registration precedes the clean-boot check, and restate 3.6 as "after registering the debug token, `npm start` boots clean." Separately, soften line 168 to say registration removes the Console setup step from `S-01`'s path — not that enforcement becomes a single toggle.
- **Decision**: FIXED. (1) Phase 3 Manual Verification reordered so debug-token registration comes first, with an explicit note that the first boot's App Check warnings are expected rather than a regression, and that the clean-boot check must not be attempted before registration. Progress rows reordered to match — `3.9` now precedes `3.6`, indices preserved per the progress-format contract, since `/10x-implement` reads document order rather than index order. Testing Strategy manual steps split the boot into register-then-restart. (2) Phase 2 Change 4 Intent rewritten: registration is justified as removing a Console setup step from `S-01`'s path, and a new paragraph states plainly that enforcement is *not* a single toggle — it rejects the app's own requests unless a wired client is deployed, and F-01 does no hosting redeploy, so `S-01` owns the deploy → observe → enforce sequence.

## What came back clean

Scope discipline is genuinely tight — the "What We're NOT Doing" list is enforced consistently across all four phases. The standalone-only constraint and the `outputPath`/`hosting.public` coupling are both correctly respected. The rules-before-database ordering is well-reasoned. The roadmap's own self-contradiction on the F-003 allowlist is caught and resolved with a stated rationale. Every line reference spot-checked resolves exactly.
