import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormArray, FormGroup } from '@angular/forms';

import { CambridgeReportComponent } from './cambridge-report.component';
import { translateTestingImports } from '../shared/testing/translate-testing';
import { cambridgeFixtures } from '../shared/testing/pdf-fidelity/fixtures/cambridge-report.fixture';
import { capturePdfDefinition, renderToBlob } from '../shared/testing/pdf-fidelity/render-pdf';

describe('CambridgeReportComponent — PDF fidelity smoke', () => {
  let component: CambridgeReportComponent;
  let fixture: ComponentFixture<CambridgeReportComponent>;
  let originalTimeout: number;

  beforeEach(async () => {
    // Each case embeds the Roboto VFS and the base64 logo, which overruns Jasmine's 5s default.
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

    await TestBed.configureTestingModule({
      imports: [CambridgeReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(CambridgeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  cambridgeFixtures.forEach((reportFixture) => {
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
 *
 * This form carries the extra risk: `S-05b` extracts the eleven repeated exam blocks into a child
 * component that reaches the parent form through `ControlContainer`. If the extraction gets a control
 * name wrong, the exam rows quietly stop feeding the PDF while every other check still passes. The
 * exam-row assertion below is what catches that.
 */
describe('CambridgeReportComponent — form model contract', () => {
  const EXAM_ARRAYS = [
    'listeningA1Array',
    'listeningA2B1Array',
    'listeningB2C1Array',
    'readingA2B1Array',
    'readingB2C1Array',
    'speakingA1Array',
    'speakingA2B1Array',
    'speakingB2C1Array',
    'useOfEnglishB2C1Array',
    'writingA2B1Array',
    'writingAndReadingA1Array',
    'writingB2C1Array',
  ];

  const EXPECTED_ARRAYS = ['comments', ...EXAM_ARRAYS, 'recommendations'].sort();

  const EXPECTED_CONTROLS = [
    'avgMark',
    'behaviour',
    'class',
    'course',
    'date',
    'examRecommendation',
    'examRecommendationAcceptCheckbox',
    'examRecommendationCheckbox',
    'examRecommendationInNextTermCheckbox',
    'examRecommendationNonCheckbox',
    'examRecommendationOptions',
    'examRecommendationResult',
    'focus',
    'frequency',
    'homeworks',
    'involvement',
    'lead',
    'learningRecommendations',
    'marks',
    'name',
    'ownEducationMaterial',
    'ownTitleStudentBook',
    'prepareToLecture',
    'pronunciation',
    'realizedMaterial',
    'respect',
    'sex',
    'signature',
    'studentBookTitle',
    'studentName',
    'teachers',
    'typeOfExam',
    'vocabulary',
    ...EXPECTED_ARRAYS,
  ].sort();

  let component: CambridgeReportComponent;
  let fixture: ComponentFixture<CambridgeReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CambridgeReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(CambridgeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes exactly the expected control names', () => {
    expect(Object.keys(component.form.controls).sort()).toEqual(EXPECTED_CONTROLS);
  });

  it('declares exactly the expected FormArrays', () => {
    const actualArrays = Object.keys(component.form.controls)
      .filter((name) => component.form.get(name) instanceof FormArray)
      .sort();

    expect(actualArrays).toEqual(EXPECTED_ARRAYS);
  });

  it('builds exam-term rows with exactly the expected inner control names, in every exam array', () => {
    EXAM_ARRAYS.forEach((arrayName) => {
      component.addNextExamTerm(arrayName);

      const rows = component.form.get(arrayName) as FormArray;

      expect(rows.length).withContext(arrayName).toBe(1);
      expect(Object.keys((rows.at(0) as FormGroup).controls).sort())
        .withContext(arrayName)
        .toEqual(['date', 'result', 'score']);
    });
  });

  it('removes an exam-term row from the array it was told to', () => {
    component.addNextExamTerm('listeningA1Array');
    component.addNextExamTerm('listeningA1Array');
    component.addNextExamTerm('readingA2B1Array');

    component.onRemoveExamTerm(0, 'listeningA1Array');

    expect((component.form.get('listeningA1Array') as FormArray).length).toBe(1);
    expect((component.form.get('readingA2B1Array') as FormArray).length).toBe(1);
  });
});
