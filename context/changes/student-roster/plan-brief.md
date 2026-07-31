# Student Roster (S-03) — Plan Brief

> Full plan: `context/changes/student-roster/plan.md`

## What & Why

Each teacher gets a private roster of their own students — add, list, edit, delete (FR-005…FR-008). It is one half of the US-01 flow: `S-02` proved a teacher can stop retyping cohort boilerplate, and this slice supplies the other pre-fill source so `S-04` can stop them retyping student identity too. On its own it is also the smallest useful thing: a place to keep the class list instead of a spreadsheet.

## Starting Point

`S-01` (sign-in gate) and `S-02` (templates) are done and live since 2026-07-30. `S-02` left behind exactly what this slice needs: the Firebase emulator suite, the `npm run test:rules` harness, a `gateway → service → component` seam to copy, and a `ConfirmDialogComponent` written generically with a comment saying `S-03` would reuse it. No `students` collection, rule, model, or surface exists; the Firestore catch-all denies the path today.

## Desired End State

A signed-in teacher opens **Uczniowie / Students** from the header, sees their own students sorted by name, adds one with full name + display name + sex + class, edits any field in place, and deletes one behind a confirmation dialog. A second teacher on the same deployment sees a disjoint list and cannot reach the first one's data even with a hand-crafted request — proven by rules tests, not asserted.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Stored fields | All four identity fields: `studentName`, `name`, `sex`, `class` | `sex` is required on the report form and drives gendered PDF wording, so omitting it would leave `S-04` filling half the fields and the teacher re-picking sex every report | Plan |
| `class` shape | The same closed select as the report form (`classes`) | The report form's `class` is a 13-value select, so free text (FR-005's wording) would pre-fill a value the control cannot hold | Plan |
| Surface | New `/students` route behind `authGuard`, linked from the header | `src/CLAUDE.md`'s split — the router decides *whether you are in the app*, the tab registry decides *which report* — and a roster is neither a report nor a tab | Plan |
| Document id | Firestore auto-id | A student's name is mutable (FR-007) and non-unique, so name-as-id (the templates pattern) would make a rename a non-atomic delete + create | Plan |
| Rules scope | Owner + allowlist, `read/create/update/delete`; no shape validation | The shape `firestore.rules` itself prints as the template to copy; validating a schema inside rules is the silent-drift failure `infrastructure.md` documents | Plan |
| Edit UX | One form above the list, two modes | One set of fields and one validation path for add and edit; mirrors `template-panel`'s layout | Plan |

## Scope

**In scope:** the `users/{uid}/students/{studentId}` rule and its rules tests; model, domain constant, gateway, service and their specs; the `/students` route, header navigation and the roster component; PL/EN translations; documentation sync; deploy.

**Out of scope:** the `S-04` student picker (no `*-report.component.*` file is touched, so the PDF-fidelity guardrail is not engaged); GDPR work beyond data minimization; search, filter or grouping; CSV import; duplicate-name detection; a class entity; director-specific behaviour.

## Architecture / Approach

```
StudentRosterComponent  (/students, authGuard)   ← the only UI
        │  signals + returned results
StudentsService         decisions: validation, cache gated on uid, sort, error classification
        │  fake-able seam — no Firebase below this line is reachable above it
StudentsGateway         every @angular/fire/firestore call, no decisions
        │
Firestore  users/{uid}/students/{studentId}      ← owner + allowlist, first mutable rule
```

Layer order is deliberate: the rule and its tests land **before** the code above them — the order `S-02` established and `S-01` did not follow.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Store contract | The `students` rule + `test/rules/students.test.mjs` | First `update` rule in the project — an over-permissive rule fails silently, which is why the tests come with it |
| 2. Data layer | Model, domain constant, gateway, service, specs | Fakes more agreeable than Firebase — the failure mode that cost `S-01` three browser-only defects |
| 3. Roster surface | Route, header nav, component, translations | Leaving the shell resets the tab and drops unsaved report-form state |
| 4. Verification & docs | All gates green; `src/CLAUDE.md`, rules header, roadmap, PRD in agreement | Documents left contradicting each other (`lessons.md` names this as a recurring rule) |
| 5. Release | Rules deployed, then hosting, verified on production | Rules shipped after the client = `permission-denied` on every roster call |

**Prerequisites:** `S-01` and `S-02` merged and deployed (done); emulator suite and JDK on the machine (done); a seeded `allowedUsers` document for local sign-in.
**Estimated effort:** ~3–4 sessions across 5 phases; Phase 3 is the largest.

## Open Risks & Assumptions

- **Storing `sex` widens PRD §Non-Goals' data-minimization claim** about minors' records. Deliberate, argued in the plan, and recorded in the PRD as a dated amendment — but it is a real widening, not a reading of the existing text.
- **Roadmap Open Question #1 (GDPR) stays open while student data goes live.** Export, retention and consent language are unowned by this slice; FR-008 remains the only deletion path. Owner: school director.
- **Navigating to `/students` and back destroys an in-progress report form.** Tolerable here (roster work precedes report work), a real problem for `S-04`, where "this student isn't in my roster yet" arrives mid-report.
- **`class` as a closed select departs from FR-005's wording.** If the school later wants "Klasa 5B" as a group label, that is a second field and a new change.
- **Nothing runs `npm run test:rules` automatically.** There is no CI; the habit belongs to whoever edits `firestore.rules`.

## Success Criteria (Summary)

- A teacher adds, sees, edits and deletes their own students, in Polish or English, without a developer.
- A second teacher's roster is invisible and unreachable — asserted by rules tests, then confirmed with two real accounts on production.
- The four report forms and their PDFs are untouched.
