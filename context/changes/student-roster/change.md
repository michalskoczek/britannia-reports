---
change_id: student-roster
title: Teacher-scoped student roster with add, view, edit, and delete
status: implemented
created: 2026-07-31
updated: 2026-07-31
archived_at: null
---

## Notes

Roadmap slice **S-03** — see `context/foundation/roadmap.md` (§Slices → S-03, §Backlog Handoff, §Open Roadmap Questions #1).

- **Outcome:** a teacher adds a student, views a list of their own students, edits a student's information, and deletes a student.
- **Outcome as shipped (2026-07-31):** the stored record is four fields — `studentName`, `name` (display first name), `sex`, `class` — not the two this note originally described, and `class` is the report form's own thirteen-value select rather than free text. Both departures are deliberate and exist so `S-04`'s picker fills all four student-identity controls with no mapping layer; PRD FR-005 and §Non-Goals carry the dated amendment.
- **PRD refs:** FR-005, FR-006, FR-007, FR-008, FR-018.
- **Prerequisites:** S-01 (`google-sign-in-gate`) — done and deployed 2026-07-30. Parallel sibling S-02 (`trimester-report-templates`) is also done and deployed, so nothing blocks this slice.
- **Unlocks:** S-04 (`student-picker-in-report`), which needs both this roster and S-02's templates.
- **Inherited from S-02 (2026-07-30):** the Firebase emulator suite and the `npm run test:rules` harness already exist. This slice does **not** build them — it adds its own scenarios to `test/rules/` before shipping its first per-teacher rule, follows the path-keyed ownership shape `users/{uid}/<collection>/{docId}` compared against `request.auth.uid`, and mirrors the gateway/service split in `src/app/templates/`.
- **Open question carried in (roadmap OQ #1 / PRD OQ #2):** the GDPR baseline for minors' data — export on request, deletion on request, retention windows, consent language — was never pinned. This is the first slice to persist student data. Owner: school director. Does not block MVP (Britannia is the only tenant; FR-008 provides the deletion path).
- **Scope discipline:** PRD Non-Goals cut the class entity down to a free-text label and student records down to a name. The roadmap flags this as "the cheapest slice and the one most likely to grow" — resist second-level CRUD.
