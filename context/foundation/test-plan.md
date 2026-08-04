# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1–§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-08-04

## 1. Strategy

Tests follow three non-negotiable principles for this project:

1. **Cost × signal.** The cheapest test that gives a real signal for the
   risk wins. Do not promote to e2e because e2e "feels safer." Do not put a
   vision model on top of a deterministic visual diff that already catches
   the regression.
2. **User concerns are first-class evidence.** Risks anchored in "the team
   is worried about X, and the failure would surface somewhere in <area>"
   carry the same weight as PRD lines or hot-spot data.
3. **Risks are scenarios, not code locations.** This plan documents *what
   could fail* and *why we believe it's likely* — drawn from documents,
   interview, and codebase *signal* (churn, structure, test base). It does
   NOT claim to know which line owns the failure. That knowledge is
   produced by `/10x-research` during each rollout phase. If the plan and
   research disagree about where the failure lives, research is the
   ground truth.

Hot-spot scope used for likelihood weighting: `src/`, `test/`,
`firestore.rules` — excluding docs, context, fixtures, `node_modules`,
`dist`.

## 2. Risk Map

The top failure scenarios this project must protect against, ordered by
risk = impact × likelihood. Risks are failure scenarios in user / business
terms, not test names. The Source column cites the *evidence that surfaced
this risk* — never a specific file as "where the failure lives" (that is
research's job, see §1 principle #3).

| # | Risk (failure scenario) | Impact | Likelihood | Source (evidence — not anchor) |
|---|---|---|---|---|
| 1 | A teacher fills a complete report, clicks download, and **no PDF appears** — the builder throws on input the teacher could legitimately enter (empty optional section, long free text, non-ASCII name, an array the form never populated). The error reaches the browser console only; the teacher gets no signal and cannot tell whether they mis-filled or the app broke. | High | High | interview Q1, interview Q3; hot-spot dir `src/app/semestr-report/` (16 commits/30d), `src/app/year-report/` (9 commits/30d); roadmap §Baseline — observability absent, only diagnostic is a console error at bootstrap; `src/CLAUDE.md` §Hard rules — "`npm test` smoke-covers that every report type still renders a PDF; it asserts nothing about layout" |
| 2 | **Wrong-child or wrong-gender content reaches a parent.** Three writers touch one 48-control form — the student picker, template apply, and the sex-driven mark remap. A drift across the field partition, an incomplete remap, or an order-dependent interaction puts another child's data or the wrong gendered sentence into the PDF, and the `required` validator still passes so nothing complains. | High | High | PRD FR-013 amendment 2026-08-03 (this defect class already shipped once and was silent); PRD FR-011, US-01 acceptance criteria; roadmap S-02 Outcome — "a template that pre-filled a mark would turn 'the teacher missed one select' into 'a parent received another child's grade'"; hot-spot dir `src/app/students/` (37 commits/30d), `src/app/semestr-report/` (16), `src/app/templates/` (15) |
| 3 | **A security-rules regression exposes one teacher's students to another.** The rules-test harness exists and covers 36 scenarios, but nothing runs it — it is not wired into `npm test` and there is no CI. A rules edit ships to production unverified, and the data behind it is minors' personal data with no export, retention, or consent story. | High | Medium | interview Q4; PRD Open Question #2 (GDPR baseline for minors' data, still open); roadmap Open Roadmap Question #1 and the residual note on #5 — "run it yourself whenever the rules change, before deploying"; hot-spot: security-rules surface, 6 commits/30d |
| 4 | **Authenticated is not authorized.** Any Google account on the internet can complete sign-in; only the teacher allowlist separates a stranger from a roster. If the client-side session state machine is the real boundary — or an allowlist removal does not take effect for a live session — an account reads data that is not theirs. | High | Medium | PRD FR-003, FR-004, §Access Control Changes; roadmap S-01 "What it cost that the plan did not predict" — three defects reached a running browser through a fully green suite, all three in the seam between the app and Firebase; hot-spot dir `src/app/auth/` (26 commits/30d) |
| 5 | **A release silently regresses production.** Deploying from the wrong branch rolls the app back past the sign-in gate and re-exposes all four report forms publicly; a build-output / hosting-root misalignment publishes an empty directory over the live site. The deploy command exits 0 in both cases. Four manual deploys ran in eight days with no gate between the working tree and production. | High | Medium | `src/CLAUDE.md` §Common commands and §Conventions — deploy-branch rule, build-output alignment rule, "there is no CI gate yet"; roadmap S-01…S-04 Status (deploys on 2026-07-30, 07-31, 08-04); roadmap §Parked "CI/CD pipeline"; interview Q4 |
| 6 | **The year-end report's PDF fidelity is claimed, not proven.** A table conversion put descriptor code into a report covered by a preservation guardrail, past its own plan's stop-condition, and the fidelity capture was skipped by recorded triage decision. The only baseline that exists was taken downstream of the change it is supposed to doubt. Separately, the fidelity fixtures encode template facts in prose, so a template change can make a fixture describe a state the UI no longer produces while the reference PDF still matches and the check still passes. | Medium | Medium | roadmap Open Roadmap Question #7 (restated 2026-08-03 and still open after S-04); PRD §Success Criteria → Guardrails, FR-015; hot-spot dir `src/app/year-report/` (9 commits/30d) |

Risk #4 is the mandatory abuse row (authorization / ownership — does the
store check that this record belongs to you, not merely that you are signed
in?). Risk #3 carries the untrusted-data-at-rest half of the same lens.
Secret leakage was considered and deliberately excluded: the PRD and
`src/CLAUDE.md` both record the Firebase configuration and reCAPTCHA site
key as public by design, protected by security rules rather than by
secrecy — testing for their exposure would encode a misunderstanding.

`src/app/shared/` tops the churn table (44 commits/30d) but did not raise a
risk on its own: the churn is dominated by the design-language extraction
and the shared form wrappers, which is high change with low risk
concentration.

### Risk Response Guidance

| Risk | What would prove protection | Must challenge | Context `/10x-research` must ground | Likely cheapest layer | Anti-pattern to avoid |
|---|---|---|---|---|---|
| #1 | For every legitimate state a teacher can put a report form into, a PDF document is produced — not merely that the code path ran. Includes minimally-filled forms, maximally-filled forms, untouched optional sections, long free text, and non-ASCII names. | "The smoke spec renders a PDF, so generation is safe." It renders one fixture per report type, from a happy-path shape. | Which form states are legitimately reachable (validators vs. defaults vs. never-bound arrays); what the PDF builder consumes vs. what the form holds; where the throw actually surfaces and what the user sees when it does. | unit / component, against the existing PDF interception helper | Asserting the document definition equals a snapshot of itself — a tautology that green-lights today's bugs. Assert that a document was produced and its content-carrying regions are non-empty *for that input*, not that bytes match a copy of the output. |
| #2 | Picking a student, applying a template, and changing sex by hand — in any order — leaves every field owned by exactly one writer, and every descriptive-mark select holds a value that exists in its current option list. | "The field-partition spec passes, so pre-fill is correct." The partition proves *which fields* each writer touches; it proves nothing about *what values* land in them. | How the remap keys off the sex stream versus the patch; how each mark's option list is constructed; the confirm / cancel revert path; the quick-add path that creates and selects in one step. | component integration, on the one form where all three writers meet | Testing each writer in isolation. The risk lives in their interaction and its order-independence; single-writer specs will all pass while the composite is broken. |
| #3 | A caller who is not the owning, allowlisted account is denied read, create, update and delete on every collection — asserted by a suite that **runs**, not one that merely exists. | "36 scenarios exist, so the rules are covered." Coverage that nothing executes before a deploy is documentation, not a control. | The current rule set per collection and which operations each allows to whom; the fixture-isolation constraint that governs adding a third rules-test file. | rules tests under the emulator (harness exists), plus a gate that runs them | Adding scenarios without giving the new file its own namespace — it will break an untouched suite, and the error will point at the rules rather than at the runner. See `context/foundation/lessons.md`. |
| #4 | Removing an account from the allowlist denies its store reads, independently of what the client's session state believes. The rules are the boundary; the guard is user experience. | "The guard redirects, so the data is protected." A guard is client code; an attacker does not run your router. | Where authorization is actually evaluated; when the allowlist is read and what a stale read costs; whether a session signal can outlive an allowlist removal. | rules tests for the boundary, plus unit tests on the session state machine for the seam | Proving the boundary through the UI. If the assertion travels through a component, it is testing the guard, not the rule. |
| #5 | A change that would break lint, types, the unit suite, or the rules suite cannot reach production; a build that would publish the wrong tree cannot be deployed. | "We run the commands before deploying." Four deploys in eight days with no enforced gate is a habit, not a control. | Which commands are the real gates and what each needs to run unattended (headless browser, JDK, emulator); the two build configurations that type-check different files. | CI wiring plus a pre-deploy check — this is a gate, not a test | Wiring a gate onto a runner that cannot start the emulator or a browser. A gate that skips silently is worse than no gate, because it converts an known risk into a believed-safe one. |
| #6 | The year-end PDF produced today is byte-equivalent — outside the two documented non-deterministic regions — to the one produced before the table conversion. | "S-04 captured all four report types byte-identical, so year-end is fine." That baseline sits downstream of the change under suspicion. | The pre-conversion commit to capture against; the two non-deterministic regions; whether the fixture's prose still describes the template the UI renders today. | one-shot capture and diff, using the existing fidelity harness | Treating the current output as the oracle. Here the oracle must be a **pre-change** capture — that is what makes this comparison legitimate rather than tautological. |

## 3. Phased Rollout

Each row is a discrete rollout phase that will open its own change folder
via `/10x-new`. Status moves left-to-right through the values below; the
orchestrator updates Status as artifacts appear on disk.

| # | Phase name | Goal (one line) | Risks covered | Test types | Status | Change folder |
|---|---|---|---|---|---|---|
| 1 | PDF generation survives the real input space | Prove a teacher's report never fails to produce a file for input they could legitimately enter | #1 | unit, component | change opened | `context/changes/testing-pdf-input-space/` |
| 2 | Pre-fill correctness across the three writers | Prove that whatever order a teacher picks, applies and edits in, no field carries another child's or another gender's content | #2 | component integration | not started | — |
| 3 | The access boundary is the rules, not the client | Prove a non-owning or de-allowlisted caller is denied at the store, regardless of client state | #3, #4 | rules tests, unit | not started | — |
| 4 | Year-end fidelity baseline recovered | Give the one preserved report whose fidelity was never verified a real pre-change comparison | #6 | fidelity capture and diff | not started | — |
| 5 | Quality gates wired | Make it impossible to reach production through a red lint, red types, red suite, red rules suite, or the wrong build tree | #5, and enforcement for #1–#4 and #6 | gates | not started | — |

Ordering rationale: Phase 1 attacks the highest-rated risk against a
harness that already exists, so it is the cheapest real signal available.
Phase 2 carries the highest-consequence risk but needs composite scenarios,
so it costs more and runs second. Phase 3 has its harness already and must
land before gates, so there is something worth gating. Phase 4 is a
one-shot verification with no ongoing surface, which is why it ranks below
the three phases that build durable coverage. Phase 5 runs last because it
gates what the previous four phases built — locking a floor under a thin
suite buys very little.

**No AI-native rollout phase is scheduled.** Every risk in §2 has a cheaper
deterministic answer: the PDF interception helper reaches the document
definition directly, the field partition is already machine-checked, and
the rules harness runs under the emulator. Layering a vision model over any
of those would cost more per run and give a weaker signal. See §4 for the
one AI-native option that was considered and left unscheduled, and §7 for
the visual-testing exclusion that rules out the usual candidates.

## 4. Stack

The classic test base for this project. AI-native tools (if any) carry a
`checked:` date so future readers can see which lines need re-verification.

| Layer | Tool | Version | Notes |
|---|---|---|---|
| unit + component | Karma + Jasmine (`@angular/build:karma`) | karma 6.4, jasmine-core 4.5 | Pinned by convention — do not introduce Jest, Vitest, or Web Test Runner during routine work. 23 specs in `src/`, spread across auth, students, templates, all four reports, and shared components. |
| security rules | `@firebase/rules-unit-testing` under `node --test` | 5.0.1 | Runs outside `src/` under `firebase emulators:exec`; needs a JDK. Deliberately excluded from Karma, `tsconfig.spec.json`, and ESLint. Not wired into `npm test` — see §5. |
| emulation | Firebase Emulator Suite via `firebase-tools` | 15.18.0 | Auth + Firestore + UI. Local development already depends on it; App Check is skipped entirely while emulators are on. |
| PDF fidelity | Project-owned capture harness (separate Karma configuration) | n/a | Reference inputs plus committed reference PDFs and a written comparison procedure under `docs/`. Excluded from the default test run; headed Chrome only. |
| lint + typecheck | ESLint + `angular-eslint`, TypeScript | eslint 9.39, angular-eslint 20.7, typescript 5.8 | Lint is clean and that is a maintained invariant, enforced by habit only. Note that a plain production build type-checks one environment file and not the other. |
| e2e | none — and none planned | — | No rollout phase adds one. Every risk in §2 is reachable at a cheaper layer; promoting to e2e here would buy confidence, not signal. |
| accessibility | none — not in scope | — | Not raised by the PRD, the roadmap, or the interview. Absence is recorded, not planned away. |
| (optional) AI-native | Browser automation against the developer's real Chrome — checked: 2026-08-04 | n/a | **Considered and left unscheduled.** *When NOT to use:* when the assertion can be made against the PDF document definition or the reactive form directly — which is every risk in §2. It would only earn its cost for a surface no deterministic layer can reach, and this project does not currently have one. |

**Stack grounding tools (current session):**
- Docs: none — no Context7 or framework-docs MCP is available in current session; stack facts come from the local manifest, the Angular workspace configuration, and `src/CLAUDE.md`; checked: 2026-08-04
- Search: web search available but not used — no recommendation in this plan depended on a claim that needed external validation, since every named tool is already installed and versioned locally; checked: 2026-08-04
- Runtime/browser: browser automation against the developer's own Chrome is available; noted as a possible verification surface and **not used** — the PDF interception helper reaches the document definition deterministically and more cheaply; checked: 2026-08-04
- Provider/platform: no GitHub, Firebase, or database MCP exposed in current session; `firebase-tools` as a local dev dependency plus the emulator suite is the grounded substitute for anything a provider MCP would have offered; checked: 2026-08-04

## 5. Quality Gates

The full set of gates that must pass before a change reaches production.
"Required after §3 Phase N" means the gate is enforced once that rollout
phase lands; before that, the gate is planned.

| Gate | Where | Required? | Catches |
|---|---|---|---|
| lint + typecheck (both build configurations) | local, then CI | required after §3 Phase 5 | syntactic and type drift, including errors that live only in the non-default environment file |
| unit + component suite, headless | local, then CI | required after §3 Phase 5 | logic regressions, including everything Phases 1 and 2 add |
| security-rules suite under the emulator | local, then CI | required after §3 Phase 5 | cross-teacher access regressions; this is the gate Risk #3 is entirely about |
| PDF fidelity capture and diff | local, before merge | required after §3 Phase 4, for any change touching a report component or its inputs | silent layout or content drift in a report covered by the preservation guardrail |
| deploy preconditions (branch, build output present) | between merge and production | required after §3 Phase 5 | the two failure modes in Risk #5 that the deploy command reports as success |
| post-edit hook | local, agent loop | optional | fast feedback at edit time; a convenience, never a substitute for the CI gates above |
| e2e on critical flows | — | not planned | intentionally absent; see §4 |
| visual diff / multimodal visual review | — | not planned | intentionally absent; see §7 |

The first five rows are all wired by §3 Phase 5, except the fidelity row,
which Phase 4 wires. No row in this table is aspirational — every required
gate names the rollout phase that makes it real.

## 6. Cookbook Patterns

How to add new tests in this project. Each sub-section is filled in once
the relevant rollout phase ships; before that, the sub-section reads
"TBD — see §3 Phase N."

### 6.1 Adding a unit test

- TBD — see §3 Phase 1, for the pattern that asserts a PDF document is
  produced for a given form state without asserting a snapshot of itself.

### 6.2 Adding a component integration test for the report form

- TBD — see §3 Phase 2, for the pattern that exercises the student picker,
  template apply, and the sex-driven remap together in varying order and
  asserts field ownership and value validity.

### 6.3 Adding a security-rules test

- TBD — see §3 Phase 3, for the pattern that proves ownership denial at the
  store, and for the fixture-isolation rule every new rules-test file must
  follow.

### 6.4 Adding a test for a new Firestore-backed feature

- TBD — see §3 Phase 3. The existing gateway / service seam is the shape to
  mirror: the gateway holds every SDK call and makes no decisions, the
  service holds every decision and is unit-tested against a fake gateway.
  The pattern for testing the *boundary* (rules) versus the *seam* (service
  against a fake) is what this entry will record.

### 6.5 Running the PDF fidelity check

- TBD — see §3 Phase 4, for the corrected procedure including which commit
  to baseline against and how to read a fixture whose prose may no longer
  describe the template.

### 6.6 Per-rollout-phase notes

(Filled in as phases land. Each `/10x-implement` run appends a two-to-three
line note capturing anything surprising the phase taught.)

## 7. What We Deliberately Don't Test

Exclusions agreed during the rollout. Future contributors should respect
these unless the underlying assumption changes.

- **UI snapshots and pixel-diff visual regression** — they break constantly
  and catch little, responsive layout is an explicit PRD non-goal, and
  visual checks on this project are made by eye in the running app.
  Re-evaluate if a second contributor starts changing shared styles without
  running the app. (Source: Phase 2 interview Q5.)
- **The three non-templated report types (year-end, Cambridge, Teddy Eddie)
  beyond what already exists** — they carry neither templates nor the
  picker and are frozen behind a preservation guardrail, so the smoke
  coverage plus the fidelity harness is the right level of investment.
  Re-evaluate if templates are extended past the trimester/semester form.
  Note this exclusion does **not** cover Risk #6, which is a one-time
  baseline recovery for year-end, not ongoing coverage. (Source: Phase 2
  interview Q5.)
- **PL/EN translation key completeness** — parity is verified by hand and
  currently holds; a test here would restate a check that already happens.
  Re-evaluate if the key count grows enough that manual parity stops being
  credible. (Source: Phase 2 interview Q5.)
- **Secret exposure in the shipped bundle** — the Firebase configuration
  and reCAPTCHA site key are public by design and protected by security
  rules, not by secrecy. Re-evaluate only if a genuinely secret value is
  ever introduced into the client. (Source: PRD §Constraints, `src/CLAUDE.md`
  §Conventions.)

## 8. Freshness Ledger

- Strategy (§1–§5) last reviewed: 2026-08-04
- Stack versions last verified: 2026-08-04
- AI-native tool references last verified: 2026-08-04

Refresh (`/10x-test-plan --refresh`) when:

- a new top-3 risk surfaces from the roadmap or archive,
- a recommended tool's `checked:` date is older than three months,
- the project's tech stack changes (new framework, new test runner),
- §7 negative-space no longer matches what the team believes.
