import { YearReportComponent } from '../../../../../year-report/year-report.component';
import { ReportFixture } from '../../report-fixture';
import { LONG_FREE_TEXT, NON_ASCII_STUDENT_NAME } from './hostile-text';

/**
 * Reachable-but-hostile states for the end-of-school-year report.
 *
 * These are deliberately NOT in `year-report.fixture.ts`. That array is an input to two runners: the
 * smoke spec in `npm test` and the capture harness behind `docs/pdf-fidelity-check.md`, where each
 * fixture's `id` becomes a reference-PDF filename a human is expected to compare by eye. Edge states
 * exist to prove a document is produced at all, not to be reviewed for layout, so mixing them into
 * that array would grow the manual fidelity procedure with documents nobody reads.
 *
 * The `ReportFixture` contract still holds in full: `apply` must reach its state the way the UI
 * reaches it. Every state here is reachable with no developer tools and no bypass — the year-end form
 * declares zero validators and its template has no `[disabled]` gate
 * (`year-report.component.html:305-309`), so an untouched form is genuinely downloadable.
 */
export const yearEdgeFixtures: ReportFixture<YearReportComponent>[] = [
  {
    id: 'year-untouched',
    label: 'Year-end report downloaded from a form the teacher never typed into',
    apply(): void {
      // Intentionally empty. Opening the year-end tab and clicking download is the whole state.
    },
  },
  {
    id: 'year-all-details-deleted',
    label: 'Year-end report with every row of the language-details table suppressed',
    apply(component: YearReportComponent): void {
      // The seven rows of `getBodyInSkills` are independently suppressible and nothing forces a
      // header, so ticking all seven leaves `table.body` empty. Each control is an ordinary
      // `mat-checkbox` defaulting to false (`year-report.component.html`), so this is the state the
      // UI produces — no bypass, no developer tools.
      component.form.patchValue({
        eofEvaluationDelete: true,
        frequencyDelete: true,
        certificationPurposeOnThisYearDelete: true,
        readinessToContinueOnNextLevelDelete: true,
        examRecommendationInTableDelete: true,
        parentDecisionDelete: true,
        recommendationInNextYearInTableDelete: true,
      });
    },
  },
  {
    id: 'year-long-free-text',
    label:
      'Year-end report with both free-text areas filled far past the space the layout reserves — asserts only that a PDF is produced, see `hostile-text.ts` for why nothing stronger is claimed',
    apply(component: YearReportComponent): void {
      // `realizedMaterial` (`year-report.component.html:102-109`) and `additionalComment`
      // (`:281-287`) are this report's two `app-textarea` controls and the only free-text surface it
      // has beyond the name and the signature line. Neither carries a `maxlength`, so pasting a
      // term's worth of notes into either is an ordinary thing to do.
      component.form.patchValue({
        studentName: 'Jan Kowalski',
        realizedMaterial: LONG_FREE_TEXT,
        additionalComment: LONG_FREE_TEXT,
      });
    },
  },
  {
    id: 'year-non-ascii-name',
    label:
      'Year-end report for a student whose name carries Polish diacritics — asserts only that a PDF is produced, not that any glyph rendered',
    apply(component: YearReportComponent): void {
      // Only `studentName` is set: this builder never reads `form.value.name`, and the year-end
      // template binds no control by that name either, so patching it would record a state the UI
      // cannot produce.
      component.form.patchValue({ studentName: NON_ASCII_STUDENT_NAME });
    },
  },
];
