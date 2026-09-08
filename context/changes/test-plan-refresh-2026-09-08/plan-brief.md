# Test Plan Refresh (2026-09-08) — Plan Brief

> Full plan: `context/changes/test-plan-refresh-2026-09-08/plan.md`
> Refresh brief and evidence: `context/changes/test-plan-refresh-2026-09-08/change.md`

## What & Why

`context/foundation/test-plan.md` says this project has no end-to-end tests and no local quality
gates. Both statements are false on disk: a configured Playwright suite runs from `npm run e2e`, and
lint plus typecheck are enforced on every edit and every commit. This refresh corrects what disk
contradicts and re-dates what it touches. It fires on **tech-stack change plus §4/§5 drift**, not on
the three-month staleness rule — only five weeks have passed since the last strategy review, so the
strategy itself is not re-opened.

## Starting Point

The document was last updated 2026-08-14, when §3 Phase 1 landed. Since then, product code has been
frozen — the only six commits in the last 30 days are the test rollout auditing itself — while the
tooling around it changed substantially out-of-band via the m3l3 and m3l4 lessons: `lefthook.yml`,
a `PostToolUse` ESLint hook, Playwright with a seed spec and a session-capture fixture, and a
connected Firebase MCP in the working session. None of that reached the plan.

## Desired End State

A reader of §4 or §5 learns that a Playwright suite exists, what it covers, and that it is not yet on
any gate — instead of learning that e2e was ruled out. §3 carries six rollout phases, with a narrow
e2e layer as Phase 5 and quality gates as Phase 6. §5 separates gates that are live on this machine
today from gates that still need CI. §2's ratings carry a dated note explaining that their original
churn evidence no longer reproduces, without any rating being demoted. §7 states where e2e stops.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Where the e2e phase goes in §3 | Insert as Phase 5; gates become Phase 6 | Keeps the plan's own ordering logic — gates run last because they gate what earlier phases built, and a new layer needs to exist before a gate can require it. | Plan |
| Cost of renumbering | Accepted; it is near-zero | §6.2–§6.5 all cite phases below the insertion point; the only strings that break are §5's three "required after §3 Phase 5" cells, which this change rewrites regardless. | Plan |
| Where the e2e layer stops (§7) | Delivery only, never logic | E2E asserts only what no cheaper layer can see — the click ends in a file, the browser throws nothing; field ownership, the access boundary and PDF fidelity stay with Phases 2–4. | Plan |
| Extending Risk #5 to cover silent local gates | **Declined** | §2 stays a map of production failure scenarios; the shape of the local tooling belongs in §5, which this refresh already corrects. | Plan |
| Scope of the change | `test-plan.md` plus one docblock | Committing the e2e scaffolding is the m3l4 lesson's business; this change is a document refresh. | Plan |
| A §2 risk row for "the browser path is untested" | **Declined** | E2E is a layer, not a failure scenario — such a row would duplicate Risk #1 and break §1 principle #1. | Refresh brief (challenger) |
| A new abuse row | **Declined** | Risks #3 and #4 already carry the authorization and untrusted-data-at-rest lens; nothing in the diff opens a new surface. | Refresh brief (challenger) |
| Demoting any Likelihood rating | **No** | A frozen codebase lowers near-term likelihood, but the risks are about what happens when it thaws. | Refresh brief |
| The three existing §7 exclusions | Kept unchanged | Interview Q5 re-confirmed all three on 2026-09-08. | Interview Q5 |

## Scope

**In scope:**

- §2 — dated calibration note; Risks #1 and #2 re-sourced to interview Q1/Q2/Q4
- §3 — new Phase 5 (e2e), gates renumbered to Phase 6 with a rewritten goal, ordering rationale extended
- §4 — e2e row, AI-native row, and all four stack-grounding lines rewritten and re-dated
- §5 — gate table split into enforced-locally-today versus still-needs-CI; e2e and post-edit-hook rows corrected
- §6 — a `TBD — see §3 Phase 5` stub so §6 keeps covering §3
- §7 — a fifth exclusion stating where e2e stops
- §8 — freshness ledger and the document header re-dated
- `test/e2e/seed.spec.ts` — the scope note in its header docblock, which currently asserts the opposite of what §3 will say

**Out of scope:**

- Committing `playwright.config.ts`, `test/e2e/`, or the `package.json` / `.gitignore` changes
- Extending Risk #5; adding any new §2 row; demoting any rating
- Re-opening the three confirmed §7 exclusions
- Writing a full §6 cookbook entry for e2e — that lands when Phase 5 ships
- Any `file:line` anchor anywhere (§1 principle #3)

## Architecture / Approach

Four phases ordered by dependency, not by section number. **§4 first** because it records the facts
(a Playwright suite exists; the session has a Firebase MCP) that later sections cite. **§3 second**
because the phase insertion settles the numbers §5 refers to. **§5 third**, restructured against that
numbering. **§2 / §7 / §8 / docblock last**, because none of them depends on the renumbering and each
is small — one consistency-closure pass rather than three ceremonial phases.

Verification is grep-based: absence checks for every stale string being removed, presence checks for
every new claim, plus row-count and table-shape assertions. The docblock edit is additionally covered
by the project's own gates — `eslint.config.js` matches `**/*.ts` and `tsconfig.json` sets no
`include`/`exclude`, so `test/e2e/*.ts` is genuinely linted and type-checked.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. §4 Stack | The e2e and AI-native rows rewritten; four grounding lines re-dated | Rewriting the AI-native row so hard that its still-valid "don't use a vision model where a deterministic assertion reaches the same fact" guidance is lost |
| 2. §3 Rollout | E2E inserted as Phase 5; gates renumbered to 6 with a rewritten goal | A Phase 5 goal written broadly enough to read as "test the app end to end", which §7 then cannot bound |
| 3. §5 Quality Gates | Table split into enforced-today versus still-needs-CI | Overstating the local gate — `npx tsc --noEmit` does not read `angularCompilerOptions`, so `strictTemplates` is still uncovered |
| 4. Evidence & closure | §2 calibration, §7 boundary, §6 stub, §8 ledger, docblock fix | A calibration note that reads as hedging and quietly undermines ratings it was written to preserve |

**Prerequisites:** none — everything the refresh documents is already on disk and verified.
**Estimated effort:** one session; four phases, all in `context/foundation/test-plan.md` except the
last phase's comment-only edit to `test/e2e/seed.spec.ts`.

## Open Risks & Assumptions

- **The e2e assets are untracked.** `playwright.config.ts` and `test/e2e/` are `??` in git. The
  refresh documents them as the stack on the assumption they will be committed with the m3l4 lesson
  work. If that commit never happens, §4 describes files no history contains.
- **Renumbering has reach outside this document.** Any reference to "§3 Phase 5" written before
  2026-09-08 now resolves to the e2e phase rather than to gates. The plan's Migration Notes name where
  to look; nothing found so far is above the insertion point.
- **Only a human read-through can catch a self-contradicting document.** The greps prove strings are
  present or absent, not that §3, §5 and §7 agree with each other. That check is manual by nature and
  is the last item in Phase 4.

## Success Criteria (Summary)

- A reader can answer "does this project have e2e tests, and what do they cover?" from §4 alone, and
  "what stops a bad commit on my machine right now?" from §5 alone.
- Every phase number cited in §5, §6 and §7 resolves to the phase that actually exists in §3.
- Re-running the hot-spot scan produces what §2's calibration note describes, and no rating in §2 has
  moved.
