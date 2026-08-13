import { YearReportComponent } from '../../../../../year-report/year-report.component';
import { ReportFixture } from '../../report-fixture';

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
];
