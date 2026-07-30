<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Trimester/Semester Report Templates

- **Plan**: `context/changes/trimester-report-templates/plan.md`
- **Scope**: Phase 1 of 6 — Emulator suite, rules harness, and the per-teacher rule
- **Commit**: `f0c08c5` (13 files, +1596/−59)
- **Date**: 2026-07-30
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 3 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

**Reviewer blind spot, stated up front:** this review was performed by the same agent that wrote the
code, in the same session. It shares the author's assumptions. Findings F2 and F1 were established by
running commands rather than by reading, which is why they are the two worth trusting most.

## Findings

### F1 — The templates rule does not consult the allowlist

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: `firestore.rules:63-67`
- **Detail**: The rule authorizes on `request.auth.uid == uid` alone. Any Google account that
  completes Firebase sign-in — allowlisted or not — can therefore create, read and delete documents
  under its own `users/{uid}/reportTemplates` subtree. There is no cross-teacher leak (that is what
  the path-keyed shape closes, and `npm run test:rules` proves it), and no student data is reachable.
  What is reachable is the project's storage and its Spark write quota, by anyone with a Google
  account and the project id — which is public, since it ships in the bundle.
  FR-004 and `SessionService` gate the *app*; rules are evaluated independently of both, so the app
  gate is not a substitute. Note also that `allowedUsers` is keyed by email while this rule keys on
  uid — the rule can still bridge them via `request.auth.token.email`, which is available in rules.
  The plan specified the ownership shape and deliberately excluded a `schemaVersion` assertion; it
  did not consider the allowlist dimension at all, so this is a gap in the plan as much as in the code.
- **Fix A ⭐ Recommended**: Accept for now; revisit when App Check enforcement lands in Phase 6
  - Strength: App Check (Phase 6) restricts Firestore access to attested instances of this app,
    which closes the drive-by-with-a-Google-account path without a per-operation read. Cost of the
    alternative is real and permanent; cost of this is bounded and already scheduled.
  - Tradeoff: Between now and Phase 6 the store is open to any authenticated account. The window is
    exactly as long as this change takes, and nothing user-facing is deployed inside it.
  - Confidence: MED — App Check does narrow the caller set, but enforcement has never been switched
    on in this project, so its behaviour here is unproven.
  - Blind spot: Whether App Check enforcement alone satisfies whatever GDPR baseline the director
    eventually sets (PRD Open Question #2) has not been checked.
- **Fix B**: Add an `exists()` check on `allowedUsers/$(request.auth.token.email.lower())`
  - Strength: Enforces FR-003/FR-004 at the layer that actually decides, independent of the client,
    App Check, and any future surface that talks to Firestore.
  - Tradeoff: One extra document read per template operation, billable against the Spark 50K/day
    budget, plus added latency. It also couples every template operation to the allowlist's
    email-keyed shape, which `firestore.rules:54-56` warns is a different identifier space.
  - Confidence: HIGH — `exists()` against a known path is a standard rules idiom.
  - Blind spot: Not measured whether rules-internal reads count against the Spark read quota the
    same way client reads do.
- **Decision**: ACCEPTED via Fix A — accept the gap now, revisit when App Check enforcement lands in
  Phase 6. Queued in `follow-ups/review-fixes.md` with the specific check Phase 6 owes (an unattested
  caller must be *rejected*, not merely "the app still works") and Fix B named as the fallback if
  enforcement is deferred again.

### F2 — `npm run emulators` fails on a fresh clone

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `package.json` — `"emulators"` script
- **Detail**: The script passes `--import=./.emulator-data`, and `.emulator-data/` is gitignored, so
  it is absent on every fresh clone and every new machine. Verified empirically on an isolated port:
  `firebase emulators:exec --import=./.does-not-exist-probe` exits 1 with
  `Error: Directory "…\.does-not-exist-probe" does not exist.` A second probe confirmed that an
  **empty** directory is accepted (exit 0), so the whole defect is a missing `mkdir`.
  This breaks the plan's own Phase 5 manual criterion 5.4 — "a newcomer can start emulators, seed the
  allowlist and sign in using `src/CLAUDE.md` alone" — and it is the first thing `S-03`'s implementer
  will hit.
- **Fix**: Create the directory before starting, portably, in the script itself —
  `node -e "require('fs').mkdirSync('.emulator-data',{recursive:true})" && firebase emulators:start --import=./.emulator-data --export-on-exit`.
  `mkdir -p` is not portable to cmd.exe, which is what npm scripts run through on Windows.
- **Decision**: SKIPPED — script stays as is. Consequence accepted: it is not self-bootstrapping, so
  Phase 5's criterion 5.4 is satisfiable only through documentation. The `mkdir .emulator-data` step
  was added to `src/CLAUDE.md` while fixing F5, which is what keeps 5.4 reachable.

### F3 — Manual criterion 1.11 is checked without observable evidence

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `context/changes/trimester-report-templates/plan.md` — Progress row 1.11
- **Detail**: 1.11 is "Restarting the emulators preserves the seeded allowlist document", marked
  `[x]` — but `.emulator-data/` does not exist in the working tree, and it is the only mechanism by
  which a restart could preserve anything. The emulator suite is currently running (Firestore 8080,
  Auth 9099, UI 4000, started 12:36), so `--export-on-exit` has not fired yet. Combined with F2, the
  documented restart path could not have succeeded on this machine. 1.8, 1.9 and 1.10 are
  independently credible — the running emulators plus a reachable app are consistent with them.
  This is not an accusation of carelessness: the seed lives in the emulator's memory right now and
  the check is genuinely unfinishable until the process exits cleanly.
- **Fix**: After F2 lands, exit the running emulator with Ctrl+C (not by closing the window — only a
  clean exit triggers `--export-on-exit`), confirm `.emulator-data/` appears, restart, and confirm the
  allowlist document is still there. Until then, flip 1.11 back to `[ ]`.
- **Decision**: ACCEPTED AS RISK — 1.11 stays `[x]`. The import/export round-trip is a standard
  mechanism and will work once the directory exists, but it has never been observed in this repo.

### F4 — `localhost` rather than `127.0.0.1` for the emulator host

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/app/app.config.ts` — `EMULATOR_HOST`
- **Detail**: `firebase-tools` binds and reports the emulators on `127.0.0.1` (its own error output
  in this session read "Port 8080 is not open on localhost (127.0.0.1)"). The app connects to
  `localhost`, which on Windows resolves `::1` before `127.0.0.1`. It works on this machine — manual
  criteria 1.8 and 1.9 passed — but the mismatch is a known source of intermittent
  connection failures on IPv6-preferring setups, and it fails in a way that looks like a Firebase
  problem rather than a hostname problem.
- **Fix**: Change `EMULATOR_HOST` to `'127.0.0.1'` to match what the emulator actually binds.
- **Decision**: SKIPPED — works on the one development machine that exists.

### F5 — `src/CLAUDE.md` now states the opposite of what the repo does

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/CLAUDE.md:46-50`
- **Detail**: The file still says "There is no emulator suite, and local development therefore talks
  to the *production* Firebase project" and closes with "treat anything you run locally as writing to
  production." Both are false as of `f0c08c5`. `context/foundation/lessons.md` records exactly this
  rule — "when editing a document makes another of its sections contradictory or stale, that section
  is in scope for the same change" — and the plan does schedule the rewrite, in Phase 5 of this same
  change. So the letter of the lesson is satisfied at change granularity. What is not satisfied is
  its purpose: this is the file future agents read first, and it will actively mislead anyone who
  reads it during Phases 2–4, including a fresh context resuming this very plan.
- **Fix**: Move the one contradicted paragraph now rather than in Phase 5 — replacing it with a
  two-line pointer to `npm run emulators` costs nothing and Phase 5 can still expand it.
- **Decision**: FIXED — `src/CLAUDE.md:46-50` replaced with the current state: two-command local
  startup, the JDK requirement, how to seed the allowlist in the emulator UI, the `mkdir
  .emulator-data` bootstrap step (carrying F2's skipped fix as documentation), that only a clean exit
  triggers the export, and that flipping the flag returns to production data with App Check skipped
  while it is on. Phase 5 still owns expanding this into the Common commands list and the Folder map.

### F6 — Rules spec reads `firestore.rules` by a cwd-relative path

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `test/rules/report-templates.test.mjs` — `readFileSync('firestore.rules', 'utf8')`
- **Detail**: Correct under `npm run test:rules`, which `firebase emulators:exec` runs from the
  project root. It breaks with an unhelpful ENOENT if the file is ever run directly from another
  directory — plausible when debugging a single case, which is the moment someone is least inclined
  to suspect their working directory.
- **Fix**: Resolve the path relative to the module — `new URL('../../firestore.rules', import.meta.url)`
  — so the spec is location-independent.
- **Decision**: SKIPPED — `npm run test:rules` is the only supported entry point and it runs from the
  project root.

## Success criteria re-verification

| Item | Result |
|------|--------|
| 1.4 `npm run lint` | **PASS** — re-run during this review, "All files pass linting" |
| 1.5 `npm test` (headless) | PASS at commit time (50/50). Not re-run — source unchanged since `f0c08c5` |
| 1.6 `npm run build` | PASS at commit time. Not re-run — source unchanged |
| 1.7 dev build | PASS at commit time. Not re-run — source unchanged |
| 1.1 `java -version` | PASS — 21.0.12 LTS |
| 1.2 emulators boot | PASS — observed booting twice during this review |
| 1.3 `npm run test:rules` | PASS at commit time (11/11). **Not re-run**: the user's emulator holds port 8080, and killing it would destroy the in-memory allowlist seed that manual verification depends on |
| 1.8–1.10 manual | Accepted — consistent with the running emulator suite |
| 1.11 manual | **Contested — see F3** |
