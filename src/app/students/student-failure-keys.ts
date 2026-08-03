/**
 * How a `StudentsFailure` is said to a teacher.
 *
 * Extracted from `StudentRosterComponent` by `S-04`: the picker's quick-add
 * reports the same failures from the same service, and a second copy of this map
 * would drift apart on the first new failure mode — the two surfaces would then
 * disagree about what went wrong while the store said one thing.
 *
 * Data only, no Angular imports, so both surfaces read one definition.
 */

import { StudentsFailure } from './students.service';

/**
 * One message per failure the service can name.
 *
 * A total record rather than a lookup with a fallback: a new member of
 * `StudentsFailure` fails to compile here instead of reaching a teacher as
 * "something went wrong". The same arrangement `TemplatePanelComponent` uses.
 */
export const FAILURE_KEYS: Readonly<Record<StudentsFailure, string>> = {
  'not-signed-in': 'students.errors.notSignedIn',
  'name-required': 'students.errors.nameRequired',
  'name-too-long': 'students.errors.nameTooLong',
  'sex-required': 'students.errors.sexRequired',
  'permission-denied': 'students.errors.permissionDenied',
  offline: 'students.errors.offline',
  unknown: 'students.errors.unknown',
};

/**
 * Failures about what the teacher typed, as opposed to what the store did.
 *
 * These get an inline message under the form rather than a snackbar: a message
 * that disappears on its own is the wrong shape for one that has to stay
 * readable while the field it describes is being fixed.
 */
export const FORM_FAILURES: readonly StudentsFailure[] = ['name-required', 'name-too-long', 'sex-required'];
