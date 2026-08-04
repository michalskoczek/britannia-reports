# Lessons Learned

> Append-only register of recurring rules and patterns. Re-read at start by /10x-frame, /10x-research, /10x-plan, /10x-plan-review, /10x-implement, /10x-impl-review.

## Updating a document includes the sections the new content contradicts

- **Context**: `context/foundation/infrastructure.md` (risk register) and `src/CLAUDE.md`, during the Phase 4 documentation sync of `identity-and-data-platform`.
- **Problem**: The phase contract named three specific edits — Current State bullets, Getting Started steps, and a `src/CLAUDE.md` entry. Executing only those would have left the risk register still prescribing `firebase init firestore`, the exact command the same plan spends a paragraph warning against, and left `src/CLAUDE.md` silent on the fact that local dev now talks to the production Firebase project. The document would have contradicted itself in a file future agents read first. The extra edits were disclosed at the time, but they were EXTRA relative to the contract, and a reviewer scoring scope discipline strictly has to flag them.
- **Rule**: When editing a document makes another of its sections contradictory or stale, that section is in scope for the same change. Disclose the scope expansion — but do not leave the document disagreeing with itself.
- **Applies to**: Any phase editing `context/foundation/*.md` or a conventions file (`CLAUDE.md`, `AGENTS.md`).

## The second test file is what tests whether the first one was isolated

- **Context**: `test/rules/students.test.mjs`, added by `student-roster` (S-03) Phase 1 next to the pre-existing `report-templates.test.mjs`.
- **Problem**: `npm run test:rules` runs `node --test test/rules`, which starts **one process per file, in parallel**, against a single shared emulator. `@firebase/rules-unit-testing` namespaces both data and rules by `projectId`, and both files declared `projectId = 'britannia-reports'`. So the two suites shared one dataset, and each one's `clearFirestore()` in `afterEach` deleted the other's fixtures mid-test. The symptom appeared in the file nobody had touched: a stable templates test began failing intermittently on a `create` that its own `seedAllowlist` had just made legal — green on the first run, red on the second. Nothing about the new file looked wrong, and the error (`PERMISSION_DENIED`, `evaluation error at L…`) pointed at the rules rather than at the runner.
- **Rule**: A fixture that a test suite creates and destroys is shared state the moment a second suite can run beside it. Before adding a test file next to an existing one, check what namespace its fixtures live in and what the runner's concurrency model is — then give the new file its own namespace (here: its own `projectId`) rather than assuming the old file's isolation was ever real. When the newly-added file is green and an untouched file starts flaking, suspect shared fixtures before suspecting the code under test.
- **Applies to**: `test/rules/*.mjs` (every new file needs a distinct `projectId`); more generally, any suite that clears or seeds a shared store, database, directory, or emulator under a parallel runner.

## The release phase ships after the documentation phase, so it owns a documentation step of its own

- **Context**: `context/foundation/roadmap.md:44, :221, :234`, after `student-picker-in-report` (S-04) Phase 6 merged and deployed to production.
- **Problem**: The plan put documentation in Phase 5 and release in Phase 6. Phase 5's success criterion — "`src/CLAUDE.md`, the roadmap, and the PRD agree with what shipped" — was verified and ticked truthfully. Then Phase 6 deployed, and three roadmap statements written in Phase 5 became false: "Not yet deployed", "the hosting release … has not run yet", and an At-a-glance status cell reading bare `done` where every other released slice reads `done, **deployed YYYY-MM-DD**`. Nothing was skipped and no check failed — the ordering itself guarantees the gap, because the last phase changes the facts the previous phase just recorded.
- **Rule**: When a plan separates a documentation phase from a release phase, the release phase carries its own documentation step for the facts only it can know — deploy date, release contents, post-deploy verification. Do not treat the earlier documentation phase's green checkmark as covering the state after release.
- **Applies to**: Any plan whose final phase is a deploy, migration, or cutover — i.e. any phase that changes facts an earlier phase already wrote down.
