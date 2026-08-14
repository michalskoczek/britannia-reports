import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

import { TeddyEddieReportComponent } from './teddy-eddie-report.component';
import { translateTestingImports } from '../shared/testing/translate-testing';
import { teddyEddieFixtures } from '../shared/testing/pdf-fidelity/fixtures/teddy-eddie-report.fixture';
import { teddyEddieEdgeFixtures } from '../shared/testing/pdf-fidelity/fixtures/edge/teddy-eddie-report.edge.fixture';
import { capturePdfDefinition, renderToBlob } from '../shared/testing/pdf-fidelity/render-pdf';

describe('TeddyEddieReportComponent — PDF fidelity smoke', () => {
  let component: TeddyEddieReportComponent;
  let fixture: ComponentFixture<TeddyEddieReportComponent>;
  let originalTimeout: number;

  beforeEach(async () => {
    // Each case embeds the Roboto VFS and the base64 banner, which overruns Jasmine's 5s default.
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

    await TestBed.configureTestingModule({
      imports: [TeddyEddieReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(TeddyEddieReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  teddyEddieFixtures.forEach((reportFixture) => {
    it(`produces a renderable PDF for "${reportFixture.id}"`, async () => {
      reportFixture.apply(component);

      // `downloadPDF` is what the template's button calls (teddy-eddie-report.component.html:38).
      const definition = capturePdfDefinition(() => component.downloadPDF());

      expect(definition).toBeTruthy();

      const blob = await renderToBlob(definition);

      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/pdf');
      expect(await blob.slice(0, 4).text()).toBe('%PDF');
    });
  });
});

/**
 * Risk #1 of `context/foundation/test-plan.md`: a teacher fills a report, clicks download, and no PDF
 * appears because the builder throws on input they could legitimately enter.
 *
 * The assertion has to RENDER, not just capture. `capturePdfDefinition` alone would pass over any
 * failure that happens inside pdfmake's own measurement pass — the year-end report's empty detail
 * table built a perfectly valid-looking definition and only `renderToBlob` reached the throw.
 *
 * This is the one report where an untouched form is a legitimate case: it declares no validators and
 * its download control carries no gate. See `teddy-eddie-report.edge.fixture.ts` for why the other
 * two non-year-end reports start from their validator floor instead.
 */
describe('TeddyEddieReportComponent — reachable edge states', () => {
  let component: TeddyEddieReportComponent;
  let fixture: ComponentFixture<TeddyEddieReportComponent>;
  let originalTimeout: number;

  beforeEach(async () => {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

    await TestBed.configureTestingModule({
      imports: [TeddyEddieReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(TeddyEddieReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  teddyEddieEdgeFixtures.forEach((reportFixture) => {
    it(`produces a renderable PDF for "${reportFixture.id}"`, async () => {
      reportFixture.apply(component);

      const definition = capturePdfDefinition(() => component.downloadPDF());

      expect(definition).toBeTruthy();

      const blob = await renderToBlob(definition);

      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/pdf');
      expect(await blob.slice(0, 4).text()).toBe('%PDF');
    });
  });
});
