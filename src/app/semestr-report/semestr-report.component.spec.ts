import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormArray } from '@angular/forms';

import { SemestrReportComponent } from './semestr-report.component';
import { translateTestingImports } from '../shared/testing/translate-testing';
import { semestrFixtures } from '../shared/testing/pdf-fidelity/fixtures/semestr-report.fixture';
import { capturePdfDefinition, renderToBlob } from '../shared/testing/pdf-fidelity/render-pdf';

describe('SemestrReportComponent — PDF fidelity smoke', () => {
  let component: SemestrReportComponent;
  let fixture: ComponentFixture<SemestrReportComponent>;
  let originalTimeout: number;

  beforeEach(async () => {
    // Each case embeds the Roboto VFS and the base64 logo, which overruns Jasmine's 5s default.
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

    await TestBed.configureTestingModule({
      imports: [SemestrReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(SemestrReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  semestrFixtures.forEach((reportFixture) => {
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
 *
 * That change rewrites all three older report templates but must not move, rename, add, or remove a
 * single control: the PDF-fidelity fixtures reach the builders through `form.patchValue`, so a renamed
 * control would silently stop being filled while the smoke specs above still pass and still produce a
 * PDF. This spec is what makes "the form model did not change" a checked fact rather than a claim.
 *
 * If a later change legitimately adds a control (`S-02` templates, `S-04` student picker), update the
 * expected list in that same change — deliberately, not as a drive-by.
 */
describe('SemestrReportComponent — form model contract', () => {
  const EXPECTED_CONTROLS = [
    'additionalComment',
    'avgMark',
    'behaviour',
    'class',
    'comments',
    'course',
    'date',
    'examRecommendation',
    'examRecommendationAcceptCheckbox',
    'examRecommendationNonCheckbox',
    'examRecommendationOptions',
    'examRecommendationResult',
    'focus',
    'frequency',
    'homeworks',
    'involvement',
    'isExamRecommendation',
    'lead',
    'learningRecommendations',
    'listeningA1Array',
    'listeningA2B1Array',
    'listeningB2C1Array',
    'name',
    'ownEducationMaterial',
    'ownTitleStudentBook',
    'prepareToLecture',
    'pronunciation',
    'readingA2B1Array',
    'readingB2C1Array',
    'realizedMaterial',
    'recommendationToCambridgeExam',
    'recommendations',
    'reportType',
    'respect',
    'sex',
    'signature',
    'speakingA1Array',
    'speakingA2B1Array',
    'speakingB2C1Array',
    'studentBookTitle',
    'studentName',
    'teachers',
    'typeOfExam',
    'useOfEnglishB2C1Array',
    'vocabulary',
    'writingA2B1Array',
    'writingAndReadingA1Array',
    'writingB2C1Array',
  ];

  const EXPECTED_ARRAYS = [
    'comments',
    'listeningA1Array',
    'listeningA2B1Array',
    'listeningB2C1Array',
    'readingA2B1Array',
    'readingB2C1Array',
    'recommendations',
    'speakingA1Array',
    'speakingA2B1Array',
    'speakingB2C1Array',
    'useOfEnglishB2C1Array',
    'writingA2B1Array',
    'writingAndReadingA1Array',
    'writingB2C1Array',
  ];

  let component: SemestrReportComponent;
  let fixture: ComponentFixture<SemestrReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemestrReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter()],
    }).compileComponents();

    fixture = TestBed.createComponent(SemestrReportComponent);
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
});
