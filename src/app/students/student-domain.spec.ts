import { STUDENT_IDENTITY_FIELDS } from '../templates/template-domain';
import { STUDENT_IDENTITY_DEFAULTS, STUDENT_IDENTITY_DOMAIN } from './student-domain';

/**
 * The one assertion that makes `S-04` buildable.
 *
 * `S-02` partitioned all 48 controls of the trimester/semester form into four
 * disjoint sets and froze that partition in `semestr-report.component.spec.ts`.
 * `STUDENT_IDENTITY_FIELDS` is the set a template may never write — and it is
 * exactly the set the roster stores, so the picker can hand its payload to the
 * form without a mapping layer.
 *
 * Without this spec the two lists are two prose claims that agree today. With
 * it, adding a field to one side and not the other fails here, in a file whose
 * name says what broke, rather than showing up as a picker that silently leaves
 * a control blank.
 */
describe('the student identity domain', () => {
  it('names exactly the controls a template may never write', () => {
    expect([...STUDENT_IDENTITY_DOMAIN].sort()).toEqual([...STUDENT_IDENTITY_FIELDS].sort());
  });

  it('declares a default for every key it names, and no other', () => {
    expect(Object.keys(STUDENT_IDENTITY_DEFAULTS).sort()).toEqual([...STUDENT_IDENTITY_DOMAIN].sort());
  });

  it('starts `studentName` as a string, because the list sorts on it', () => {
    expect(typeof STUDENT_IDENTITY_DEFAULTS.studentName).toBe('string');
  });
});
