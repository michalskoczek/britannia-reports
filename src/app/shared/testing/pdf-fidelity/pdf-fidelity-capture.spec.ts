import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

import { templatePanelTestingProviders } from '../templates-testing';
import { translateTestingImports } from '../translate-testing';
import { ReportFixture } from './report-fixture';
import { capturePdfDefinition, downloadDefinition } from './render-pdf';

import { SemestrReportComponent } from '../../../semestr-report/semestr-report.component';
import { YearReportComponent } from '../../../year-report/year-report.component';
import { CambridgeReportComponent } from '../../../cambridge-report/cambridge-report.component';
import { TeddyEddieReportComponent } from '../../../teddy-eddie-report/teddy-eddie-report.component';

import { semestrFixtures } from './fixtures/semestr-report.fixture';
import { yearFixtures } from './fixtures/year-report.fixture';
import { cambridgeFixtures } from './fixtures/cambridge-report.fixture';
import { teddyEddieFixtures } from './fixtures/teddy-eddie-report.fixture';

/**
 * Capture harness — NOT part of the default suite.
 *
 * `npm test` excludes this file (see `angular.json` → `architect.test.options.exclude`); it runs only
 * under `npm run test:capture`, which flips to the `capture` configuration and needs a HEADED Chrome
 * because headless discards `saveAs` downloads.
 *
 * Every fixture is downloaded as `<fixture.id>.pdf` rather than the component's own
 * `studentName`-derived filename, so the artifacts are comparable run to run.
 *
 * See `docs/pdf-fidelity-check.md` for the surrounding procedure.
 */

function captureSuite<TComponent>(
  reportName: string,
  componentType: Type<TComponent>,
  fixtures: ReportFixture<TComponent>[],
  generate: (component: TComponent) => void,
): void {
  describe(reportName, () => {
    let component: TComponent;
    let originalTimeout: number;

    beforeEach(async () => {
      // Rendering embeds the Roboto VFS and the base64 banner, which overruns Jasmine's 5s default.
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

      await TestBed.configureTestingModule({
        imports: [componentType, ...translateTestingImports],
        // `SemestrReportComponent` mounts `app-template-panel` as of `S-02`; the
        // other three report types ignore these providers.
        providers: [provideNoopAnimations(), provideNativeDateAdapter(), ...templatePanelTestingProviders()],
      }).compileComponents();

      const testFixture = TestBed.createComponent(componentType);
      component = testFixture.componentInstance;
      testFixture.detectChanges();
    });

    afterEach(() => {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });

    fixtures.forEach((reportFixture) => {
      it(`captures ${reportFixture.id}.pdf — ${reportFixture.label}`, async () => {
        reportFixture.apply(component);

        const definition = capturePdfDefinition(() => generate(component));

        expect(definition).toBeTruthy();

        await downloadDefinition(definition, `${reportFixture.id}.pdf`);
      });
    });
  });
}

describe('PDF fidelity capture', () => {
  afterAll(async () => {
    // `download()` resolves once file-saver hands the blob to the browser, not once Chrome has
    // finished writing it. Without this settle window Karma kills the browser mid-write and the
    // last file is left behind as a `.tmp`.
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  captureSuite('SemestrReportComponent', SemestrReportComponent, semestrFixtures, (component) =>
    component.generatePDF(component.form),
  );

  captureSuite('YearReportComponent', YearReportComponent, yearFixtures, (component) =>
    component.generatePDF(component.form),
  );

  captureSuite('CambridgeReportComponent', CambridgeReportComponent, cambridgeFixtures, (component) =>
    component.generatePDF(component.form),
  );

  captureSuite(
    'TeddyEddieReportComponent',
    TeddyEddieReportComponent,
    teddyEddieFixtures,
    // `downloadPDF` is what the template's button calls (teddy-eddie-report.component.html:38).
    (component) => component.downloadPDF(),
  );
});
