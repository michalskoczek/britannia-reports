<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Trimester/Semester Report Templates

- **Plan**: `context/changes/trimester-report-templates/plan.md`
- **Scope**: Full plan — Phases 1–6 of 6
- **Commits**: `f0c08c5`, `8a822b2`, `f386745`, `8551b70`, `409a8eb`, `68cbb9f`, `c253fa7` (44 files, +4863/−130)
- **Date**: 2026-07-30
- **Verdict**: NEEDS ATTENTION
- **Findings**: 0 critical, 2 warnings, 3 observations

**Reviewer blind spot, stated up front:** the reviewing agent implemented Phase 6 in this same
session, so F1 and F3 are findings against its own work and F1 in particular is the kind of gap an
author is least likely to see. Phase 1's review carried the same caveat. The findings established by
*running* things — the re-verified gates, the branch divergence in F2 — are the ones to trust most.
The prior review at `reviews/impl-review-phase-1.md` and its triage outcomes in
`follow-ups/review-fixes.md` were treated as settled: findings closed there are not re-derived here.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | WARNING |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | WARNING |

## Findings

### F1 — The Phase-1 risk acceptance rests on a Phase-6 check that was never run

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: `context/changes/trimester-report-templates/follow-ups/review-fixes.md:21-25`; plan `## Progress` row 6.10
- **Detail**: Phase 1's review found that `firestore.rules:53-57` authorizes on `request.auth.uid == uid`
  alone and never consults `allowedUsers`, so any Google account that completes Firebase sign-in can
  create, read and delete under its own `users/{uid}/reportTemplates` subtree. That was accepted via
  Fix A — **explicitly and solely because App Check enforcement in Phase 6 would close the path** — and
  the follow-up file assigned "whoever runs Phase 6" one specific check: *"confirm a caller without a
  valid App Check token is rejected by Firestore — not merely that the app still works. The app working
  proves attestation succeeds, not that unattested callers fail."*

  Phase 6 enabled enforcement and verified criterion 6.10, whose wording is *"App Check shows verified
  requests, then enforcement is enabled and the app still works"* — verbatim the insufficient check the
  follow-up warned against. The owed check was not performed, and the follow-ups file was not read
  during Phase 6. So the acceptance is now resting on an unverified premise: enforcement showing as
  *on* in the Console is not evidence that unattested Firestore calls are *rejected*, and a
  reCAPTCHA-key or monitoring-vs-enforce misconfiguration presents identically from inside a working
  app.

  Two things make this worse than it was at Phase 1. The acceptance's own stated bound was *"nothing
  user-facing is deployed inside [the window]"* — that bound has now been crossed; the store holds real
  teacher data behind a live public URL. And the plan is at fault alongside the execution: 6.10 was
  written before the follow-up existed and was never tightened to match it, so following the plan
  exactly could not discharge the obligation.
- **Fix A ⭐ Recommended**: Verify enforcement actually rejects an unattested caller, then record the result
  - Strength: Directly discharges the owed check and either confirms the accepted risk is closed or
    surfaces a live misconfiguration while it is still cheap. Cheapest path: a `curl` against the
    Firestore REST endpoint with a valid ID token and no App Check header should return 403.
  - Tradeoff: Needs an ID token pulled from a signed-in session; a few minutes of fiddling, not a code
    change.
  - Confidence: HIGH — a negative test against a live endpoint is unambiguous, unlike inferring from
    the app working.
  - Blind spot: Does not address whether App Check satisfies whatever GDPR baseline the director
    eventually sets (PRD Open Question #2), which the follow-up also carried unresolved.
- **Fix B**: Implement the follow-up's named fallback — add an `allowedUsers` `exists()` check to the rule
  - Strength: Moves enforcement to the layer that actually decides, independent of App Check, the
    client, and any future surface. Closes the gap whether or not attestation works.
  - Tradeoff: One extra document read per template operation against the Spark 50K/day budget, plus it
    couples every template op to the allowlist's email-keyed shape that `firestore.rules:38-41` warns is
    a different identifier space. Requires a rules redeploy and new `test/rules/` scenarios.
  - Confidence: HIGH — `exists()` on a known path is a standard idiom; the harness exists to test it.
  - Blind spot: Whether rules-internal reads bill against the Spark read quota as client reads do was
    never measured.
- **Decision**: FIXED via Fix B (2026-07-31). `firestore.rules` gained an `isAllowlisted()` function —
  `email_verified` plus `exists()` on `allowedUsers/{lowercased email}` — ANDed onto the templates
  rule's read/create/delete. Six new scenarios in `test/rules/report-templates.test.mjs` (11 → 17,
  all passing), four of them covering a signed-in non-allowlisted account operating on its **own**
  subtree, which is the exact case the old rule allowed. Rules redeployed to production.

  **Why this could not lock out a working teacher:** `isAllowlisted()` requires exactly the conditions
  the `allowedUsers` read rule already enforces for sign-in, and `SessionService` refuses a session
  unless that read succeeds — so anyone able to use the app already satisfies the new predicate.

  **Emulator artefact, reproduced and bounded:** denials of a *write* now log
  `evaluation error at L90` instead of a plain `false`, which began when the lookup entered the
  expression. Ten probe cases plus the 17 suite tests confirm every outcome is correct — reads deny
  cleanly, owners are still allowed, a create of a genuinely new template still succeeds — and the
  branches that log it were going to deny anyway. The emulator's internal reason was not determined.
  Recorded in `firestore.rules` so the next reader does not chase it.

  Fix A's verification (proving an *unattested* caller is rejected) is now **moot for this gap** —
  authorization no longer depends on App Check for it — but remains unverified as a property of App
  Check itself. Carried forward in `follow-ups/review-fixes.md`.

### F2 — Production runs a branch `master` does not have; the next deploy from `master` silently reverts it

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: N/A — branch state: `10xdevs-S02` is 222 commits ahead of `master`, 0 behind
- **Detail**: Phase 6 deployed from `10xdevs-S02`. `master` contains none of `S-05a`, `S-05b`, `S-01` or
  `S-02`. The deploy command `src/CLAUDE.md` documents is a two-liner with no branch guard, so anyone
  who checks out `master`, builds and deploys — the ordinary way to ship a hotfix — silently rolls
  production back past the sign-in gate. That would re-expose all four report forms publicly (undoing
  the FR-004 regression this deploy just shipped) and strand every saved template behind a client that
  no longer has a panel to read it. Firestore data does not roll back with hosting, so the templates
  would survive invisibly rather than being lost.

  Nothing in the repo records that production is ahead of `master`. The plan did not require a merge —
  Phase 6 legitimately sits before archive — so this is a gap in the plan's model of the deploy, not a
  deviation from it.
- **Fix A ⭐ Recommended**: Merge `10xdevs-S02` into `master` so the default branch matches production
  - Strength: Removes the hazard outright rather than documenting around it, and matches what `S-01`
    and `S-05b` already did (both merged before this deploy published them). The branch is 0 behind, so
    the merge is a fast-forward with no conflict surface.
  - Tradeoff: Merging is a decision about branch strategy that belongs to you, not to a review; the
    change is not yet archived.
  - Confidence: HIGH — `git log HEAD..master` is empty, so nothing on `master` is at risk.
  - Blind spot: Whether this repo intends `master` to track production at all — the 222-commit
    divergence suggests it may deliberately not.
- **Fix B**: Record the constraint in `src/CLAUDE.md` next to the deploy commands
  - Strength: Zero risk, and puts the warning exactly where someone about to deploy will read it.
  - Tradeoff: The hazard remains; it relies on a human reading a comment at the right moment, which is
    the failure mode `infrastructure.md`'s empty-deploy row already exists to guard against.
  - Confidence: MEDIUM — documentation prevents this only if read.
  - Blind spot: None significant.
- **Decision**: PENDING

### F3 — No rollback target recorded for the live release

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: plan `## Progress` → Phase 6 → Deploy record
- **Detail**: The plan's Phase 6 contract says to record the hosting version id from the CLI output, but
  `firebase-tools@15` prints none on a successful hosting deploy and `hosting:versions:list` is not a
  command in this version. The release timestamp was recorded instead, and `infrastructure.md`'s
  rollback procedure — which documented two commands that do not exist — was corrected in the same
  phase. The residual gap: rolling back still requires opening the Console to find the version id, at
  the one moment nobody wants an extra lookup.
- **Fix**: Read the live version id from Console → Hosting → Release history and paste it into the plan's
  Deploy record, so the rollback command is copy-pasteable.
- **Decision**: PENDING

### F4 — `permission-denied` reaches the teacher as a message with three different causes

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/app/templates/templates.service.ts:203-208`; `src/app/templates/template-panel/template-panel.component.html:4-25`
- **Detail**: The name input and Save button render unconditionally, above the load-failure block — so
  Save is reachable when the list failed to load. In that state `templates()` returns `[]` (the signal is
  gated on `loadedFor`), the duplicate-name check cannot fire, and a save under an existing name reaches
  Firestore where `allow update: if false` rejects it. The service maps that to `permission-denied`, and
  the teacher sees a permissions error for what is actually a name collision. The service comments
  acknowledge this ambiguity deliberately for the two-tabs race; a failed list load is a second, quieter
  path to it.

  Enabling App Check enforcement in Phase 6 added a third cause to the same message — a broken
  attestation also surfaces as `permission-denied` on the Firestore call. One string now covers "name
  taken", "rule refused" and "App Check refused", which is the ambiguity `TemplatesFailure` was
  introduced to prevent.

  Also in this area, and cosmetic by comparison: a successful save after a failed load leaves
  `loadFailureKey` set, so the panel keeps showing the retry block and the just-saved template is not
  listed even though the snackbar confirms it saved.
- **Fix**: Clear `loadFailureKey` on a successful save and re-run `reload()` after one, so the list
  recovers and the duplicate check has real data to work against on the next attempt.
- **Decision**: PENDING

### F5 — Four unplanned file changes, all justified and disclosed

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `docs/pdf-fidelity-check.md`; `src/app/shared/testing/templates-testing.ts`; `src/app/shared/testing/pdf-fidelity/pdf-fidelity-capture.spec.ts`; `.gitignore`
- **Detail**: Files changed that no phase contract names, each with a stated reason:
  `docs/pdf-fidelity-check.md` §5 gained a warning about Chrome's download path not overwriting stale
  captures — a trap found while running Phase 4's comparison, which had silently compared the wrong
  files once; `templates-testing.ts` plus the capture-spec edit are a forced consequence of mounting the
  panel inside `SemestrReportComponent`, which made two existing specs unable to construct it;
  `.gitignore` gained three emulator debug logs alongside the planned `.emulator-data/`. Phase 6 also
  reconciled six sections across `infrastructure.md`, `roadmap.md`, `prd.md` and `src/CLAUDE.md` that
  asserted the app was undeployed.

  All are defensible and none is silent — each is recorded in `change.md` or a commit body, which is
  what `lessons.md`'s rule asks for. Logged so a strict scope-discipline read has the list in one place
  rather than as a defect.
- **Fix**: None needed — accept as disclosed scope.
- **Decision**: PENDING

## Success criteria re-verification

Re-run in full during this review, not taken on trust:

| Item | Result |
|------|--------|
| `npm run lint` | **PASS** — "All files pass linting" |
| `npm test -- --watch=false --browsers=ChromeHeadless` | **PASS — 122/122** (was 50/50 before this change; +72 specs) |
| `npm run build` (production) | **PASS** — five pre-existing SCSS/CommonJS warnings, no new ones |
| `npm run build -- --configuration development` | **PASS** |
| `npm run test:rules` | **PASS — 11/11**, re-run at the start of Phase 6 |
| `dist/browser/index.html` exists | **PASS** — 28 files |
| i18n key parity | **PASS — 307/307**, identical nested paths verified structurally, not by line count |
| Form-model contract (48 controls, 14 arrays) | **PASS** — unchanged, and now backed by the partition assertion |
| Partition 10 + 4 + 12 + 22 = 48, pairwise disjoint | **PASS**, plus an unplanned bonus assertion that `TEMPLATE_DOMAIN_DEFAULTS` matches `createForm()` |
| PDF fidelity | PASS at Phase 4 — no visible differences, both semestr fixtures, `cmp -l` differences confined to `/CreationDate` and trailer `/ID` |
| Phase 1 review F3 (1.11 restart preserves the seed) | **Now empirically supported** — `.emulator-data/` exists with `auth_export`, `firestore_export`, `firebase-export-metadata.json`. The contested item is no longer contested. |
| Manual rows 6.5–6.11 | Confirmed by the user. 6.10 is checked but did not discharge the follow-up's owed check — see F1 |

## What the review found solid

Recorded because a findings list read alone misrepresents the change.

- **The field-domain boundary is genuinely machine-checked**, exactly as the plan argued it should be.
  The partition spec catches a duplicate within one set (sorted-array equality, not a `Set`), and the
  extra defaults assertion closes the one drift the plan named as silent-in-both-directions.
- **The gateway/service seam is a faithful copy of `src/app/auth/`.** No `@angular/fire` import outside
  `templates.gateway.ts`; every decision in the service; `Timestamp` duck-typed rather than imported so
  the fakes stay honest. `TemplatesFailure` as a closed union with a total `Record` in the panel means a
  new failure mode fails to compile rather than reaching a teacher as "something went wrong".
- **The date round-trip avoids the trap the plan flagged.** Conversion is confined to the form boundary,
  `Moment` is duck-typed so the file does not depend on which adapter is configured, and both
  directions go through local accessors rather than `toISOString()` — which is what keeps the calendar
  day stable west of Greenwich.
- **Two deviations from the plan that improved on it**, both documented at the call site: the snackbar
  passes an explicit 4s duration because Material's default is `0` ("never dismiss"), which the plan's
  "use Material defaults" would have shipped as a permanent nag; and Enter in the name field is
  intercepted because the panel sits inside the report's `<form>`, whose submit handler downloads a PDF.
