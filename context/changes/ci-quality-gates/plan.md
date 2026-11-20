# CI Quality Gates Implementation Plan

## Overview

Put on a server the checks that today run only on the developer's machine, or not at all:
lint, typecheck, both production and development builds, the unit suite, the Firestore rules
suite, and the e2e suite — on every pull request into `develop` or `master`. This is
`context/foundation/test-plan.md` Phase 6 ("Quality gates wired"), minus the deploy
preconditions, which belong to the deploy workflows (separate change).

## Current State Analysis

- No `.github/` directory; nothing runs on a server.
- Locally enforced: lefthook `pre-commit` (`tsc --noEmit` + ESLint on staged files) and the
  per-edit ESLint hook. Neither checks Angular templates (`strictTemplates` is read by `ngc`,
  not `tsc`) nor the non-default environment file.
- `npm run test:rules` (36 scenarios) runs under `firebase emulators:exec` and needs a JDK;
  nothing invokes it.
- The e2e suite (`test/e2e/`, 4 specs) needs the emulators, the dev server and a session
  captured **by hand** through Google's popup, saved to `test/e2e/.auth/firebase-session.json`
  (gitignored), plus an allowlist seed in `.emulator-data/` (gitignored). None of that exists on
  a runner — the blocker test-plan Phase 6 called out.
- `firebase-tools` is **not** a project dependency, despite `infrastructure.md`; it is installed
  globally on the dev machine (15.26.0).

### Key Discoveries

- Against the Auth emulator the Google popup is a plain HTML account chooser
  (`/emulator/auth/handler`). It can be driven by Playwright: *Add new account* → email →
  *Sign in with Google.com*. Accounts created this way carry `emailVerified: true`, which the
  rules' `isAllowlisted()` requires.
- The chooser's form stays at zero size if *Add new account* is clicked before the popup has
  loaded; `popup.waitForLoadState()` first is required.
- The allowlist can be seeded over Firestore REST as `Bearer owner`, which bypasses rules —
  the same channel the fixture already uses for teardown.
- Verified locally 2026-11-20 on empty emulators: seed + headless sign-in → session file →
  `npx playwright test` 4/4 green.

## Desired End State

A PR into `develop` or `master` shows four checks — **Lint, types, build**, **Unit tests**,
**Firestore rules**, **E2E** — and each one fails the PR when its gate breaks. The ruleset
`protect-master-develop` requires all four.

## What We're NOT Doing

- Deploying anything (staging and production deploy workflows are a separate change).
- Preview channels per PR (decision D2: no).
- Adding `firebase-tools` as a dependency (installed globally in CI, pinned).
- Changing how developers capture a session locally (`e2e:auth:save` stays).
- Visual regression.

## Implementation Approach

One workflow, four parallel jobs, no secrets. The e2e job wraps a shell entry point in
`firebase emulators:exec` so the emulators are guaranteed up for the script and torn down
after it.

## Phase 1: Headless e2e session

### Changes Required:

- `test/e2e/ci-session.mjs` — seed `allowedUsers/<email>` via REST as owner, sign in through
  the app's button and the emulator chooser, write the IndexedDB rows to the session file.
  Output path overridable with `E2E_SESSION_FILE`.
- `test/e2e/fixtures/app.ts` — read the session from `E2E_SESSION_FILE` when set, so a dry run
  of the CI path cannot overwrite a hand-captured session.

### Success Criteria:

#### Automated Verification:

- [x] Script produces a session for an allowlisted, email-verified account against empty emulators
- [x] `npx playwright test` passes 4/4 on that session

## Phase 2: Workflow

### Changes Required:

- `.github/workflows/ci.yml` — jobs `static`, `unit`, `rules`, `e2e`; Node 22, Temurin 21,
  emulator jar cache, Playwright traces uploaded on failure.
- `test/e2e/run-ci.sh` — start `ng serve`, wait for it, create the session, run the suite.

### Success Criteria:

#### Automated Verification:

- [ ] All four jobs green on the PR that introduces them

#### Manual Verification:

- [ ] A deliberately broken gate turns its job red (e.g. a lint error pushed to a scratch branch)

## Phase 3: Make the gates required

### Changes Required:

- Ruleset `protect-master-develop`: add required status checks for the four job names.
- `src/CLAUDE.md`, `context/foundation/test-plan.md`, `context/foundation/infrastructure.md`:
  replace "there is no CI gate yet" with what CI now runs; correct the `firebase-tools`
  devDependency claim.

### Success Criteria:

#### Automated Verification:

- [ ] `gh api .../rulesets/26757011` lists the four required checks

## References

- `context/foundation/test-plan.md` §3 Phase 6, §5 gate table
- `docs/PLAN-AUTOMATYZACJI.md` decisions D1–D6

## Progress

### Phase 1: Headless e2e session

#### Automated

- [x] 1.1 Session script produces an allowlisted, verified session against empty emulators
- [x] 1.2 E2E suite 4/4 green on the generated session

### Phase 2: Workflow

#### Automated

- [x] 2.1 All four CI jobs green on the introducing PR — 405d3b2

#### Manual

- [ ] 2.2 A deliberately broken gate turns its job red

### Phase 3: Make the gates required

#### Automated

- [ ] 3.1 Ruleset requires the four checks
- [ ] 3.2 Docs describe the CI gates and the firebase-tools install correctly
