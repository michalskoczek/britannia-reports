import { SemestrReportComponent } from '../../../../semestr-report/semestr-report.component';
import { ReportType } from '../../../enum/report-type.enum';
import { Sex } from '../../../enum/sex.enum';
import { examsRecommendations, learningRecommendations } from '../../../exams';
import {
  behaviourMarks,
  frequencyMarks,
  homeworksMarks,
  involvementMarks,
  marks,
  prepareToLectureMarks,
  pronunciationMarks,
  vocabularyMarks,
} from '../../../marks';
import { books, classes, courses, teachers } from '../../../select-values';
import { ReportFixture } from '../report-fixture';

/**
 * Recorded states for the trimester/semester report.
 *
 * All fourteen `FormArray`s stay empty on purpose: `semestr-report.component.html` binds no
 * `formArrayName` anywhere, so no user can populate `comments`, `recommendations`, or the twelve
 * exam-level arrays. A fixture that filled them would describe an unreachable state.
 *
 * The `class` control holds the plain string value here — the template binds `[value]="classItem.value"`
 * (`semestr-report.component.html:92`). This differs from the year-end report, which binds the object.
 */
export const semestrFixtures: ReportFixture<SemestrReportComponent>[] = [
  {
    id: 'semestr-minimal',
    label: 'Trimester report, required fields only — no date, no additional comment, no exam recommendation',
    apply(component: SemestrReportComponent): void {
      component.form.patchValue({
        reportType: ReportType.TRIMESTER,
        studentName: 'Jan Kowalski',
        name: 'Jan',
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
    id: 'semestr-maximal',
    label: 'Semester report with every conditional section on — additional comment and exam recommendation',
    apply(component: SemestrReportComponent): void {
      component.form.patchValue({
        reportType: ReportType.SEMESTER,
        studentName: 'Anna Nowak',
        name: 'Anna',
        sex: Sex.FEMALE,
        date: new Date('2026-06-12T00:00:00'),
        class: classes[6].value,
        teachers: [teachers[0], teachers[3]],
        studentBookTitle: books[12],
        course: courses[5],
        realizedMaterial: 'Units 1-8',
        avgMark: marks[1].value,
        frequency: frequencyMarks[0].value,
        pronunciation: pronunciationMarks[0].valueFemale ?? pronunciationMarks[0].value,
        vocabulary: vocabularyMarks[0].valueFemale ?? vocabularyMarks[0].value,
        prepareToLecture: prepareToLectureMarks[0].valueFemale ?? prepareToLectureMarks[0].value,
        homeworks: homeworksMarks[0].valueFemale ?? homeworksMarks[0].value,
        involvement: involvementMarks[1].valueFemale ?? involvementMarks[1].value,
        behaviour: behaviourMarks[0].valueFemale ?? behaviourMarks[0].value,
        additionalComment:
          'Anna wykazuje duże zaangażowanie na zajęciach dodatkowych i chętnie pomaga innym uczniom.',
        isExamRecommendation: true,
        examRecommendationOptions: '3',
        examRecommendationResult: examsRecommendations[4],
        learningRecommendations: learningRecommendations[1],
        signature: 'BRITANNIA — Regina Raczyńska',
      });
    },
  },
];
