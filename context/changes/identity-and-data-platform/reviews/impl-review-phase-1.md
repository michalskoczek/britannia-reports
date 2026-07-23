<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Identity and Data Platform (F-01)

- **Plan**: `context/changes/identity-and-data-platform/plan.md`
- **Scope**: Phase 1 of 4 — Security Rules and Firebase Config Scaffolding
- **Date**: 2026-07-22
- **Commit**: `0afe6ce` (SHA write-back in `b801497`)
- **Verdict**: APPROVED
- **Findings**: 0 critical, 0 warnings, 2 observations — both FIXED in triage (2026-07-22), comment-only edits to `firestore.rules`; the live deny-all rule was not touched.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Scope detection

Phase 1 commit `0afe6ce` touched 6 files. Two are implementation; four are the change folder landing with the first phase (expected — the plan's Phase 1 bootstrap rule).

| File | Status |
|------|--------|
| `firestore.rules` | in plan AND in diff — MATCH |
| `firebase.json` | in plan AND in diff — MATCH |
| `context/changes/identity-and-data-platform/{change,plan,plan-brief}.md`, `reviews/plan-review.md` | change-folder bootstrap, expected |

No planned file was left unimplemented. No unplanned source file was touched.

## Contract verification — `firestore.rules`

Every element of the Phase 1 contract is present:

| Contract element | Evidence |
|---|---|
| `rules_version = '2'` | line 1 |
| `service cloud.firestore` block | line 10 |
| single `match /databases/{database}/documents` | line 11 |
| `match /{document=**}` with `allow read, write: if false;` | lines 13–14 |
| commented ownership scaffold using `request.auth.uid == resource.data.<ownerField>` | line 30 |
| annotated as illustrative; owner field is `S-01`'s to choose | lines 21–27 |
| pre-mortem warning naming the `teacherUid`/`teacherId` typo | lines 35–43 |
| "whoever uncomments this writes rules tests first" | lines 47–52 |

`allow read, write` covers get/list/create/update/delete — the deny is complete, not partial.

## Contract verification — `firebase.json`

- Top-level `firestore.rules` pointer added, resolving to a file that exists at the path `firebase.json` is anchored to.
- `hosting` block byte-for-byte unchanged: the full commit diff for this file is three added lines and zero removed lines. `hosting.public` still `dist/browser` — the coupling guarded by `src/CLAUDE.md:68` is intact.
- No `emulators` key, per the plan-review decision to defer the suite to `S-01`.

**Deploy isolation checked**: `firestore.rules` sits at repo root while `hosting.public` is `dist/browser`, so `firebase deploy --only hosting` cannot publish the rules file. No exposure.

## Success criteria

| Step | Command | Result |
|---|---|---|
| 1.2 | JSON parse + `git diff firebase.json` | PASS — parses, keys `firestore, hosting`, hosting untouched |
| 1.3 | `npm test -- --watch=false --browsers=ChromeHeadless` | PASS — TOTAL: 5 SUCCESS |
| 1.5 | Manual: scaffold reads as illustrative | PASS — confirmed by user at the manual gate |

Both automated criteria re-run during this review, not taken on trust from the implementation run. Manual item 1.5 has observable evidence in the diff (the scaffold is comment-only and syntactically non-viable), so it is not a rubber stamp.

## Findings

### F1 — Machine-state claim embedded in a version-controlled rules file

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `firestore.rules:50-51`
- **Detail**: The comment states the emulator "needs a JDK, which is not currently installed on the development machine; budget that setup." This sentence is EXTRA relative to the Phase 1 contract, which specified the illustrative scaffold, the pre-mortem warning, and the rules-tests-first rule — not environment state. It was disclosed at the manual verification gate and accepted, so it is not undisclosed drift. The substantive issue is different: this is a claim about one machine at one moment, committed into a file with no expiry. The moment anyone installs a JDK it becomes false, and nothing will prompt a correction. The same fact already lives in the plan's Open Risks, which is a dated document where staleness is expected and legible.
- **Fix**: Trim to the durable half — that adopting the harness requires the emulator suite, which carries its own runtime prerequisite — and drop the "not currently installed on the development machine" claim, leaving the plan's Open Risks as the single dated source for machine state.
- **Decision**: FIXED — the two lines now read "The emulator carries its own runtime prerequisite; see that plan section for the current setup cost." The JDK fact stays in the plan's Open Risks, where it is dated.

### F2 — Ownership scaffold sits outside the `service` block with no placement note

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `firestore.rules:29-32`
- **Detail**: The commented `match /<collection>/{docId}` sketch begins at line 29, after the `service cloud.firestore` block closes at line 19. Uncommenting it in place produces a syntax error rather than a working rule. That is consistent with the file's deliberate fail-loudly design — the `<collection>` and `<ownerField>` placeholders are already non-compiling by intent — but the comment never says the block must be moved *inside* `match /databases/{database}/documents` to function. A reader who fixes only the placeholders still gets a parse failure at deploy and has to work out why.
- **Fix**: Add one line to the sketch's preamble noting that the block belongs inside `match /databases/{database}/documents`, alongside the existing deny-all rule.
- **Decision**: FIXED — a three-line placement note now precedes the sketch, stating that the block belongs inside `match /databases/{database}/documents` alongside the deny-all rule, and that where it currently sits it is outside the `service` block and cannot compile.

## What came back clean

The deny-all is complete rather than partial — a common failure mode here is writing `allow read: if false` and leaving writes open, or scoping the wildcard to a single collection. Neither happened. The `hosting` block survived untouched, which matters more than usual in this repo: `src/CLAUDE.md:68` and `infrastructure.md:78` both record that an earlier document revision got the `dist/browser` coupling backwards and that acting on it would have shipped an empty deploy over the live site. The emulator deferral decided during plan review was carried through faithfully — no `emulators` key, no orphaned flag. And the phase touched no application source, so the PDF-fidelity guardrail was never in play.
