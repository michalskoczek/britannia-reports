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
export const semestrEdgeFixtures: ReportFixture<SemestrReportComponent>[] = [
  {
    id: 'semestr-required-only',
    label: 'Trimester report with only the nine required controls filled — the validator floor, nothing below it is downloadable',
    apply(component: SemestrReportComponent): void {
      // Not a copy of `semestr-minimal`, which also sets `name`. `name` has no validator, and
      // `generatePDF` feeds it to `changeXToStudentName`, which reads `textValue[0]` and substitutes
      // — so this is the state that goes red if that substitution ever stops tolerating an unset
      // name. `semestr-minimal` would stay green through exactly that regression.
      component.form.patchValue({
        reportType: ReportType.TRIMESTER,
        studentName: 'Jan Kowalski',
        sex: Sex.MALE,
        pronunciation: pronunciationMarks[2].value,
        vocabulary: vocabularyMarks[2].value,
        prepareToLecture: prepareToLectureMarks[2].value,
        homeworks: homeworksMarks[2].value,
        involvement: involvementMarks[2].value,
        behaviour: behaviourMarks[2].value,
      });
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
      component.form.patchValue({
        reportType: ReportType.TRIMESTER,
        studentName: 'Jan Kowalski',
        sex: Sex.MALE,
        pronunciation: pronunciationMarks[2].value,
        vocabulary: vocabularyMarks[2].value,
        prepareToLecture: prepareToLectureMarks[2].value,
        homeworks: homeworksMarks[2].value,
        involvement: involvementMarks[2].value,
        behaviour: behaviourMarks[2].value,
        isExamRecommendation: true,
      });
    },
  },
];
