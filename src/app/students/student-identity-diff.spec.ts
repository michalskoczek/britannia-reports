import { Sex } from '../shared/enum/sex.enum';
import { StudentIdentity } from '../model/student.interface';
import { STUDENT_IDENTITY_DEFAULTS } from './student-domain';
import { diffIdentity, StudentIdentityDiff } from './student-identity-diff';

/**
 * The question the FR-013 confirmation dialog is built on: what would picking
 * this student cost the teacher.
 *
 * The interesting cases are all about the *left*-hand side — what the report form
 * happens to hold. It starts its four identity controls at `null`, a stored
 * student defaults two of them to `null` and one to `''`, and a teacher who typed
 * and then deleted leaves `''`. Reading those as three different values is what
 * would put an empty dialog in front of every first pick.
 */
describe('diffIdentity', () => {
  const identity = (overrides: Partial<StudentIdentity> = {}): StudentIdentity => ({
    ...STUDENT_IDENTITY_DEFAULTS,
    ...overrides,
  });

  /**
   * What the report form holds before anything is typed into it.
   *
   * The three nullable controls are still `null`; `studentName` reads as `''`
   * because `SemestrReportComponent.collectStudentIdentity` coerces its `null`
   * control there. That is exactly `STUDENT_IDENTITY_DEFAULTS`.
   */
  const blankForm: StudentIdentity = identity();

  const jan: StudentIdentity = identity({
    studentName: 'Jan Kowalski',
    name: 'Jaś',
    sex: Sex.MALE,
    class: 'Klasa 5 szkoły podstawowej',
  });

  const zosia: StudentIdentity = identity({
    studentName: 'Zofia Nowak',
    name: 'Zosia',
    sex: Sex.FEMALE,
    class: 'Klasa 6 szkoły podstawowej',
  });

  it('finds nothing at stake on a blank report form', () => {
    // The ordinary first pick: every control is still `null`, so there is nothing
    // to ask about and the dialog never opens.
    expect(diffIdentity(jan, blankForm)).toEqual({ overwritten: [], cleared: [] });
  });

  it('reads a typed-then-deleted field as blank, not as a value at stake', () => {
    const emptied: StudentIdentity = identity({ studentName: '', name: '', class: '' });

    expect(diffIdentity(jan, emptied)).toEqual({ overwritten: [], cleared: [] });
  });

  it('lists every field a different student would replace', () => {
    const diff: StudentIdentityDiff = diffIdentity(zosia, jan);

    expect(diff.overwritten).toEqual(['studentName', 'name', 'sex', 'class']);
    expect(diff.cleared).toEqual([]);
  });

  it('separates the fields a pick would empty from the ones it would replace', () => {
    // A student stored without the optional short name and class: those two are
    // reset rather than replaced, and the dialog has to say so — "will be
    // cleared" and "will be replaced" are different promises.
    const partial: StudentIdentity = identity({ studentName: 'Zofia Nowak', sex: Sex.FEMALE });

    const diff: StudentIdentityDiff = diffIdentity(partial, jan);

    expect(diff.overwritten).toEqual(['studentName', 'sex']);
    expect(diff.cleared).toEqual(['name', 'class']);
  });

  it('ignores a field whose value the pick does not change', () => {
    const sameClass: StudentIdentity = identity({
      studentName: 'Zofia Nowak',
      name: 'Zosia',
      sex: Sex.FEMALE,
      class: 'Klasa 5 szkoły podstawowej',
    });

    expect(diffIdentity(sameClass, jan).overwritten).toEqual(['studentName', 'name', 'sex']);
  });

  it('finds nothing at stake when the same student is picked twice', () => {
    expect(diffIdentity(jan, jan)).toEqual({ overwritten: [], cleared: [] });
  });

  it('treats a `null` on one side and a `\'\'` on the other as the same value', () => {
    // The form holds `''` for a short name the teacher emptied; the student was
    // stored with `null`. Neither is a change worth a dialog line.
    const emptyName: StudentIdentity = identity({ studentName: 'Jan Kowalski', name: '' });

    expect(diffIdentity(identity({ studentName: 'Jan Kowalski', name: null }), emptyName)).toEqual({
      overwritten: [],
      cleared: [],
    });
  });
});
