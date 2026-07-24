import { YearReportComponent } from '../../../../year-report/year-report.component';
import { certificationPurpose, languageLevels } from '../../../development-path';
import { Sex } from '../../../enum/sex.enum';
import { books, classes, courses, teachers } from '../../../select-values';
import { ReportFixture } from '../report-fixture';

/**
 * Recorded states for the end-of-school-year report.
 *
 * The `class` control holds the whole `{ label, value }` object here — the template binds
 * `[value]="classValue"` (`year-report.component.html:33`) and the PDF builder reads
 * `form.value.class.value` (`:317`). Leaving it null throws before pdfmake is ever called, which is
 * why even the minimal fixture sets it. This differs from the trimester/semester report, whose
 * `class` control holds a plain string.
 */
export const yearFixtures: ReportFixture<YearReportComponent>[] = [
  {
    id: 'year-minimal',
    label: 'Year-end report with an empty development path and no additional comment',
    apply(component: YearReportComponent): void {
      component.form.patchValue({
        studentName: 'Jan Kowalski',
        class: classes[6],
      });
    },
  },
  {
    id: 'year-maximal',
    label: 'Year-end report with a six-row development path, one deleted row, one hidden detail, and a comment',
    apply(component: YearReportComponent): void {
      component.form.patchValue({ class: classes[6] });
      component.setClasses(classes[6].value);

      component.form.patchValue({
        studentName: 'Anna Nowak',
        name: 'Anna',
        sex: Sex.FEMALE,
        date: new Date('2026-06-12T00:00:00'),
        teachers: [teachers[0], teachers[3]],
        studentBookTitle: books[12],
        course: courses[5],
        realizedMaterial: 'Units 1-12',
        eofEvaluation: '5',
        frequency: '94',
        readinessToContinueOnNextLevel: 'Tak',
        certificationPurposeOnThisYear: 'zrealizowany',
        examRecommendationInTable: 'Cambridge KET',
        parentDecision: 'Tak',
        recommendationInNextYear: 'Regular',
        // Hides one row of the language-details table (`getBodyInSkills`, year-report.component.ts:575).
        frequencyDelete: true,
        additionalComment:
          'Anna konsekwentnie pracowała przez cały rok i jest gotowa na kolejny poziom.',
        signature: 'BRITANNIA — Regina Raczyńska',
        developmentLanguageSkillsArray: [
          { courseLevel: languageLevels[6], certificationPurpose: certificationPurpose[4] },
          { courseLevel: languageLevels[7], certificationPurpose: certificationPurpose[5] },
          { courseLevel: languageLevels[8], certificationPurpose: certificationPurpose[5] },
          { courseLevel: languageLevels[9], certificationPurpose: certificationPurpose[6] },
          { courseLevel: languageLevels[10], certificationPurpose: certificationPurpose[6] },
          // Excluded from the PDF by the filter at year-report.component.ts:483.
          { courseLevel: languageLevels[11], certificationPurpose: certificationPurpose[7], shouldDeleteRow: true },
        ],
      });
    },
  },
];
