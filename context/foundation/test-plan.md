# Test Plan

> Phased test rollout for this project. Strategy is frozen at the top
> (§1–§5); cookbook patterns at the bottom (§6) fill in as phases ship.
> Read before writing any new test.
>
> Refresh: re-run `/10x-test-plan --refresh` when stale (see §8).
>
> Last updated: 2026-09-08 (drift refresh — §4/§5 contradicted disk: a
> Playwright suite exists and lint/typecheck are already enforced locally)

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
| 1 | A teacher fills a complete report, clicks download, and **no PDF appears** — the builder throws on input the teacher could legitimately enter (empty optional section, long free text, non-ASCII name, an array the form never populated). The error reaches the browser console only; the teacher gets no signal and cannot tell whether they mis-filled or the app broke. | High | High | interview Q1 2026-09-08 — still the top worry, unchanged in wording; interview Q2 2026-09-08 — a lived burn: the untouched form crashed while the suite was green; interview Q3; churn as of 2026-08-04 (see the calibration note below): `src/app/semestr-report/` 16 commits/30d, `src/app/year-report/` 9 commits/30d; roadmap §Baseline — observability absent, only diagnostic is a console error at bootstrap; `src/CLAUDE.md` §Hard rules — "`npm test` smoke-covers that every report type still renders a PDF; it asserts nothing about layout" |
| 2 | **Wrong-child or wrong-gender content reaches a parent.** Three writers touch one 48-control form — the student picker, template apply, and the sex-driven mark remap. A drift across the field partition, an incomplete remap, or an order-dependent interaction puts another child's data or the wrong gendered sentence into the PDF, and the `required` validator still passes so nothing complains. | High | High | interview Q2 2026-09-08 — a lived burn: a template pre-filled a mark silently, in production; interview Q4 2026-09-08 — the three writers together are the least-tested surface; PRD FR-013 amendment 2026-08-03 (this defect class already shipped once and was silent); PRD FR-011, US-01 acceptance criteria; roadmap S-02 Outcome — "a template that pre-filled a mark would turn 'the teacher missed one select' into 'a parent received another child's grade'"; churn as of 2026-08-04 (see the calibration note below): `src/app/students/` 37 commits/30d, `src/app/semestr-report/` 16, `src/app/templates/` 15 |
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

**Likelihood recalibrated 2026-09-08 — no rating changed.** The Likelihood
column was calibrated on 2026-08-04 against a 30-day window that contained
S-02/S-03/S-04 feature work, and the churn counts quoted in the Source
cells belong to that window. Re-running the same scan today returns six
commits, all of them from the test rollout auditing itself — product code
has been frozen since 2026-08-04, so those figures no longer reproduce and
a reader checking them will find nothing. **No rating is demoted on that
basis.** A frozen codebase lowers near-term likelihood; every risk here is
about what happens when it thaws, and the ratings are set for that.

`src/app/shared/` tops the churn table (44 commits/30d) but did not raise a
risk on its own: the churn is dominated by the design-language extraction
and the shared form wrappers, which is high change with low risk
concentration.

### Risk Response Guidance

| Risk | What would prove protection | Must challenge | Context `/10x-research` must ground | Likely cheapest layer | Anti-pattern to avoid |
|---|---|---|---|---|---|
| #1 | For every legitimate state a teacher can put a report form into, a PDF document is produced — not merely that the code path ran. Includes minimally-filled forms, maximally-filled forms, untouched optional sections, long free text, and non-ASCII names. | "The smoke spec renders a PDF, so generation is safe." *(Corrected 2026-08-14 by §3 Phase 1 — research is ground truth per §1 principle #3.)* The smoke harness renders **two** fixtures per report type, `minimal` and `maximal`, and the minimal shapes are required-fields-only rather than happy-path. The sharper challenge is that the suite was green not because generation was safe but because the fixtures encoded the states that work — `year-report.fixture.ts` said so in its own doc comment, setting `class` explicitly to step around a crash the untouched form reaches. Coverage that is curated by the same hand that wrote the code is not evidence about the input space. | Which form states are legitimately reachable (validators vs. defaults vs. never-bound arrays); what the PDF builder consumes vs. what the form holds; where the throw actually surfaces and what the user sees when it does. | unit / component, against the existing PDF interception helper | Asserting the document definition equals a snapshot of itself — a tautology that green-lights today's bugs. Assert that a document was produced and its content-carrying regions are non-empty *for that input*, not that bytes match a copy of the output. |
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
| 1 | PDF generation survives the real input space | Prove a teacher's report never fails to produce a file for input they could legitimately enter | #1 | unit, component | done | `context/changes/testing-pdf-input-space/` |
| 2 | Pre-fill correctness across the three writers | Prove that whatever order a teacher picks, applies and edits in, no field carries another child's or another gender's content | #2 | component integration | not started | — |
| 3 | The access boundary is the rules, not the client | Prove a non-owning or de-allowlisted caller is denied at the store, regardless of client state | #3, #4 | rules tests, unit | not started | — |
| 4 | Year-end fidelity baseline recovered | Give the one preserved report whose fidelity was never verified a real pre-change comparison | #6 | fidelity capture and diff | not started | — |
| 5 | The click ends in a file | Prove the delivery half of Risk #1 in a real browser: that the download a teacher actually clicks produces a file, and that the page stays free of uncaught exceptions while doing it | #1 (delivery half only; Phase 1 closed the builder half) | e2e | not started | — |
| 6 | Quality gates wired | Put on a server the checks nothing yet runs there: CI, the rules suite on a gate (`npm run test:rules` exists and nothing invokes it), and deploy preconditions on branch and build output — lint and types are already enforced on this machine by the per-edit hook and lefthook `pre-commit`, so the gap is CI, not the checks themselves | #5, and enforcement for #1–#4, #6, and the e2e layer Phase 5 builds | gates | not started | — |

Ordering rationale: Phase 1 attacks the highest-rated risk against a
harness that already exists, so it is the cheapest real signal available.
Phase 2 carries the highest-consequence risk but needs composite scenarios,
so it costs more and runs second. Phase 3 has its harness already and must
land before gates, so there is something worth gating. Phase 4 is a
one-shot verification with no ongoing surface, which is why it ranks below
the three phases that build durable coverage. Phase 5 ranks below all four
because e2e is the most expensive layer to run and to keep, and it earns its
place on exactly one thing no cheaper layer reaches — the delivery half of
Risk #1 (§1 principle #1). It ranks above the gates phase because a gate
over a layer that does not exist yet buys nothing: the e2e layer has to
exist before Phase 6 can require it. Phase 6 runs last because it gates
what the previous five phases built — locking a floor under a thin suite
buys very little.

**No AI-native rollout phase is scheduled.** Every risk in §2 has a cheaper
deterministic answer: the PDF interception helper reaches the document
definition directly, the field partition is already machine-checked, and
the rules harness runs under the emulator. Layering a vision model over any
of those would cost more per run and give a weaker signal. Phase 5 does add
a browser-driven layer, but deterministic Playwright assertions are not
AI-native and do not change this. See §4 for the vision/VLM option that
remains unscheduled — distinct from the deterministic browser automation
Phase 5 schedules — and §7 for the visual-testing exclusion that rules out
the usual candidates.

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
| e2e | Playwright (`@playwright/test`; `@playwright/cli` for the session-capture workflow) | @playwright/test 1.63, @playwright/cli 0.1.19 | One spec today — `test/e2e/seed.spec.ts`, covering the delivery half of Risk #1. It needs two processes already running (`npm run emulators` and `npm start`) plus a hand-captured signed-in session (`npm run e2e:auth:save`, restored by `e2e:auth:restore`), which is why `playwright.config.ts` deliberately carries no `webServer` block; `fullyParallel` is off because the specs share one teacher account and therefore one roster. Run it with `npm run e2e`. **Not** wired into `npm test` and not on any §5 gate yet. §3 Phase 5 builds it out; §7 says where it stops. |
| accessibility | none — not in scope | — | Not raised by the PRD, the roadmap, or the interview. Absence is recorded, not planned away. |
| (optional) AI-native | Vision/VLM review of a rendered page — checked: 2026-09-08 | n/a | **Still unscheduled.** Deterministic browser automation is no longer hypothetical: Playwright is an installed, pinned project dependency with committed configuration, scheduled as §3 Phase 5. That is a deterministic assertion, not an AI-native one, and it does not change the judgement here. *When NOT to use:* when the assertion can be made against the PDF document definition or the reactive form directly — which is every risk in §2 — or when a deterministic browser assertion already reaches it. A vision model earns its cost only on a surface none of those reach; §7 records that this project does not have one. |

**Stack grounding tools (current session):**
- Docs: none — no Context7 or framework-docs MCP is available in current session; stack facts come from the local manifest, the Angular workspace configuration, and `src/CLAUDE.md`. The connected Firebase MCP does expose `developerknowledge_*`, which is a docs surface for the Firebase half of the stack only; checked: 2026-09-08
- Search: web search available but not used — no recommendation in this plan depended on a claim that needed external validation, since every named tool is already installed and versioned locally; checked: 2026-09-08
- Runtime/browser: Playwright is installed as a pinned project dev dependency with committed configuration (`playwright.config.ts`) and npm scripts — no longer ad-hoc automation against the developer's own Chrome. It is used for the delivery half of Risk #1 only; assertions the PDF interception helper or the reactive form reach deterministically and more cheaply stay where they are; checked: 2026-09-08
- Provider/platform: a Firebase MCP **is** connected this session (`firestore_*`, `auth_get_users`, `firebase_validate_security_rules`, `developerknowledge_*`) and is directly relevant to Risks #3 and #4, which are about the Firestore rules boundary; a GitHub MCP is configured but fails to connect. The MCP does **not** replace the emulator for rules testing — `firebase-tools` plus the emulator suite remains the local substitute, and `@firebase/rules-unit-testing` under `node --test` remains the way rules are actually asserted; checked: 2026-09-08

## 5. Quality Gates

The full set of gates that must pass before a change reaches production,
split by whether the gate is live right now or still waiting on a rollout
phase. "Required after §3 Phase N" means the gate is enforced once that
phase lands; before that, it is planned. The split exists because
"required" otherwise means two different things in one table — lint,
typecheck and the per-edit hook are already enforced on this machine, while
everything else still needs CI.

**Enforced on this machine today** (no CI server runs any of these):

| Gate | Where | Required? | Catches |
|---|---|---|---|
| lint (ESLint + `angular-eslint`) | local — per-edit hook, then `pre-commit` | **enforced today** | syntactic and lint-rule drift. Two mechanisms: `.claude/hooks/eslint-edited-file.js` runs as a `PostToolUse` hook on `Write`/`Edit`, linting and auto-fixing the single edited file; lefthook `pre-commit` runs `npx eslint {staged_files}`. Both reach `test/e2e/*.ts` — `eslint.config.js` matches `**/*.ts` with no `test/` exclusion. The `.mjs` rules tests escape both, deliberately — see §4. |
| typecheck | local — `pre-commit` | **enforced today** | type drift project-wide. lefthook `pre-commit` runs `npx tsc --noEmit`, in parallel with the lint job. Two gaps stay open, both CI-side: `npx tsc --noEmit` does **not** read `angularCompilerOptions`, so `strictTemplates` is still unchecked by this gate; and it type-checks one environment file and not the other, so an error living only in the non-default build configuration still gets through. |
| post-edit hook | local, agent loop | **enforced today — inside an agent session only** | lints and auto-fixes the file just edited, and exits 2 to feed unfixable errors back to the agent. Its one real limitation is its trigger: it fires only inside an agent session, so a hand edit made outside one is caught by lefthook at commit time or not at all. Never a substitute for a CI gate — which is why this table is split. |

**Still planned — nothing runs these on a server yet:**

| Gate | Where | Required? | Catches |
|---|---|---|---|
| unit + component suite, headless | local, then CI | required after §3 Phase 6 | logic regressions, including everything Phases 1 and 2 add |
| security-rules suite under the emulator | local, then CI | required after §3 Phase 6 | cross-teacher access regressions; this is the gate Risk #3 is entirely about |
| PDF fidelity capture and diff | local, before merge | required after §3 Phase 4, for any change touching a report component or its inputs | silent layout or content drift in a report covered by the preservation guardrail |
| deploy preconditions (branch, build output present) | between merge and production | required after §3 Phase 6 | the two failure modes in Risk #5 that the deploy command reports as success |
| e2e on critical flows | local-first — the suite needs `npm run emulators`, `npm start` and a hand-captured session, so it cannot be lifted into CI naively | required after §3 Phase 6 | the delivery half of Risk #1: a download click that ends in no file, and uncaught browser exceptions on the way there. §3 Phase 5 builds the layer; §7 bounds what it may assert. |
| visual diff / multimodal visual review | — | not planned | intentionally absent; see §7 |

No row in this table is aspirational. Every row in the still-planned group
names the rollout phase that makes it real — Phase 6 for the three CI gates
and the e2e gate, Phase 4 for the fidelity row — with one exception: the
visual-diff row names no phase because it is not planned at all, and §7
says why. The enforced group names its mechanism instead of a phase,
because for those rows the phase already happened.

## 6. Cookbook Patterns

How to add new tests in this project. Each sub-section is filled in once
the relevant rollout phase ships; before that, the sub-section reads
"TBD — see §3 Phase N."

### 6.1 Adding a unit test

**Asserting that a PDF is produced for a form state** (the Risk #1 pattern,
shipped by §3 Phase 1). To add edge coverage for a fifth report type:

1. **Capture, then render.** The assertion is
   `capturePdfDefinition(() => component.generatePDF(component.form))`
   followed by `await renderToBlob(definition)`, then `%PDF` on the first
   four bytes plus a non-zero `size`. **`capturePdfDefinition` alone is not
   enough** — Phase 2's crash built a perfectly valid document definition
   and threw inside pdfmake's own measurement pass
   (`node.table.body[0].length` on an empty body). A capture-only test is
   green over it. Both helpers live in
   `src/app/shared/testing/pdf-fidelity/render-pdf.ts`.
2. **Put the fixture under `fixtures/edge/`, not next to the fidelity
   fixtures.** `fixtures/<report>.fixture.ts` is shared input to two
   runners: `npm test` and the capture harness behind
   `docs/pdf-fidelity-check.md`, where each fixture's `id` becomes a
   reference-PDF filename a human compares by eye. Edge states prove a
   document is produced at all and are not reviewed for layout, so mixing
   them in grows the manual procedure with documents nobody reads. Same
   `ReportFixture` interface, separate array, separate `describe` block in
   the spec.
3. **Derive the floor state from that form's validators and gate — never
   copy it from another report.** The specs call `generatePDF` directly and
   walk straight past `[disabled]="form.invalid"`, so nothing at runtime
   stops a fixture from recording a state a teacher cannot reach, which
   would break the `ReportFixture` contract at `report-fixture.ts:5-8`. The
   four floors are all different for real reasons: Teddy Eddie and year-end
   have zero validators and no gate, so an **untouched form** is the floor;
   Cambridge has one validator plus a gate, so **`studentName` only** is;
   trimester/semester has nine validators plus a gate, so **all nine** are.
   Check the form's `createForm` and its template's download control before
   writing the first fixture.
4. **Check the control is actually bound before patching it.** A builder
   reading `form.value.X` does not mean a teacher can set `X`. Teddy
   Eddie's builder reads `additionalComment` and `realizedMaterial` that no
   template binds, and its table text cells are constructed `disabled` —
   `patchValue` skips those silently, so a fixture aiming at them does
   nothing and still passes. Grep the feature folder's `.html` for
   `formControlName` and check the `FormControl` is not constructed
   `{ disabled: true }`.
5. **Drive the component's own methods for anything array-shaped**
   (`addNextExamTerm`, `addNextComment`, `setTableTE`, `setClasses`) rather
   than constructing rows by hand — that is what keeps the recorded state
   equal to what the UI produces.
6. **Raise `jasmine.DEFAULT_TIMEOUT_INTERVAL` to 30s** in the block's
   `beforeEach` and restore it in `afterEach`. Every rendered case embeds
   the Roboto VFS and the base64 banner and overruns the 5s default.
7. **Keep the assertion no stronger than a source supports.** Long free
   text and non-ASCII names have no documented expectation anywhere, so
   their fixtures assert renderability and nothing else — see
   `fixtures/edge/hostile-text.ts`, which states that reasoning once for
   all four report types. A stronger assertion there would be inventing an
   oracle out of current behaviour.

Worked examples: `src/app/year-report/year-report.component.spec.ts`
(`— reachable edge states`) and the four
`src/app/shared/testing/pdf-fidelity/fixtures/edge/*.edge.fixture.ts`.

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

**§3 Phase 1 — PDF generation survives the real input space (2026-08-14).**

- **Fidelity was argued by invariant, not by capture, and that is the part
  worth remembering.** This phase changed two PDF builders under FR-015's
  preservation guardrail without running `docs/pdf-fidelity-check.md`. The
  licence was a per-guard invariant: *the guard changes behaviour only in
  states that throw today*. If it holds, every state that previously
  produced a PDF still produces a byte-identical one, so no comparison is
  needed — and the year-end baseline, which Risk #6 says is untrustworthy
  anyway, never enters the argument. **This route is only available to
  changes narrow enough that the invariant is checkable by reading the
  guard.** A guard written wider than the crashing state breaks it
  silently, with a green suite either way. A change that cannot state the
  invariant in one sentence runs the capture procedure instead.
- **Two reachable crashes existed and the suite was green over both** —
  the untouched year-end form (`form.value.class.value` on a `null`
  control) and every detail row suppressed (empty `table.body`, thrown
  inside pdfmake). Both were reachable by opening a tab and clicking
  download. The gap was never missing machinery; the harness was already
  there. It was that the recorded inputs were a curated safe path.
- **Submit gating differs across the four forms and the asymmetry is
  drift, not design** — nine validators plus a gate on trimester/semester,
  one plus a gate on Cambridge, zero and no gate on year-end and Teddy
  Eddie. Phase 4 pinned the two gates with assertions so removing one turns
  a silent widening of the input space into a failing test. The remedy for
  the ungated forms was null-safety in the builder, not new validators —
  a crash cannot plausibly be the behaviour a preservation guardrail was
  written to preserve, and adding a validator would change what a teacher
  is allowed to enter.
- **The `[required]` inputs on the shared form wrappers attach no
  validator** — they drive an asterisk and an aria attribute only. Reading
  a template for "which fields are required" gives the wrong answer.

### 6.7 Writing an end-to-end test

- TBD — see §3 Phase 5, for the fixture and session-capture setup (the two
  processes the suite needs and how the signed-in session is captured and
  restored), the locator and waiting rules the seed spec already
  demonstrates, and the cleanup-through-the-store pattern that keeps a run
  from depending on the app to undo its own data.

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
  baseline recovery for year-end, not ongoing coverage. Nor does it cover
  Risk #1: §3 Phase 1 added edge-state generation coverage to all three,
  because "no PDF appears" is a whole-product failure and two of the four
  reachable crashes it found live in the ungated year-end form. **This
  exclusion is about ongoing *feature* coverage, not generation
  robustness** — the distinction was drawn at research time and is recorded
  in `context/changes/testing-pdf-input-space/change.md`. (Source: Phase 2
  interview Q5; scope clarified 2026-08-14.)
- **PL/EN translation key completeness** — parity is verified by hand and
  currently holds; a test here would restate a check that already happens.
  Re-evaluate if the key count grows enough that manual parity stops being
  credible. (Source: Phase 2 interview Q5.)
- **Secret exposure in the shipped bundle** — the Firebase configuration
  and reCAPTCHA site key are public by design and protected by security
  rules, not by secrecy. Re-evaluate only if a genuinely secret value is
  ever introduced into the client. (Source: PRD §Constraints, `src/CLAUDE.md`
  §Conventions.)
- **Business logic restated at the e2e layer** — e2e is scheduled (§3
  Phase 5), and this is where it stops. It asserts only what no cheaper
  layer can see: that the download a teacher clicks ends in a file, and
  that the browser stays free of uncaught exceptions getting there. Logic
  that is already covered lower down does not get a browser restatement —
  field ownership and the sex-driven remap belong to §3 Phase 2, the access
  boundary to §3 Phase 3, PDF fidelity to §3 Phase 4. This is a ceiling on
  what e2e may assert, not a ban on the layer: e2e was offered as a fourth
  exclusion in the 2026-09-08 interview and deliberately **not** chosen.
  Re-evaluate if a risk surfaces whose failure is invisible to every layer
  below the browser. (Source: 2026-09-08 interview Q5; §1 principle #1.)

## 8. Freshness Ledger

- Strategy (§1–§5) last reviewed: 2026-09-08
- Stack versions last verified: 2026-09-08
- AI-native tool references last verified: 2026-09-08

Refresh (`/10x-test-plan --refresh`) when:

- a new top-3 risk surfaces from the roadmap or archive,
- a recommended tool's `checked:` date is older than three months,
- the project's tech stack changes (new framework, new test runner),
- §7 negative-space no longer matches what the team believes.
