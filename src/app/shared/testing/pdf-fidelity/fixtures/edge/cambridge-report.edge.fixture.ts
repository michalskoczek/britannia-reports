import { CambridgeReportComponent } from '../../../../../cambridge-report/cambridge-report.component';
import { ExamTypes } from '../../../../enum/exam-type.enum';
import { ReportFixture } from '../../report-fixture';
import { LONG_FREE_TEXT, NON_ASCII_STUDENT_NAME } from './hostile-text';

/**
 * Reachable-but-hostile states for the Cambridge mock-exam report.
 *
 * Kept out of `cambridge-report.fixture.ts` for the same reason as the other edge modules: that
 * array feeds the capture harness behind `docs/pdf-fidelity-check.md`, and edge states are not
 * documents anyone reviews for layout.
 *
 * **Why `studentName` alone is the floor here.** `studentName` carries the form's one validator
 * (`cambridge-report.component.ts:444`) and the download button is
 * `[disabled]="form.invalid"` (`cambridge-report.component.html:285`), so a form with less than
 * this cannot be submitted through the UI at all. A test for an untouched Cambridge form would
 * therefore assert a state a teacher cannot reach — the specs call `generatePDF` directly and so
 * walk straight past the gate — which breaks the `ReportFixture` contract at
 * `report-fixture.ts:5-8`. Phase 4 pins that gate with its own assertions; do not lower this floor
 * without going through it. (`generatePDF` also reads `form.value.studentName.split(' ')` for the
 * filename, so it depends on that validator holding.)
 */
export const cambridgeEdgeFixtures: ReportFixture<CambridgeReportComponent>[] = [
  {
    id: 'cambridge-required-only',
    label: 'Cambridge report with only the one required field filled — the validator floor, nothing below it is downloadable',
    apply(component: CambridgeReportComponent): void {
      // Not a copy of `cambridge-minimal`, which also sets `name` and `sex`. Neither of those
      // carries a validator, so this is the state that goes red the moment the builder starts
      // reading one of them the way it reads `class` — and `cambridge-minimal` would stay green
      // through exactly that regression.
      component.form.patchValue({ studentName: 'Jan Kowalski' });
    },
  },
  {
    id: 'cambridge-exam-type-without-terms',
    label: 'Cambridge report with an exam type picked and no exam term added — the results table is absent from the content array entirely',
    apply(component: CambridgeReportComponent): void {
      // `chooseTableOfExam` returns a bare `[]` when every array for the chosen family is empty
      // (`cambridge-report.component.ts:208`), and that `[]` sits at a content-array position. This
      // is one select away from the fixture above, so it is the likeliest half-filled state of all.
      component.form.patchValue({
        studentName: 'Jan Kowalski',
        typeOfExam: ExamTypes.A2_KEY,
      });
    },
  },
  {
    id: 'cambridge-blank-exam-term',
    label: 'Cambridge report with an exam term row added and left blank — date, score and result all unset',
    apply(component: CambridgeReportComponent): void {
      // `addNextExamTerm` is what the template's "add term" control calls, and every control in the
      // pushed group starts null with no validator (`cambridge-report.component.ts:173-179`). A
      // teacher who adds a row and then downloads before filling it reaches exactly this.
      component.form.patchValue({
        studentName: 'Jan Kowalski',
        typeOfExam: ExamTypes.A2_KEY,
      });

      component.addNextExamTerm('listeningA2B1Array');
    },
  },
  {
    id: 'cambridge-long-free-text',
    label:
      'Cambridge report with two long comments and a long signature line — asserts only that a PDF is produced, see `hostile-text.ts` for why nothing stronger is claimed',
    apply(component: CambridgeReportComponent): void {
      // `comments` is the only `FormArray` of free text in the four reports that a template actually
      // binds (`cambridge-report.component.html:164-181`), and rows are added through the
      // component's own `addNextComment` — the handler the "add comment" control calls — so this
      // reaches the state the way the UI does. Two rows rather than one because the second is what
      // shows the long text repeating down the page rather than being a one-off block.
      component.addNextComment();
      component.addNextComment();

      component.form.patchValue({
        studentName: 'Jan Kowalski',
        comments: [LONG_FREE_TEXT, LONG_FREE_TEXT],
        signature: LONG_FREE_TEXT,
      });
    },
  },
  {
    id: 'cambridge-non-ascii-name',
    label:
      'Cambridge report for a student whose name carries Polish diacritics — asserts only that a PDF is produced, not that any glyph rendered',
    apply(component: CambridgeReportComponent): void {
      // The name also leaves the builder through the download filename here —
      // `form.value.studentName.split(' ').join('-')` (`cambridge-report.component.ts:424`) — so a
      // non-ASCII name reaches one surface it does not reach on the year-end report.
      component.form.patchValue({ studentName: NON_ASCII_STUDENT_NAME });
    },
  },
];
