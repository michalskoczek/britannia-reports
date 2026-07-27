import { CambridgeReportComponent } from '../../../../cambridge-report/cambridge-report.component';
import { ExamTypes } from '../../../enum/exam-type.enum';
import { Sex } from '../../../enum/sex.enum';
import { examsRecommendations, resultOfExam } from '../../../exams';
import { classes, courses, teachers } from '../../../select-values';
import { ReportFixture } from '../report-fixture';

/** Exam-level arrays the A2/B1 table reads (`cambridge-report.component.ts:218`). */
const A2B1_ARRAYS = ['listeningA2B1Array', 'readingA2B1Array', 'writingA2B1Array', 'speakingA2B1Array'] as const;

/**
 * Recorded states for the Cambridge mock-exam report.
 *
 * This is the only report type with a genuinely populated `FormArray` surface. The maximal fixture
 * drives `addNextExamTerm` and `addNextComment` — the component's own builders, wired to the template
 * — rather than constructing rows by hand, so the recorded state matches what the UI produces.
 *
 * Two terms per skill are recorded on purpose: `GenerateTable.buildRows` only emits `rowSpan` when a
 * skill has more than one term (`helper/cambridge/static-function/generate-table.ts:60`), so a
 * single-term fixture would leave that branch uncovered.
 */
export const cambridgeFixtures: ReportFixture<CambridgeReportComponent>[] = [
  {
    id: 'cambridge-minimal',
    label: 'Cambridge report with no exam type picked — empty results table, no comments',
    apply(component: CambridgeReportComponent): void {
      component.form.patchValue({
        studentName: 'Jan Kowalski',
        name: 'Jan',
        sex: Sex.MALE,
      });
    },
  },
  {
    id: 'cambridge-maximal',
    label: 'Cambridge A2 Key report with two terms per skill, two comments, and an exam recommendation',
    apply(component: CambridgeReportComponent): void {
      A2B1_ARRAYS.forEach((arrayName: string) => {
        component.addNextExamTerm(arrayName);
        component.addNextExamTerm(arrayName);
      });

      component.addNextComment();
      component.addNextComment();

      const terms = [
        { date: new Date('2026-02-10T00:00:00'), score: 68, result: resultOfExam[2] },
        { date: new Date('2026-05-18T00:00:00'), score: 84, result: resultOfExam[0] },
      ];

      component.form.patchValue({
        studentName: 'Anna Nowak',
        name: 'Anna',
        sex: Sex.FEMALE,
        date: new Date('2026-06-12T00:00:00'),
        class: classes[6].value,
        teachers: [teachers[0], teachers[3]],
        course: courses[5],
        typeOfExam: ExamTypes.A2_KEY,
        listeningA2B1Array: terms,
        readingA2B1Array: terms,
        writingA2B1Array: terms,
        speakingA2B1Array: terms,
        comments: [
          'Wynik z maja pokazuje wyraźny postęp w słuchaniu.',
          'Warto utrzymać tempo pracy nad pisaniem przed sesją czerwcową.',
        ],
        examRecommendationOptions: '3',
        examRecommendationResult: examsRecommendations[3],
        signature: 'BRITANNIA — Regina Raczyńska',
      });
    },
  },
];
