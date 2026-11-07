# Test Plan Refresh (2026-09-08) Implementation Plan

## Overview

`context/foundation/test-plan.md` has drifted from disk. Its §4 and §5 both record e2e as
"none — and none planned" while a configured, runnable Playwright suite sits in the repo; its
§5 quality-gate table says lint and typecheck become required "after §3 Phase 5" while both are
already enforced locally on every edit and every commit; and its §4 stack-grounding block records
a session with no provider MCP, which is no longer the session anyone is in.

This is a **`--refresh` driven by a tech-stack change plus §4/§5 drift**, explicitly *not* by the
three-month staleness rule — only five weeks have passed since the 2026-08-04 strategy review.
The distinction matters because it bounds the work: a staleness refresh re-opens the whole
strategy, a drift refresh corrects what disk contradicts and re-dates what it touches.

## Current State Analysis

**What the document says today** (`context/foundation/test-plan.md`, last updated 2026-08-14):

- §3 has five rollout phases. Phase 1 is `done`; Phases 2–5 are `not started`. Phase 5 is
  "Quality gates wired", whose goal assumes *no* gate exists anywhere yet.
- §4's `e2e` row reads `none — and none planned`, justified by "Every risk in §2 is reachable at
  a cheaper layer". Its `(optional) AI-native` row describes browser automation as an ad-hoc tool
  against the developer's real Chrome, `checked: 2026-08-04`.
- §4's stack-grounding block carries four lines, all `checked: 2026-08-04`, recording no docs MCP,
  unused web search, browser automation as available-but-unused, and **no provider MCP at all**.
- §5's gate table has eight rows. Three say `required after §3 Phase 5`; one says
  `required after §3 Phase 4`; the post-edit hook row says `optional`; the `e2e on critical flows`
  row says `not planned`, pointing at §4.
- §2's Likelihood column was calibrated 2026-08-04 and its Source cells cite 30-day churn counts
  (`src/app/students/` 37 commits, `src/app/auth/` 26, `src/app/semestr-report/` 16, …).
- §7 lists four exclusions; none of them is about e2e.
- §8 records all three freshness lines as 2026-08-04.

**What disk says** (verified 2026-09-08):

| Claim in the document | What is actually there |
|---|---|
| e2e: none, none planned | `playwright.config.ts` at repo root; `@playwright/test@^1.63.0` and `@playwright/cli@^0.1.19` in devDependencies; `npm run e2e`, `e2e:auth:save`, `e2e:auth:restore` scripts; `test/e2e/seed.spec.ts`, `test/e2e/fixtures/app.ts`, `test/e2e/auth-session.mjs` |
| lint/typecheck required after Phase 5 | `lefthook.yml` `pre-commit` runs `npx tsc --noEmit` and `npx eslint {staged_files}` in parallel on every commit; `.claude/settings.json` runs `.claude/hooks/eslint-edited-file.js` as a `PostToolUse` hook on `Write\|Edit` |
| post-edit hook — optional | The hook is wired, lints-and-fixes the edited file, and exits 2 to feed unfixable errors back to the agent |
| no provider MCP in session | A Firebase MCP is connected (`firestore_*`, `auth_get_users`, `firebase_validate_security_rules`, `developerknowledge_*`); a GitHub MCP is configured but fails to connect |
| browser automation is an ad-hoc tool | It is a pinned project devDependency with npm scripts and a committed configuration |

**Hot-spot scan re-run 2026-09-08** (scope `src/`, `test/`, `firestore.rules` — same as §1): six
commits in 30 days, all six from `testing-pdf-input-space` p1–p6, i.e. the test rollout auditing
itself. Product code has been frozen since 2026-08-04. 23 specs in `src/` (unchanged), 2 rules
files, 1 e2e spec. The churn numbers §2's Source cells quote no longer reproduce.

**Phase 1 + Phase 2 interview (run 2026-09-08)** — the evidence this refresh re-sources against:

- Q1: the top worry is unchanged — "fills the report, clicks download, nothing happens, error only
  in console" (Risk #1).
- Q2: two lived burns — the untouched form crashing with a green suite (Risk #1), and a template
  pre-filling a mark silently in production (Risk #2).
- Q3: nothing changed without confidence; only tests, hooks and gates were touched.
- Q4: under-tested = the three writers together (Risk #2), the rules suite nothing runs (Risk #3),
  and the browser path.
- Q5: re-confirms all three §7 exclusions. E2E was offered as a fourth exclusion and deliberately
  **not** chosen.

## Desired End State

`context/foundation/test-plan.md` describes the project as it is on 2026-09-08:

- Anyone reading §4 or §5 learns that a Playwright suite exists, what it currently covers, and that
  it is not yet on any gate — instead of learning that e2e was ruled out.
- §3 carries six rollout phases, with a narrow e2e layer as Phase 5 and quality gates as Phase 6.
- §5's gate table separates what is enforced on this machine today from what still needs CI, so a
  reader can tell a live control from a planned one.
- §2's likelihood ratings carry a dated note explaining that their original churn evidence no
  longer reproduces, and Risks #1 and #2 are sourced to the interview answers that are now their
  strongest evidence. **No risk is demoted.**
- §7 states where the e2e layer stops, so "a spec exists" and "e2e is bounded" stop being in
  tension.
- `test/e2e/seed.spec.ts`'s docblock no longer asserts the opposite of what §3 now says.

**How to verify**: the greps in each phase's Automated Verification, plus one read-through of the
whole document checking that no section contradicts another.

### Key Discoveries

- **`seed.spec.ts` argues against this refresh in its own header.** Its docblock states: *"§4
  records e2e as 'none — and none planned' … This file does not change that judgement and adds no
  rollout phase; it is the reference shape for an e2e test if one is ever justified, and it is not
  wired into any gate in §5."* Item 4 of the brief reverses exactly that. Per
  `context/foundation/lessons.md` §"Updating a document includes the sections the new content
  contradicts", the docblock is in scope for this change even though it lives outside the document
  being refreshed.
- **`seed.spec.ts` already draws the §7 boundary this refresh needs to write down.** Its Risk #1
  comment says the unit layer proves the builder produces a document, and *"what it cannot see is
  the half of the risk that is about delivery: whether the click a teacher actually performs ends
  in a file."* That sentence is the exclusion entry's argument, already made and already grounded.
- **Renumbering is cheaper than it looks.** §6.2 → Phase 2, §6.3/§6.4 → Phase 3, §6.5 → Phase 4 are
  all below the insertion point and unaffected. The only strings that break are §5's three
  `required after §3 Phase 5` cells — which this plan rewrites anyway.
- **Risk #5's existing anti-pattern already names the silent-gate failure mode**: *"A gate that
  skips silently is worse than no gate, because it converts a known risk into a believed-safe
  one."* This is why extending the row was considered — and why it was ultimately declined (see
  What We're NOT Doing).
- **Both local gates do cover `test/e2e/`.** `eslint.config.js` matches `**/*.ts` with no exclusion
  for `test/`, and `tsconfig.json` declares no `include`/`exclude`, so it compiles every `.ts` under
  the repo root. The Phase 4 docblock edit is therefore checkable by the project's own gates, not
  only by eye. (The rules tests are `.mjs` and escape both, which is what §4's "deliberately
  excluded" note is about — that note stays correct.)

## What We're NOT Doing

- **Not extending Risk #5** to cover the new local gates failing silently (`skip: [merge, rebase]`,
  the commented-out prettier job, a per-edit hook that only fires inside an agent session).
  Considered on 2026-09-08 and **declined by user decision**: §2 stays a map of production failure
  scenarios, and the shape of the local tooling belongs in §5, which this refresh is already
  correcting. Recorded here so a later refresh does not re-open it without new evidence.
- **Not adding a §2 risk row for "the browser path is untested."** E2E is a layer, not a failure
  scenario; such a row would duplicate Risk #1 and break §1 principle #1 (cost × signal).
  (Challenger decision, closed.)
- **Not adding an abuse row.** §2 #3 and #4 already carry the authorization and
  untrusted-data-at-rest lens; neither the interview nor the diff opens a new abuse surface.
  (Challenger decision, closed.)
- **Not demoting any Likelihood rating.** A frozen codebase lowers near-term likelihood, but every
  risk in §2 is about what happens when it thaws.
- **Not re-opening the three §7 exclusions.** Interview Q5 re-confirmed all three.
- **Not committing the e2e scaffolding.** `playwright.config.ts`, `test/e2e/`, the `package.json`
  scripts and the `.gitignore` entries are untracked or modified in the working tree; committing
  them is the m3l4 lesson's business, not this refresh's. This change touches
  `context/foundation/test-plan.md` and one docblock in `test/e2e/seed.spec.ts`.
- **Not writing a full §6 cookbook entry for e2e.** §6 sub-sections are filled in *when a rollout
  phase ships*; the e2e phase is `not started`. It gets a `TBD — see §3 Phase 5` stub and nothing
  more.
- **Not adding `file:line` anchors anywhere.** §1 principle #3 holds throughout: evidence lives in
  Source columns; locating the failure is `/10x-research`'s job.

## Implementation Approach

Four phases, ordered by dependency rather than by section number:

1. **§4 first** — it records the facts (a Playwright suite exists; the session has a Firebase MCP)
   that §3 and §5 then cite. Writing it first means later phases quote a fact already on the page.
2. **§3 second** — the phase insertion and renumbering settle the numbers §5's table refers to.
3. **§5 third** — restructures the gate table against the numbering Phase 2 just fixed.
4. **§2 / §7 / §8 / docblock last** — none of these depends on the renumbering, and each is small;
   grouping them makes one consistency-closure pass rather than three ceremonial phases.

Every edit is prose in one file, except Phase 4's docblock edit. There is no code to run, so
verification leans on greps that assert the *absence* of the stale strings and the *presence* of the
new ones, plus a human read-through for coherence — which is the only check that can catch a
document disagreeing with itself.

## Critical Implementation Details

**Order the two §5 edits against the greps, not against the table.** Phase 3's automated check for
`required after §3 Phase 5` returning `0` will also pass if Phase 2's renumbering is skipped and the
string was rewritten to `Phase 6` by hand. Run Phase 2's row-count check before trusting Phase 3's
absence check; the two together are what pin the renumbering, neither alone.

## Phase 1: §4 Stack — record what is actually installed

### Overview

Replace the two §4 rows that disk contradicts, and re-date the four stack-grounding lines to the
current session. This phase makes no claim about rollout phases or gates — it only establishes what
is installed and what the session can reach.

### Changes Required:

#### 1. The `e2e` row in the §4 Stack table

**File**: `context/foundation/test-plan.md`

**Intent**: The row currently reads `none — and none planned` with a Notes cell arguing e2e was
ruled out. Both halves are now false. Rewrite it to the real state: what is installed, what it
currently covers, what it needs to run, and — importantly — that it is not on any gate yet.

**Contract**: The row keeps the table's four columns (`Layer | Tool | Version | Notes`). Tool names
Playwright (`@playwright/test`, with `@playwright/cli` for the session-capture workflow); Version
carries the installed `1.63` / `0.1.19`. The Notes cell must state: one spec today
(`test/e2e/seed.spec.ts`, Risk #1's delivery half); that it needs two processes (`npm run emulators`
and `npm start`) plus a hand-captured signed-in session, which is why `playwright.config.ts`
deliberately has no `webServer` block; that `fullyParallel` is off because the specs share one
teacher account and therefore one roster; and that it is not wired into `npm test` or any §5 gate.
Cross-reference §3 Phase 5 as the phase that builds it out and §7 for where it stops.

#### 2. The `(optional) AI-native` row in the §4 Stack table

**File**: `context/foundation/test-plan.md`

**Intent**: The row describes browser automation as an ad-hoc tool aimed at the developer's real
Chrome, "considered and left unscheduled". It is now an installed, pinned, configured project
dependency, so the "considered and left unscheduled" framing is stale — but the underlying judgement
(don't put a vision model where a deterministic assertion reaches the same fact) is not, and must
survive the rewrite.

**Contract**: Re-date to `checked: 2026-09-08`. Keep the *When NOT to use* guidance intact —
assertions reachable against the PDF document definition or the reactive form still belong there,
not in a browser. What changes is the premise: the tool is no longer hypothetical, so the row must
distinguish **deterministic browser automation** (now scheduled, as §3 Phase 5) from **vision/VLM
review** (still unscheduled, and still pointed at §7).

#### 3. The four stack-grounding lines below the §4 table

**File**: `context/foundation/test-plan.md`

**Intent**: All four say `checked: 2026-08-04` and three of the four are wrong for the current
session. Re-date all four and correct their content.

**Contract**: Four bullets, each keeping its `checked:` suffix, now `2026-09-08`:

- **Docs** — unchanged in substance (no Context7 or framework-docs MCP), except that the Firebase
  MCP exposes `developerknowledge_*`, which is a docs surface for the Firebase half of the stack.
- **Search** — unchanged in substance; re-dated.
- **Runtime/browser** — reclassify from "ad-hoc automation against the developer's own Chrome,
  available and not used" to an installed project dependency with committed configuration.
- **Provider/platform** — this is the line that inverts. A Firebase MCP is connected
  (`firestore_*`, `auth_get_users`, `firebase_validate_security_rules`, `developerknowledge_*`) and
  is directly relevant to Risks #3 and #4, which are about the Firestore rules boundary; a GitHub
  MCP is configured but fails to connect. Keep the note that `firebase-tools` plus the emulator
  suite remains the local substitute — the MCP does not replace the emulator for rules testing.

### Success Criteria:

#### Automated Verification:

- The stale e2e claim is gone from §4: `grep -c 'none — and none planned' context/foundation/test-plan.md` returns `0`
- Playwright is named in §4: `grep -n 'Playwright' context/foundation/test-plan.md` returns at least one line
- The grounding lines and the AI-native row are re-dated: `grep -c 'checked: 2026-09-08' context/foundation/test-plan.md` returns `5`
- No line still carries the old date: `grep -c 'checked: 2026-08-04' context/foundation/test-plan.md` returns `0`
- The §4 table is still well-formed: every row in the table has the same pipe count

#### Manual Verification:

- The e2e row tells a reader who has never seen the repo what to run and what they need running first
- The AI-native row's *When NOT to use* guidance still reads as advice, not as a record of a decision that has since been reversed
- The provider line makes clear the Firebase MCP is relevant to Risks #3/#4 without implying it replaces the emulator for rules tests

**Implementation Note**: After completing this phase and all automated verification passes, pause
here for manual confirmation before proceeding.

---

## Phase 2: §3 Rollout — e2e becomes Phase 5, gates become Phase 6

### Overview

Insert the narrow e2e layer as a rollout phase of its own — user decision 2026-09-08: not folded
into Phase 2, not left as seed-only — and renumber "Quality gates wired" to Phase 6, rewriting its
goal down to what the m3l3 lesson left undone.

### Changes Required:

#### 1. New Phase 5 row in the §3 table

**File**: `context/foundation/test-plan.md`

**Intent**: Add a rollout phase for a narrow e2e layer on critical flows, inserted *before* the gates
phase so that the gates phase still runs last and still gates everything the earlier phases built.

**Contract**: One row in the existing 7-column table (`# | Phase name | Goal | Risks covered | Test
types | Status | Change folder`). `#` is `5`. Risks covered is `#1` — the delivery half
specifically, not the builder half that §3 Phase 1 already closed. Test types is `e2e`. Status is
`not started`, Change folder `—`; per §3's preamble it will open its own change folder via
`/10x-new` and carries its own gate. The Goal cell must name the half of Risk #1 that no cheaper
layer can reach: that the click a teacher performs ends in a file, and the browser stays free of
uncaught exceptions.

#### 2. Renumber "Quality gates wired" to Phase 6 and rewrite its Goal

**File**: `context/foundation/test-plan.md`

**Intent**: The row's `#` becomes `6`. Its Goal currently reads as though no gate exists anywhere;
half of it landed out-of-band via the m3l3 lesson (per-edit hook plus lefthook pre-commit). Rewrite
the Goal to what is genuinely left.

**Contract**: What remains after the local gates landed: **CI** (nothing runs anything on a server),
the **rules suite on a gate** (`npm run test:rules` exists and nothing invokes it — this is what Risk
#3 is entirely about), and **deploy preconditions** (branch and build-output checks, Risk #5's two
failure modes). The Risks covered cell stays `#5, and enforcement for #1–#4 and #6` but must now
also account for the new Phase 5, so its enforcement range extends accordingly.

#### 3. Extend the ordering rationale paragraph

**File**: `context/foundation/test-plan.md`

**Intent**: The paragraph below the §3 table explains why each phase sits where it does and currently
ends at Phase 5 = gates. It needs a sentence for the new Phase 5 and a corrected reference to Phase 6.

**Contract**: The new sentence must say why e2e ranks below Phases 1–4 (it is the most expensive
layer, and it earns its place only on the delivery half of Risk #1 that no cheaper layer reaches —
§1 principle #1) and why it ranks above the gates phase (a gate over a layer that does not exist yet
buys nothing; the e2e layer must exist before Phase 6 can require it).

#### 4. The "No AI-native rollout phase is scheduled" paragraph

**File**: `context/foundation/test-plan.md`

**Intent**: This paragraph argues no AI-native phase is scheduled because every §2 risk has a cheaper
deterministic answer. Adding a browser-driven phase does not break that argument — deterministic
Playwright is not AI-native — but the paragraph's closing cross-reference to §4 now points at a row
that says something different, so it needs to stay accurate.

**Contract**: Keep the claim (no AI-native phase). Adjust only the cross-reference so it
distinguishes the newly-scheduled deterministic browser layer from the still-unscheduled vision/VLM
option.

### Success Criteria:

#### Automated Verification:

- The §3 table has six phase rows: `sed -n '/^## 3\. Phased Rollout/,/^## 4\./p' context/foundation/test-plan.md | grep -cE '^\| [0-9]+ \|'` returns `6`
- A Phase 6 exists: `grep -nE '^\| 6 \| Quality gates wired' context/foundation/test-plan.md` returns one line
- Phases 1–4 are untouched in name and status: Phase 1 still reads `done`, Phases 2–4 still read `not started`
- Phase 1's change folder reference survives: `grep -c 'testing-pdf-input-space' context/foundation/test-plan.md` is unchanged from before the edit
- No §6 cross-reference broke: `grep -nE '§3 Phase [0-9]' context/foundation/test-plan.md` shows §6.2→2, §6.3→3, §6.4→3, §6.5→4 unchanged

#### Manual Verification:

- The Phase 5 Goal is narrow enough that a reader cannot mistake it for "test the app end to end"
- The ordering rationale explains the insertion point, not merely that a phase was added
- Phase 6's Goal no longer promises anything the per-edit hook and lefthook already deliver

**Implementation Note**: After completing this phase and all automated verification passes, pause
here for manual confirmation before proceeding.

---

## Phase 3: §5 Quality Gates — split enforced-today from still-needs-CI

### Overview

The table's central claim — that lint, typecheck and the unit suite become required only after the
gates phase — is false on this machine today. Restructure the table so a reader can tell a live
control from a planned one, and correct the two rows that misdescribe what exists.

### Changes Required:

#### 1. Split the gate table by enforcement status

**File**: `context/foundation/test-plan.md`

**Intent**: Divide the eight rows into what is enforced locally today versus what still needs CI, so
that "required" stops meaning two different things in one table.

**Contract**: Two labelled groups under §5 — enforced-locally-today and still-planned — either as two
tables or as a new column, whichever reads better against the existing
`Gate | Where | Required? | Catches` shape. Lint and typecheck move into the enforced group, citing
both mechanisms: the per-edit hook (`.claude/hooks/eslint-edited-file.js`, `PostToolUse` on
`Write`/`Edit`, lints and auto-fixes the single edited file) and lefthook `pre-commit`
(`npx tsc --noEmit` project-wide, `npx eslint {staged_files}`, run in parallel). The typecheck note
about the two build configurations must survive, and gains a sharper form: `npx tsc --noEmit` does
**not** read `angularCompilerOptions`, so `strictTemplates` is still uncovered by the local gate —
that is a CI-side gap, not a solved one. The unit suite, the rules suite, and deploy preconditions
stay in the still-planned group, now pointing at §3 Phase 6.

#### 2. The `e2e on critical flows` row

**File**: `context/foundation/test-plan.md`

**Intent**: The row says `not planned` and points at §4 for the justification. Both are now wrong.

**Contract**: `Required?` becomes a planned-after-Phase-6 state rather than `not planned`; `Where`
names local-first (the suite needs two local processes and a captured session, so it cannot be
naively lifted into CI); `Catches` names the delivery half of Risk #1 — a click that ends in no
file, and uncaught browser exceptions. Cross-reference §3 Phase 5 for the build-out and §7 for the
boundary.

#### 3. The `post-edit hook` row

**File**: `context/foundation/test-plan.md`

**Intent**: The row reads `optional` and describes the hook as "fast feedback at edit time; a
convenience". That understates what is wired: it lints and auto-fixes the edited file and exits 2 to
feed unfixable errors back to the agent.

**Contract**: Describe what the hook actually does and its one real limitation — it fires only inside
an agent session, so a manual edit is caught by lefthook at commit time or not at all. Keep the
existing caveat that it is never a substitute for a CI gate; that remains true and is now the reason
the local/CI split in change 1 exists.

#### 4. The closing paragraph under the table

**File**: `context/foundation/test-plan.md`

**Intent**: It currently says "The first five rows are all wired by §3 Phase 5, except the fidelity
row, which Phase 4 wires." Two of those five are already wired, and the phase number moved.

**Contract**: Restate against the new grouping and the Phase 6 number, preserving the paragraph's
actual point — that no row in the table is aspirational, because every not-yet-required gate names
the rollout phase that makes it real.

### Success Criteria:

#### Automated Verification:

- No stale phase reference survives: `grep -c 'required after §3 Phase 5' context/foundation/test-plan.md` returns `0`
- The gates phase is referenced by its new number: `grep -c '§3 Phase 6' context/foundation/test-plan.md` returns at least `3`
- The e2e row no longer reads `not planned`: `sed -n '/^## 5\. Quality Gates/,/^## 6\./p' context/foundation/test-plan.md | grep -c 'e2e on critical flows.*not planned'` returns `0`
- Both local mechanisms are named: `grep -c 'lefthook' context/foundation/test-plan.md` and `grep -c 'eslint-edited-file' context/foundation/test-plan.md` each return at least `1`
- The visual-diff row is untouched and still reads `not planned` pointing at §7

#### Manual Verification:

- A reader can answer "what stops a bad commit on my machine right now?" from §5 alone
- The `strictTemplates` gap is stated as an open gap, not implied to be covered by `npx tsc --noEmit`
- No row in the still-planned group lacks a rollout-phase reference

**Implementation Note**: After completing this phase and all automated verification passes, pause
here for manual confirmation before proceeding.

---

## Phase 4: Evidence, boundary, and ledger closure

### Overview

The remaining edits, none of which depends on the renumbering: re-source §2's likelihood evidence,
write the §7 e2e boundary, stub the §6 cookbook entry, re-date §8, and remove the claim in
`seed.spec.ts` that this refresh has just falsified.

### Changes Required:

#### 1. §2 likelihood calibration note

**File**: `context/foundation/test-plan.md`

**Intent**: The Likelihood column was calibrated 2026-08-04 against a 30-day window containing
S-02/S-03/S-04 feature work. Re-running the same scan on 2026-09-08 returns six commits, all of them
from the test rollout itself. The churn figures in the Source cells no longer reproduce, and a reader
who re-runs the scan to check the plan's evidence would find nothing and reasonably conclude the
ratings are unfounded.

**Contract**: A dated note below the §2 table, alongside the existing notes about Risk #4 being the
abuse row and `src/app/shared/` topping churn without raising a risk. It must state: the date; that
the churn evidence in the Source cells reflects the 2026-08-04 window and does not reproduce today
because product code has been frozen since; and — explicitly — that **no rating is demoted**, because
a frozen codebase lowers near-term likelihood while the risks are about what happens when it thaws.
Do not edit the Likelihood cells themselves.

#### 2. Re-source Risks #1 and #2

**File**: `context/foundation/test-plan.md`

**Intent**: Both rows lead their Source cells with churn counts that no longer reproduce, while the
interview answers that *are* now their strongest evidence sit further down or are absent.

**Contract**: In Risk #1's Source cell, lead with interview Q1 and Q2 (the top-worry answer and the
lived burn of an untouched form crashing under a green suite), keeping the existing PRD, roadmap and
`src/CLAUDE.md` citations; mark the churn figures as 2026-08-04 evidence rather than current. Same
treatment for Risk #2, leading with Q2's second burn (a template pre-filling a mark silently in
production) and Q4's "the three writers together". Risks #3–#6 keep their Source cells as they are —
the calibration note covers them. Source cells stay evidence, never anchors (§1 principle #3).

#### 3. New §7 exclusion — where e2e stops

**File**: `context/foundation/test-plan.md`

**Intent**: With a spec on disk and a rollout phase scheduled, "none planned" is gone but the
boundary is unwritten. Without one, the e2e layer has no stated ceiling and §1 principle #1 has
nothing to enforce against.

**Contract**: A fifth bullet in §7, matching the existing bullets' shape (the exclusion, its
reasoning, a `Re-evaluate if…` clause, and a `(Source: …)` citation). The boundary is **delivery,
not logic**: e2e asserts only what no cheaper layer can see — that the click a teacher performs ends
in a file, and that the browser stays free of uncaught exceptions. Business logic already covered at
unit, component or rules level does not get an e2e restatement: field ownership and the sex-driven
remap belong to §3 Phase 2, the access boundary to §3 Phase 3, PDF fidelity to §3 Phase 4. Source it
to the 2026-09-08 interview Q5 — where e2e was offered as a fourth exclusion and deliberately not
chosen, which is precisely why this entry is a ceiling rather than a ban — and to §1 principle #1.
The three existing exclusions are untouched; Q5 re-confirmed all three.

#### 4. §6 stub for the e2e cookbook entry

**File**: `context/foundation/test-plan.md`

**Intent**: §6's contract is that each sub-section reads `TBD — see §3 Phase N` until its rollout
phase ships. A new rollout phase needs its placeholder, or §6 silently stops covering §3.

**Contract**: One new sub-section with a single `TBD — see §3 Phase 5` bullet naming what the entry
will record when the phase lands: the fixture and session-capture setup, the locator and waiting
rules, and the cleanup-through-the-store pattern. Append it after the existing
`### 6.6 Per-rollout-phase notes` as `### 6.7` and leave 6.6's number alone — §3 Phase 1's shipped
note already lives under it, and renumbering a section that other documents may cite buys nothing.

#### 5. §8 freshness ledger and the document header

**File**: `context/foundation/test-plan.md`

**Intent**: All three ledger lines read 2026-08-04. Two of the three are now false, and the header's
`Last updated:` line still points at the Phase 1 landing.

**Contract**: Strategy (§1–§5) and stack versions move to 2026-09-08. The AI-native tool reference
line also moves, since Phase 1 re-dated that row. Leave the four refresh triggers below the ledger
unchanged — they are still the right triggers, and this refresh fired on the third one (the tech
stack changed), which is worth being able to see. Update the header's `Last updated:` to 2026-09-08
with a one-clause reason naming the drift, not the calendar.

#### 6. The `seed.spec.ts` docblock

**File**: `test/e2e/seed.spec.ts`

**Intent**: The file's header docblock ends with a scope note asserting that §4 records e2e as "none
— and none planned", that the file "does not change that judgement and adds no rollout phase", and
that it "is not wired into any gate in §5". After Phases 1–3, the first claim describes a sentence
that no longer exists and the second contradicts §3 Phase 5. Only the third is still true.

**Contract**: Rewrite the scope note only — the four demonstration bullets above it (role-based
locators, waiting on state, unique identifiers, cleanup independent of the app) are the file's reason
for existing and stay verbatim. The replacement states that this spec is the reference shape §3
Phase 5 builds on, that it covers the delivery half of Risk #1, that §7 bounds what e2e may assert,
and that it is still not wired into any §5 gate. No behavioural change: not one line of test code
moves.

### Success Criteria:

#### Automated Verification:

- The calibration note is dated: `grep -c '2026-09-08' context/foundation/test-plan.md` returns at least `4`
- No Likelihood cell changed: `git diff context/foundation/test-plan.md` shows no edit inside the Impact/Likelihood value columns of the §2 table
- §7 has five bullets: `sed -n "/^## 7\. What We Deliberately Don't Test/,/^## 8\./p" context/foundation/test-plan.md | grep -cE '^- \*\*'` returns `5`
- The §6 stub exists: `grep -c '### 6.7' context/foundation/test-plan.md` returns `1`
- §8 is re-dated: `sed -n '/^## 8\. Freshness Ledger/,$p' context/foundation/test-plan.md | grep -c '2026-08-04'` returns `0`
- The stale docblock claim is gone: `grep -c 'adds no rollout phase' test/e2e/seed.spec.ts` returns `0`
- The docblock edit passes both local gates: `npx tsc --noEmit` exits 0 and `npx eslint test/e2e/seed.spec.ts` exits 0
- The e2e suite still parses and collects: `npx playwright test --list` reports one test
- No test code changed: `git diff --stat test/e2e/seed.spec.ts` shows changes confined to the header comment block

#### Manual Verification:

- §2's calibration note reads as re-sourcing, not as hedging — a reader should not come away thinking the ratings are less trustworthy
- §7's new bullet and §3 Phase 5's Goal bound the same thing from opposite sides
- Whole-document read-through, top to bottom, finds no section contradicting another — the check the greps cannot do
- §7's new bullet does not read as the fourth exclusion Q5 explicitly declined

**Implementation Note**: This is the last phase; after it passes, the document is the deliverable.

---

## Testing Strategy

There is no code under test — the deliverable is prose plus one comment block. Verification is
therefore structural and human.

### Structural (automated):

- Absence greps for every stale string this refresh removes (`none — and none planned`,
  `required after §3 Phase 5`, `checked: 2026-08-04`, `adds no rollout phase`)
- Presence greps for every new claim (`Playwright`, `§3 Phase 6`, `lefthook`, `### 6.7`, `2026-09-08`)
- Table well-formedness: consistent pipe counts in the §2, §3 and §4 tables
- Row-count assertions: six §3 phase rows, five §7 bullets

### Integration (automated):

- `npx tsc --noEmit` and `npx eslint test/e2e/seed.spec.ts` — the project's own local gates cover
  `test/e2e/*.ts`, so the docblock edit is machine-checkable
- `npx playwright test --list` — confirms the spec still collects after the comment edit. Note this
  does not *run* the suite; running it needs `npm run emulators`, `npm start` and a captured session,
  which is exactly the friction §4's new row must document

### Manual Testing Steps:

1. Read §3, then §5, then §7 in that order and confirm each phase number cited resolves to the phase
   that exists
2. Re-run the hot-spot scan — `git log --since="30 days ago" --oneline -- src/ test/ firestore.rules`
   — and confirm §2's calibration note describes what you see
3. Confirm the document nowhere states a `file:line` anchor as the location of a failure (§1
   principle #3)

## Migration Notes

The document is read by `/10x-test-plan --status` and by each rollout phase's `/10x-research` run.
The renumbering means any *external* reference to "§3 Phase 5" written before 2026-09-08 now points
at the e2e phase rather than at gates. Two places to check when this lands: `context/changes/*/change.md`
and `context/changes/*/plan.md` for prior phases that cite a §3 phase number, and `src/CLAUDE.md` if
it references the rollout. Phase 1's own change folder (`testing-pdf-input-space`) cites Phase 1,
which is below the insertion point and unaffected.

## References

- Change identity and full refresh brief: `context/changes/test-plan-refresh-2026-09-08/change.md`
- Document under refresh: `context/foundation/test-plan.md`
- Reference shape for the new rollout phase: `test/e2e/seed.spec.ts`, `test/e2e/fixtures/app.ts`
- Local gate definitions: `lefthook.yml`, `.claude/settings.json`, `.claude/hooks/eslint-edited-file.js`
- Prior rollout phase that shipped: `context/changes/testing-pdf-input-space/`
- Scope-expansion rule putting the docblock in scope: `context/foundation/lessons.md` §"Updating a document includes the sections the new content contradicts"

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: §4 Stack — record what is actually installed

#### Automated

- [x] 1.1 The stale e2e claim is gone from §4 — 3e1f694
- [x] 1.2 Playwright is named in §4 — 3e1f694
- [x] 1.3 The grounding lines and AI-native row are re-dated (`checked: 2026-09-08` count is 5) — 3e1f694
- [x] 1.4 No line still carries `checked: 2026-08-04` — 3e1f694
- [x] 1.5 The §4 table is still well-formed — 3e1f694

#### Manual

- [x] 1.6 The e2e row tells a first-time reader what to run and what must be running first — 3e1f694
- [x] 1.7 The AI-native row's *When NOT to use* guidance still reads as advice, not a reversed decision — 3e1f694
- [x] 1.8 The provider line ties the Firebase MCP to Risks #3/#4 without implying it replaces the emulator — 3e1f694

### Phase 2: §3 Rollout — e2e becomes Phase 5, gates become Phase 6

#### Automated

- [x] 2.1 The §3 table has six phase rows — a9abc00
- [x] 2.2 A Phase 6 exists and is "Quality gates wired" — a9abc00
- [x] 2.3 Phases 1–4 are untouched in name and status — a9abc00
- [x] 2.4 Phase 1's change-folder reference survives renumbering — a9abc00
- [x] 2.5 No §6 cross-reference broke (§6.2→2, §6.3→3, §6.4→3, §6.5→4) — a9abc00

#### Manual

- [x] 2.6 The Phase 5 Goal is narrow enough not to read as "test the app end to end" — a9abc00
- [x] 2.7 The ordering rationale explains the insertion point, not merely that a phase was added — a9abc00
- [x] 2.8 Phase 6's Goal no longer promises what the per-edit hook and lefthook already deliver — a9abc00

### Phase 3: §5 Quality Gates — split enforced-today from still-needs-CI

#### Automated

- [x] 3.1 No stale phase reference survives (`required after §3 Phase 5` count is 0) — e99185c
- [x] 3.2 The gates phase is referenced by its new number (`§3 Phase 6` at least 3 times) — e99185c
- [x] 3.3 The e2e row no longer reads `not planned` — e99185c
- [x] 3.4 Both local mechanisms are named (`lefthook`, `eslint-edited-file`) — e99185c
- [x] 3.5 The visual-diff row is untouched and still reads `not planned` pointing at §7 — e99185c

#### Manual

- [x] 3.6 A reader can answer "what stops a bad commit on my machine right now?" from §5 alone — e99185c
- [x] 3.7 The `strictTemplates` gap is stated as open, not implied covered by `npx tsc --noEmit` — e99185c
- [x] 3.8 No row in the still-planned group lacks a rollout-phase reference — e99185c

### Phase 4: Evidence, boundary, and ledger closure

#### Automated

- [x] 4.1 The calibration note is dated 2026-09-08 — 5e886b8
- [x] 4.2 No Likelihood cell changed — 5e886b8
- [x] 4.3 §7 has five bullets — 5e886b8
- [x] 4.4 The §6.7 stub exists — 5e886b8
- [x] 4.5 §8 carries no remaining 2026-08-04 — 5e886b8
- [x] 4.6 The stale docblock claim is gone from `test/e2e/seed.spec.ts` — 5e886b8
- [x] 4.7 `npx tsc --noEmit` and `npx eslint test/e2e/seed.spec.ts` both exit 0 — 5e886b8
- [x] 4.8 `npx playwright test --list` reports one test — 5e886b8
- [x] 4.9 `git diff --stat test/e2e/seed.spec.ts` shows changes confined to the header comment — 5e886b8

#### Manual

- [x] 4.10 §2's calibration note reads as re-sourcing, not as hedging — 5e886b8
- [x] 4.11 §7's new bullet and §3 Phase 5's Goal bound the same thing from opposite sides — 5e886b8
- [x] 4.12 Whole-document read-through finds no section contradicting another — 5e886b8
- [x] 4.13 §7's new bullet does not read as the fourth exclusion Q5 declined — 5e886b8
