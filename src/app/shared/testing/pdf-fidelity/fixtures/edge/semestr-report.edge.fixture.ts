import { SemestrReportComponent } from '../../../../../semestr-report/semestr-report.component';
import { ReportType } from '../../../../enum/report-type.enum';
import { Sex } from '../../../../enum/sex.enum';
import {
  behaviourMarks,
  homeworksMarks,
  involvementMarks,
  prepareToLectureMarks,
  pronunciationMarks,
  vocabularyMarks,
} from '../../../../marks';
import { ReportFixture } from '../../report-fixture';
import { LONG_FREE_TEXT, NON_ASCII_DISPLAY_NAME, NON_ASCII_STUDENT_NAME } from './hostile-text';

/**
 * Reachable-but-hostile states for the trimester/semester report.
 *
 * Kept out of `semestr-report.fixture.ts` for the same reason as the other edge modules: that array
 * feeds the capture harness behind `docs/pdf-fidelity-check.md`, and edge states are not documents
 * anyone reviews for layout.
 *
 * **Why the nine required controls are the floor here.** This form carries nine validators —
 * `reportType`, `studentName`, `sex` and the six descriptive marks
 * (`semestr-report.component.ts:1051-1075`) — and its download button is `[disabled]="form.invalid"`
 * (`semestr-report.component.html:408`). Anything below that cannot be submitted through the UI, so
 * a fixture below it would describe a state no teacher can produce, breaking the `ReportFixture`
 * contract at `report-fixture.ts:5-8`. The specs call `generatePDF` directly and walk past the gate,
 * which is exactly why the floor has to be enforced here rather than trusted to the runner. Phase 4
 * pins that gate with its own assertions; do not lower this floor without going through it.
 *
 * `reportType` is required but ships with a default of `TRIMESTER`, so it is satisfied on an
 * untouched form — it is set explicitly below to keep the recorded state readable, not because the
 * form would otherwise be invalid.
 *
 * The six marks are patched after `sex` on purpose. The sex-driven remap subscribes to the `sex`
 * control's own stream and rewrites those six controls whenever it fires, so a fixture that set the
 * marks first would record a state the remap immediately overwrote.
 */

/**
 * The nine required controls, in the order the remap needs them. Every fixture below starts from
 * this — a state below it cannot be downloaded, so there is no such thing as a semester/trimester
 * edge fixture that does not contain it. Spread it first so `sex` keeps its position ahead of the
 * six marks.
 */
const REQUIRED_FLOOR = {
  reportType: ReportType.TRIMESTER,
  studentName: 'Jan Kowalski',
  sex: Sex.MALE,
  pronunciation: pronunciationMarks[2].value,
  vocabulary: vocabularyMarks[2].value,
  prepareToLecture: prepareToLectureMarks[2].value,
  homeworks: homeworksMarks[2].value,
  involvement: involvementMarks[2].value,
  behaviour: behaviourMarks[2].value,
};

export const semestrEdgeFixtures: ReportFixture<SemestrReportComponent>[] = [
  {
    id: 'semestr-required-only',
    label: 'Trimester report with only the nine required controls filled — the validator floor, nothing below it is downloadable',
    apply(component: SemestrReportComponent): void {
      // Not a copy of `semestr-minimal`, which also sets `name`. `name` has no validator, and
      // `generatePDF` feeds it to `changeXToStudentName`, which reads `textValue[0]` and substitutes
      // — so this is the state that goes red if that substitution ever stops tolerating an unset
      // name. `semestr-minimal` would stay green through exactly that regression.
      component.form.patchValue({ ...REQUIRED_FLOOR });
    },
  },
  {
    id: 'semestr-exam-recommendation-empty',
    label: 'Trimester report at the floor with the exam-recommendation section switched on and no option picked',
    apply(component: SemestrReportComponent): void {
      // `isExamRecommendation` is an ordinary `mat-checkbox`
      // (`semestr-report.component.html:302`) and it is what un-disables the three radio buttons
      // beneath it. Ticking it and downloading without choosing one of them renders the whole
      // recommendation table with all three checkmark images empty — one click from the floor above.
      component.form.patchValue({ ...REQUIRED_FLOOR, isExamRecommendation: true });
    },
  },
  {
    id: 'semestr-long-free-text',
    label:
      'Trimester report with both free-text areas and the signature line filled far past the space reserved for them — asserts only that a PDF is produced, see `hostile-text.ts` for why nothing stronger is claimed',
    apply(component: SemestrReportComponent): void {
      // `realizedMaterial` (`semestr-report.component.html:156-163`) and `additionalComment`
      // (`:288-295`) are this form's two `app-textarea` controls; neither carries a `maxlength`, and
      // neither is one of the nine validated controls, so any length reaches the builder. The
      // additional-comment block is what makes this report's second page, so long text there is the
      // case most likely to push the layout.
      component.form.patchValue({
        ...REQUIRED_FLOOR,
        realizedMaterial: LONG_FREE_TEXT,
        additionalComment: LONG_FREE_TEXT,
        signature: LONG_FREE_TEXT,
      });
    },
  },
  {
    id: 'semestr-non-ascii-name',
    label:
      'Trimester report for a student whose name carries Polish diacritics, in both name controls — asserts only that a PDF is produced, not that any glyph rendered',
    apply(component: SemestrReportComponent): void {
      // This is the one report that reads BOTH name controls: `studentName` heads the document and
      // feeds the filename, while `name` is substituted into six mark sentences by
      // `changeXToStudentName` (`semestr-report.component.ts:731,758`). `Jaś` is the PRD's own
      // example for that second control (`prd.md:114`), so the substituted case is the one that
      // matters here — a diacritic that fails inside a sentence fails six times over.
      component.form.patchValue({
        ...REQUIRED_FLOOR,
        studentName: NON_ASCII_STUDENT_NAME,
        name: NON_ASCII_DISPLAY_NAME,
      });
    },
  },
];
