/**
 * Student roster types (FR-005…FR-008).
 *
 * Stored at `users/{uid}/students/{studentId}`, where `studentId` is a Firestore
 * auto-id. Ownership is the path segment, not a field on the document;
 * `firestore.rules` explains why, and why this collection — unlike
 * `reportTemplates` — is allowed to be updated.
 */

import { Sex } from '../shared/enum/sex.enum';

/**
 * Who a report is about.
 *
 * These four names are not a fresh invention: they are exactly
 * `STUDENT_IDENTITY_FIELDS` from `src/app/templates/template-domain.ts`, the set
 * a template may never write. `S-04`'s picker takes an object of this shape and
 * patches it straight into the trimester/semester form, so the agreement between
 * the two is asserted in `student-domain.spec.ts` rather than trusted.
 *
 * `name` is not a duplicate of `studentName`. `studentName` is the full name
 * printed in the report header; `name` is the short form substituted into the
 * report's prose ("Jaś opanował…"), which is why it is separate and optional.
 *
 * `sex` is stored even though PRD §Non-Goals describes a student as "a name and
 * a class label". The trimester/semester form makes it a required control and
 * uses it to pick the gendered wording the PDF prints (`Uczeń` / `Uczennica`);
 * leaving it out would mean re-picking it for every single report, which is the
 * retyping this whole change exists to remove. Recorded as a deliberate
 * widening — see the plan and the PRD amendment.
 */
export interface StudentIdentity {
  /** Full name, as printed. Required; never blank in a stored document. */
  studentName: string;
  /** Short form used inside the report's sentences. Optional. */
  name: string | null;
  /** Required by `StudentsService.validate`; nullable so an absent or malformed stored value reads as "unknown" rather than as a wrong answer. */
  sex: Sex | null;
  /** One of `classes[].value` in `src/app/shared/select-values.ts`. Optional. */
  class: string | null;
}

/** A student as the app works with it. */
export interface Student {
  /** The Firestore auto-id. Carries no meaning — the name is a field. */
  id: string;
  identity: StudentIdentity;
  /** `null` until the server timestamp written on create has materialized. */
  createdAt: Date | null;
}

/** A student on its way in or out: no id, no timestamps. */
export interface StudentDraft {
  identity: StudentIdentity;
}

/**
 * The stored document.
 *
 * `identity` is nested rather than spread across the document root so a write
 * replaces the whole set at once — the same shape `test/rules/students.test.mjs`
 * exercises — and so a future non-identity field (a note, an archive flag)
 * cannot collide with a control name.
 */
export interface StudentDocument {
  schemaVersion: number;
  identity: StudentIdentity;
  createdAt: unknown;
  updatedAt: unknown;
}
