/**
 * The field domain for the student roster.
 *
 * One place answers "which values make up a student", and the gateway, the
 * service, the roster component and the agreement spec all read it from here.
 * Data only: no Angular imports, so it can be imported from anywhere including a
 * plain Node script.
 *
 * `student-domain.spec.ts` asserts that this domain names exactly the same four
 * controls as `STUDENT_IDENTITY_FIELDS` in `../templates/template-domain.ts`.
 * That is the seam `S-04` stands on: the picker writes this set and only this
 * set, and a template writes a disjoint one. If either side drifts, a spec fails
 * instead of the picker quietly leaving a field blank.
 */

import { StudentIdentity } from '../model/student.interface';

/**
 * Bumped only when a stored document's shape changes incompatibly.
 *
 * Adding a field does not qualify: `StudentsService` reads a document
 * tolerantly, treating any key it lacks as that key's default. The version
 * exists for the change that cannot be handled that way.
 */
export const STUDENT_SCHEMA_VERSION = 1;

/**
 * The four keys a stored student carries.
 *
 * Iterate this rather than hand-listing keys — reads and writes both do, which
 * is what keeps them in agreement when the domain changes.
 */
export const STUDENT_IDENTITY_DOMAIN = [
  'studentName',
  'name',
  'sex',
  'class',
] as const satisfies readonly (keyof StudentIdentity)[];

/**
 * What an empty roster form holds, and what a stored document's missing key
 * reads as.
 *
 * `studentName` defaults to the empty string rather than `null` because it is
 * the one value the list sorts and renders by — see the coercion in
 * `StudentsService`. `sex` defaults to `null` because "not chosen yet" is a real
 * state the form starts in; `validate` is what refuses to store it.
 */
export const STUDENT_IDENTITY_DEFAULTS: Readonly<StudentIdentity> = {
  studentName: '',
  name: null,
  sex: null,
  class: null,
};
