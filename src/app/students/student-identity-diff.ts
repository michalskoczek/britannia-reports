/**
 * What picking a student would cost the report form.
 *
 * A pure function rather than a method on the picker, for the same reason
 * `TemplatesService.diff` is one: "would this overwrite something the teacher
 * typed" is the question the FR-011-shaped confirmation dialog is built on, and
 * it is worth being able to drive it directly instead of through a rendered
 * component. It also keeps the panel from reaching into `SemestrReportComponent
 * .form` — the panel only ever sees two `StudentIdentity` objects.
 *
 * Data only, no Angular imports.
 */

import { StudentIdentity } from '../model/student.interface';
import { STUDENT_IDENTITY_DEFAULTS, STUDENT_IDENTITY_DOMAIN } from './student-domain';

/** Which fields the pick would change, split by what it would do to them. */
export interface StudentIdentityDiff {
  /** Held a value, and the pick replaces it with a different one. */
  overwritten: readonly (keyof StudentIdentity)[];
  /** Held a value, and the pick resets it to its default. */
  cleared: readonly (keyof StudentIdentity)[];
}

/**
 * `null`, `undefined` and `''` are one value, not three.
 *
 * The report form starts its four identity controls at `null`, a stored student
 * defaults `name` and `class` to `null` while `studentName` defaults to `''`,
 * and a teacher who typed and then deleted leaves `''` behind. Reading those as
 * different values would make a blank form report `studentName` as something the
 * pick is about to overwrite — a confirmation dialog with nothing at stake in
 * it, on every first pick of every report.
 */
const normalize = (value: unknown): unknown => (value === null || value === undefined ? '' : value);

/** Whether a field still holds what a fresh form and a fresh student both hold. */
const isDefault = (field: keyof StudentIdentity, value: unknown): boolean =>
  normalize(value) === normalize(STUDENT_IDENTITY_DEFAULTS[field]);

/**
 * What a pick would change, field by field.
 *
 * Only fields that already hold something can appear: a field still at its
 * default has nothing at stake, which is what makes the first pick of a report
 * silent.
 */
export const diffIdentity = (next: StudentIdentity, current: StudentIdentity): StudentIdentityDiff => {
  const overwritten: (keyof StudentIdentity)[] = [];
  const cleared: (keyof StudentIdentity)[] = [];

  for (const field of STUDENT_IDENTITY_DOMAIN) {
    if (isDefault(field, current[field])) {
      continue;
    }

    if (isDefault(field, next[field])) {
      cleared.push(field);
    } else if (normalize(current[field]) !== normalize(next[field])) {
      overwritten.push(field);
    }
  }

  return { overwritten, cleared };
};
