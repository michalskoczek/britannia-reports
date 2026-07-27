import { TeddyEddieReportComponent } from '../../../../teddy-eddie-report/teddy-eddie-report.component';
import {
  booksToChoosingTE,
  certificationPurpose,
  courseLevelTE,
  coursesTE,
  languageLevels,
} from '../../../development-path';
import { ReportFixture } from '../report-fixture';

/**
 * Recorded states for the Teddy Eddie report.
 *
 * Both tables are built by `setTableTE`, the handler the template wires to the age select
 * (`teddy-eddie-report.component.html:5`). It populates `teddyEddieArray` from the chosen age and
 * then delegates to `setClasses('Klasa 2 SP')` for the Cambridge-path table, so driving that one
 * method reproduces exactly what selecting an age does in the UI.
 *
 * The `class` control is disabled (`teddy-eddie-report.component.ts:56`) and `patchValue` skips
 * disabled controls; it is absent from this report's PDF anyway.
 */
export const teddyEddieFixtures: ReportFixture<TeddyEddieReportComponent>[] = [
  {
    id: 'teddy-eddie-minimal',
    label: 'Teddy Eddie report with no age picked — both tables render header rows only',
    apply(component: TeddyEddieReportComponent): void {
      component.form.patchValue({
        studentName: 'Jan Kowalski',
        name: 'Jan',
      });
    },
  },
  {
    id: 'teddy-eddie-maximal',
    label: 'Teddy Eddie report for a 5-year-old — three immersion rows, two Cambridge-path rows, one deleted',
    apply(component: TeddyEddieReportComponent): void {
      component.form.patchValue({ age: '5 lat' });
      component.setTableTE('5 lat');

      component.form.patchValue({
        studentName: 'Anna Nowak',
        name: 'Anna',
        date: new Date('2026-06-12T00:00:00'),
        course: coursesTE[0],
        avgMark: '5',
        frequency: '96',
        additionalComment: 'Anna świetnie odnalazła się w metodzie Teddy Eddie.',
        signature: 'BRITANNIA — Regina Raczyńska',
        teddyEddieArray: [
          { course: coursesTE[0], courseLevel: courseLevelTE[0], book: booksToChoosingTE[0] },
          { course: coursesTE[0], courseLevel: courseLevelTE[2], book: booksToChoosingTE[1] },
          // Excluded from the PDF by the filter at teddy-eddie-report.component.ts:412.
          { course: coursesTE[1], courseLevel: courseLevelTE[1], book: booksToChoosingTE[2], shouldDeleteRow: true },
        ],
        developmentLanguageSkillsArray: [
          { course: coursesTE[2], courseLevel: languageLevels[1], certificationPurpose: certificationPurpose[1] },
          { course: coursesTE[3], courseLevel: languageLevels[2], certificationPurpose: certificationPurpose[2] },
        ],
      });
    },
  },
];
