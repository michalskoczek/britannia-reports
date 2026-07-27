import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

import { YearReportComponent } from './year-report.component';
import { translateTestingImports } from '../shared/testing/translate-testing';
import { yearFixtures } from '../shared/testing/pdf-fidelity/fixtures/year-report.fixture';
import { capturePdfDefinition, renderToBlob } from '../shared/testing/pdf-fidelity/render-pdf';

describe('YearReportComponent — PDF fidelity smoke', () => {
  let component: YearReportComponent;
  let fixture: ComponentFixture<YearReportComponent>;
  let originalTimeout: number;

  beforeEach(async () => {
    // Each case embeds the Roboto VFS and the base64 banner, which overruns Jasmine's 5s default.
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

    await TestBed.configureTestingModule({
      imports: [YearReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(YearReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  yearFixtures.forEach((reportFixture) => {
    it(`produces a renderable PDF for "${reportFixture.id}"`, async () => {
      reportFixture.apply(component);

      const definition = capturePdfDefinition(() => component.generatePDF(component.form));

      expect(definition).toBeTruthy();

      const blob = await renderToBlob(definition);

      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toBe('application/pdf');
      expect(await blob.slice(0, 4).text()).toBe('%PDF');
    });
  });
});
