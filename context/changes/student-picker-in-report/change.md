---
change_id: student-picker-in-report
title: Pre-fill student-identity fields from the roster in the trimester/semester report
status: implementing
created: 2026-07-31
updated: 2026-08-03
archived_at: null
---

## Notes

S-04, `student-picker-in-report`, from `context/foundation/roadmap.md`.

Roadmap entry: `## Slices` → `### S-04: Student picker in the trimester/semester report`.
Prerequisites S-02 and S-03 both landed and deployed, so this slice is unblocked as of 2026-07-31.

Three notes the roadmap flags to read before planning:

- The roster stores exactly `STUDENT_IDENTITY_FIELDS` (`studentName`, `name`, `sex`, `class`), spec-asserted in `src/app/students/student-domain.spec.ts` — no mapping layer needed at the form boundary.
- The disjoint-domain rule (`src/app/templates/template-domain.ts`) is machine-checked; the picker writes only the student-identity set, never template, per-student, or unreachable fields.
- The shell-reset cost `S-03` deferred lands here: `/students` is a route, so leaving the shell drops unsaved report-form state. Needs an in-form quick-add or preserved shell state.
