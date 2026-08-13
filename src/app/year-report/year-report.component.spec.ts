import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormArray, FormGroup } from '@angular/forms';

import { YearReportComponent } from './year-report.component';
import { translateTestingImports } from '../shared/testing/translate-testing';
import { yearFixtures } from '../shared/testing/pdf-fidelity/fixtures/year-report.fixture';
import { yearEdgeFixtures } from '../shared/testing/pdf-fidelity/fixtures/edge/year-report.edge.fixture';
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

/**
 * Risk #1 of `context/foundation/test-plan.md`: a teacher fills a report, clicks download, and no PDF
 * appears because the builder throws on input they could legitimately enter.
 *
 * The assertion has to RENDER, not just capture. `capturePdfDefinition` alone would pass over any
 * failure that happens inside pdfmake's own measurement pass — the document definition builds fine
 * there and only `renderToBlob` reaches the throw.
 */
describe('YearReportComponent — reachable edge states', () => {
  let component: YearReportComponent;
  let fixture: ComponentFixture<YearReportComponent>;
  let originalTimeout: number;

  beforeEach(async () => {
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

  yearEdgeFixtures.forEach((reportFixture) => {
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

/**
 * The form model is frozen for the duration of the `report-design-refresh` change (roadmap `S-05b`).
 * See the matching block in `semestr-report.component.spec.ts` for why this exists.
 */
describe('YearReportComponent — form model contract', () => {
  const EXPECTED_CONTROLS = [
    'additionalComment',
    'allMaterialCompleted',
    'certificationPurposeOnThisYear',
    'certificationPurposeOnThisYearDelete',
    'class',
    'comments',
    'course',
    'date',
    'developmentLanguageSkillsArray',
    'eofEvaluation',
    'eofEvaluationDelete',
    'examRecommendationInTable',
    'examRecommendationInTableDelete',
    'frequency',
    'frequencyDelete',
    'halfMaterialCompleted',
    'name',
    'ownEducationMaterial',
    'ownTitleStudentBook',
    'parentDecision',
    'parentDecisionDelete',
    'readinessToContinueOnNextLevel',
    'readinessToContinueOnNextLevelDelete',
    'realizedMaterial',
    'recommendationInNextYear',
    'recommendationInNextYearInTableDelete',
    'sex',
    'signature',
    'studentBookTitle',
    'studentName',
    'teachers',
  ];

  const EXPECTED_ARRAYS = ['comments', 'developmentLanguageSkillsArray'];

  let component: YearReportComponent;
  let fixture: ComponentFixture<YearReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YearReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(YearReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes exactly the expected control names', () => {
    expect(Object.keys(component.form.controls).sort()).toEqual(EXPECTED_CONTROLS);
  });

  it('keeps every expected control a FormArray', () => {
    EXPECTED_ARRAYS.forEach((name) => {
      expect(component.form.get(name)).toBeInstanceOf(FormArray);
    });
  });

  it('declares no FormArray beyond the expected ones', () => {
    const actualArrays = Object.keys(component.form.controls)
      .filter((name) => component.form.get(name) instanceof FormArray)
      .sort();

    expect(actualArrays).toEqual(EXPECTED_ARRAYS);
  });

  // The development-path rows are the one nested group this form's template binds by name
  // (`formArrayName` + `[formGroupName]="i"`), so their control names are part of the frozen surface.
  it('builds development-path rows with exactly the expected inner control names', () => {
    component.setClasses(component.classes[6].value);

    const rows = component.form.get('developmentLanguageSkillsArray') as FormArray;

    expect(rows.length).toBeGreaterThan(0);
    expect(Object.keys((rows.at(0) as FormGroup).controls).sort()).toEqual([
      'certificationPurpose',
      'classInSchool',
      'courseLevel',
      'schoolExam',
      'schoolYear',
      'shouldDeleteRow',
    ]);
  });
});
