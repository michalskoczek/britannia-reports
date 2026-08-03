import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormArray } from '@angular/forms';

import { SemestrReportComponent } from './semestr-report.component';
import { translateTestingImports } from '../shared/testing/translate-testing';
import { semestrReportTestingProviders } from '../shared/testing/semestr-report-testing';
import { semestrFixtures } from '../shared/testing/pdf-fidelity/fixtures/semestr-report.fixture';
import { capturePdfDefinition, renderToBlob } from '../shared/testing/pdf-fidelity/render-pdf';
import { ReportTemplateFields } from '../model/report-template.interface';
import { StudentIdentity } from '../model/student.interface';
import {
  PER_STUDENT_FIELDS,
  STUDENT_IDENTITY_FIELDS,
  TEMPLATE_DOMAIN,
  TEMPLATE_DOMAIN_DEFAULTS,
  UNREACHABLE_FIELDS,
} from '../templates/template-domain';
import { STUDENT_IDENTITY_DEFAULTS } from '../students/student-domain';
import { ReportType } from '../shared/enum/report-type.enum';
import { Sex } from '../shared/enum/sex.enum';
import {
  behaviourMarks,
  frequencyMarks,
  homeworksMarks,
  involvementMarks,
  Marks,
  prepareToLectureMarks,
  pronunciationMarks,
  vocabularyMarks,
} from '../shared/marks';

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
      providers: [provideNoopAnimations(), provideNativeDateAdapter(), ...semestrReportTestingProviders()],
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
 * The form model is frozen, and the freeze has now survived two changes.
 *
 * It was written for `report-design-refresh` (roadmap `S-05b`), which rewrote all three older report
 * templates without moving, renaming, adding, or removing a single control: the PDF-fidelity fixtures
 * reach the builders through `form.patchValue`, so a renamed control would silently stop being filled
 * while the smoke specs above still pass and still produce a PDF. `S-02` (report templates) then went
 * through it untouched as well — the templates surface is its own component with its own form, and the
 * report exchanges a ten-key payload with it rather than sharing controls.
 *
 * The partition block below is the second half of the guarantee, and it is what `S-04` (student
 * picker) is built on. Every one of the 48 controls belongs to exactly one of four sets: the ten a
 * template owns, the four that identify the student, the twelve that assess them, and the twenty-two
 * no widget can reach. Adding a control, or moving one across that boundary, now fails a test here —
 * instead of quietly letting a template carry one child's grade onto another child's report.
 *
 * If a later change legitimately adds a control, update the expected list *and* the partition in that
 * same change — deliberately, not as a drive-by.
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
      providers: [provideNoopAnimations(), provideNativeDateAdapter(), ...semestrReportTestingProviders()],
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

  describe('the template field-domain partition', () => {
    const SETS: Record<string, readonly string[]> = {
      TEMPLATE_DOMAIN,
      STUDENT_IDENTITY_FIELDS,
      PER_STUDENT_FIELDS,
      UNREACHABLE_FIELDS,
    };

    it('sizes each set as declared — 10 + 4 + 12 + 22 = 48', () => {
      expect(TEMPLATE_DOMAIN.length).toBe(10);
      expect(STUDENT_IDENTITY_FIELDS.length).toBe(4);
      expect(PER_STUDENT_FIELDS.length).toBe(12);
      expect(UNREACHABLE_FIELDS.length).toBe(22);
    });

    it('keeps the four sets pairwise disjoint', () => {
      const names = Object.keys(SETS);

      names.forEach((left, index) => {
        names.slice(index + 1).forEach((right) => {
          const shared = SETS[left].filter((field) => SETS[right].includes(field));

          expect(shared)
            .withContext(`${left} and ${right} both claim: ${shared.join(', ')}`)
            .toEqual([]);
        });
      });
    });

    it('covers every control of the form exactly once', () => {
      const partition = Object.values(SETS).flat().sort();

      // Sorted-array equality catches a duplicate *within* one set too, which a
      // Set-based comparison would silently absorb.
      expect(partition).toEqual(Object.keys(component.form.controls).sort());
    });

    it('declares defaults that match the ones the form is built with', () => {
      // A drifted default would make "is this template empty" and "would applying
      // this clear something" both wrong, in the same direction, silently.
      TEMPLATE_DOMAIN.forEach((field) => {
        expect(component.form.get(field)!.value)
          .withContext(`default for ${field}`)
          .toEqual(TEMPLATE_DOMAIN_DEFAULTS[field]);
      });
    });
  });
});

/**
 * The two methods that translate between the report's 48 controls and the ten-key payload
 * `app-template-panel` exchanges with it.
 *
 * The panel is covered by its own spec; what is checked here is the half that only the report can get
 * wrong — reading exactly the domain and nothing else, writing it back without disturbing the other
 * 38 controls, and keeping the two visibility booleans in agreement with what was written. The last
 * one is the load-bearing case: `studentBookTitle` and `ownTitleStudentBook` live in `form` but render
 * behind booleans that do not, so a value applied behind a hidden field still reaches the PDF.
 */
describe('SemestrReportComponent — template collect and apply', () => {
  let component: SemestrReportComponent;
  let fixture: ComponentFixture<SemestrReportComponent>;

  const fields = (overrides: Partial<ReportTemplateFields> = {}): ReportTemplateFields => ({
    ...TEMPLATE_DOMAIN_DEFAULTS,
    ...overrides,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemestrReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter(), ...semestrReportTestingProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(SemestrReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('collect', () => {
    it('reads the domain and reports the form`s own defaults as an empty template', () => {
      expect(component.collectTemplateFields()).toEqual(fields());
    });

    it('reads only the domain, whatever else the teacher filled in', () => {
      component.form.patchValue({
        course: 'A2',
        realizedMaterial: 'Units 1-8',
        studentName: 'Jan Kowalski',
        sex: 'chłopiec',
        pronunciation: 'X mówi wyraźnie',
        avgMark: '5',
      });

      expect(component.collectTemplateFields()).toEqual(fields({ course: 'A2', realizedMaterial: 'Units 1-8' }));
    });

    it('stores the date as a calendar date rather than the adapter`s own type', () => {
      component.form.patchValue({ date: new Date(2026, 5, 12) });

      expect(component.collectTemplateFields().date).toBe('2026-06-12');
    });

    it('stores the own-materials selection, which leaves the control undefined', () => {
      // The third radio binds no `value`, so the group writes `undefined` over the
      // `true` the handler sets. Firestore rejects `undefined`.
      component.onCheckboxChangeOwnMaterialEducation();
      component.form.get('ownEducationMaterial')!.setValue(undefined);

      expect(component.collectTemplateFields().ownEducationMaterial).toBe(true);
    });
  });

  describe('apply', () => {
    it('writes every domain control, including the ones the template leaves empty', () => {
      component.form.patchValue({ course: 'B1', signature: 'stara stopka' });

      component.applyTemplateFields(fields({ reportType: ReportType.SEMESTER, course: 'A2', teachers: ['Anna'] }));

      expect(component.collectTemplateFields()).toEqual(
        fields({ reportType: ReportType.SEMESTER, course: 'A2', teachers: ['Anna'] })
      );
      expect(component.form.get('signature')!.value).toBeNull();
    });

    it('leaves student identity and every assessment field exactly as they were', () => {
      const untouched = {
        studentName: 'Jan Kowalski',
        name: 'Jan',
        sex: 'chłopiec',
        class: '5',
        pronunciation: 'X mówi wyraźnie',
        avgMark: '5',
        frequency: '95%',
        additionalComment: 'Bardzo dobra praca',
      };

      component.form.patchValue(untouched);

      component.applyTemplateFields(fields({ course: 'A2', realizedMaterial: 'Units 1-8' }));

      Object.entries(untouched).forEach(([control, value]) => {
        expect(component.form.get(control)!.value).withContext(control).toBe(value);
      });
    });

    it('shows the book select when the template carries a book from the list', () => {
      component.applyTemplateFields(fields({ ownEducationMaterial: '1', studentBookTitle: 'Brainy 5' }));
      fixture.detectChanges();

      expect(component.isCheckedBook).toBeTrue();
      expect(component.isCheckedOwnTitle).toBeFalse();
      expect(fixture.nativeElement.querySelector('app-select[formControlName="studentBookTitle"]')).not.toBeNull();
    });

    it('shows the own-title input when the template carries one', () => {
      component.applyTemplateFields(fields({ ownEducationMaterial: '2', ownTitleStudentBook: 'Nasze materiały' }));
      fixture.detectChanges();

      expect(component.isCheckedOwnTitle).toBeTrue();
      expect(component.isCheckedBook).toBeFalse();
      expect(fixture.nativeElement.querySelector('app-input-text[formControlName="ownTitleStudentBook"]')).not.toBeNull();
    });

    it('hides both title fields for an own-materials template and re-checks its radio', () => {
      component.applyTemplateFields(fields({ ownEducationMaterial: '1', studentBookTitle: 'Brainy 5' }));
      component.applyTemplateFields(fields({ ownEducationMaterial: true }));
      fixture.detectChanges();

      expect(component.isCheckedBook).toBeFalse();
      expect(component.isCheckedOwnTitle).toBeFalse();
      expect(component.form.get('studentBookTitle')!.value).toBeNull();
      // `undefined` is what the own-materials radio compares its own absent
      // `value` against — anything else leaves all three radios blank.
      expect(component.form.get('ownEducationMaterial')!.value).toBeUndefined();
    });

    it('never leaves a book title behind a hidden field, even if the radio disagrees', () => {
      // Unreachable through the UI, but a stored document can say it. Showing a
      // field nobody asked for is recoverable; printing a value nobody could see
      // is not.
      component.applyTemplateFields(fields({ ownEducationMaterial: false, studentBookTitle: 'Brainy 5' }));

      expect(component.isCheckedBook).toBeTrue();
    });

    it('round-trips a date through the form boundary and into the PDF`s reading of it', () => {
      component.applyTemplateFields(fields({ date: '2026-06-12' }));

      const value = component.form.get('date')!.value;

      expect(component.collectTemplateFields().date).toBe('2026-06-12');
      // `generatePDF` renders `new Date(form.value.date).toLocaleDateString('pl-PL')`.
      expect(new Date(value).toLocaleDateString('pl-PL')).toBe('12.06.2026');
    });

    it('keeps `isChecked` alone — it gates a per-student field', () => {
      component.onCheckboxChange();

      component.applyTemplateFields(fields({ isExamRecommendation: true }));

      expect(component.isChecked).toBeTrue();
    });
  });
});

/**
 * The other half of the partition: the two methods `app-student-picker` exchanges
 * a `StudentIdentity` with (FR-013).
 *
 * The panel is covered by its own spec. What is checked here is the half only the
 * report can get wrong — that a pick lands in exactly the four identity controls
 * and nowhere else. That disjointness is not a nicety: the twelve
 * `PER_STUDENT_FIELDS` are the marks, and a picker that could reach one of them
 * would put a judgement about one child onto another child's report.
 */
describe('SemestrReportComponent — student identity collect and apply', () => {
  let component: SemestrReportComponent;
  let fixture: ComponentFixture<SemestrReportComponent>;

  const jan: StudentIdentity = {
    studentName: 'Jan Kowalski',
    name: 'Jaś',
    sex: Sex.MALE,
    class: 'Klasa 5 szkoły podstawowej',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemestrReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter(), ...semestrReportTestingProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(SemestrReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('collect', () => {
    it('reads a blank form as the roster`s own defaults', () => {
      // `studentName` is the coerced one: its control starts at `null` while
      // `StudentIdentity` types it as `string`. Without that coercion a blank form
      // would report the name as a field a pick is about to overwrite.
      expect(component.collectStudentIdentity()).toEqual(STUDENT_IDENTITY_DEFAULTS);
    });

    it('reads only the identity fields, whatever else the teacher filled in', () => {
      component.form.patchValue({
        ...jan,
        course: 'A2',
        pronunciation: 'X mówi wyraźnie',
        avgMark: '5',
      });

      expect(component.collectStudentIdentity()).toEqual(jan);
    });
  });

  describe('apply', () => {
    it('writes exactly the four identity controls and no others', () => {
      const before: Record<string, unknown> = {};

      [...TEMPLATE_DOMAIN, ...PER_STUDENT_FIELDS].forEach((field: string) => {
        before[field] = component.form.get(field)!.value;
      });

      component.applyStudentIdentity(jan);

      STUDENT_IDENTITY_FIELDS.forEach((field: string) => {
        expect(component.form.get(field)!.value)
          .withContext(field)
          .toBe(jan[field as keyof StudentIdentity]);
      });

      Object.entries(before).forEach(([field, value]: [string, unknown]) => {
        expect(component.form.get(field)!.value).withContext(field).toEqual(value);
      });
    });

    it('leaves a filled template and every assessment field exactly as they were', () => {
      const untouched = {
        course: 'A2',
        realizedMaterial: 'Units 1-8',
        signature: 'Anna Kowalska',
        pronunciation: 'X mówi wyraźnie',
        vocabulary: 'X zna wiele słów',
        avgMark: '5',
        frequency: '95%',
        additionalComment: 'Bardzo dobra praca',
      };

      component.form.patchValue(untouched);

      component.applyStudentIdentity(jan);

      Object.entries(untouched).forEach(([control, value]: [string, string]) => {
        expect(component.form.get(control)!.value).withContext(control).toBe(value);
      });
    });

    it('clears an identity field the picked student does not carry', () => {
      component.form.patchValue({ ...jan });

      component.applyStudentIdentity({ studentName: 'Zofia Nowak', name: null, sex: Sex.FEMALE, class: null });

      expect(component.form.get('name')!.value).toBeNull();
      expect(component.form.get('class')!.value).toBeNull();
    });
  });

  describe('the signal the panel reads', () => {
    it('follows the form rather than being rebuilt per change-detection pass', () => {
      const before: StudentIdentity = component.studentIdentity();

      component.form.patchValue({ studentName: 'Jan Kowalski' });
      fixture.detectChanges();

      // A fresh object every pass would leave the panel's signal input
      // permanently dirty — the trap `templateFields` already documents.
      expect(component.studentIdentity()).not.toBe(before);
      expect(component.studentIdentity().studentName).toBe('Jan Kowalski');

      fixture.detectChanges();

      expect(component.studentIdentity()).toBe(component.studentIdentity());
    });
  });
});

/**
 * The remap that keeps the six descriptive-mark selects in the same gender as the form.
 *
 * `markOptions` builds each of those option lists from `mark.value` or `mark.valueFemale` depending on
 * `sex`, so a control holding the other variant matches no option: the select renders blank, `required`
 * still passes because the control does hold a value, and the wrong-gender sentence reaches the PDF.
 * The hook is keyed on `sex` rather than on the picker, which is why the first case here changes the
 * control by hand — a manual change has to behave exactly like a pick.
 */
describe('SemestrReportComponent — the sex-driven mark remap', () => {
  let component: SemestrReportComponent;
  let fixture: ComponentFixture<SemestrReportComponent>;

  /**
   * One entry of each of the six sex-aware lists, in both wordings.
   *
   * The indices are picked so that three of the six — `vocabulary`, `involvement`
   * and `behaviour` — genuinely differ between the variants. The other three
   * carry the same sentence on both sides, because their wording contains no
   * gendered word; those assertions hold by construction, which is itself worth
   * pinning down.
   */
  const maleMarks = {
    pronunciation: pronunciationMarks[1].value,
    vocabulary: vocabularyMarks[0].value,
    prepareToLecture: prepareToLectureMarks[1].value,
    homeworks: homeworksMarks[1].value,
    involvement: involvementMarks[1].value,
    behaviour: behaviourMarks[1].value,
  };

  const femaleMarks = {
    pronunciation: pronunciationMarks[1].valueFemale,
    vocabulary: vocabularyMarks[0].valueFemale,
    prepareToLecture: prepareToLectureMarks[1].valueFemale,
    homeworks: homeworksMarks[1].valueFemale,
    involvement: involvementMarks[1].valueFemale,
    behaviour: behaviourMarks[1].valueFemale,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemestrReportComponent, ...translateTestingImports],
      providers: [provideNoopAnimations(), provideNativeDateAdapter(), ...semestrReportTestingProviders()],
    }).compileComponents();

    fixture = TestBed.createComponent(SemestrReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rewrites all six marks into the female wording when the sex select is changed by hand', () => {
    component.form.patchValue({ sex: Sex.MALE, ...maleMarks });

    component.form.get('sex')!.setValue(Sex.FEMALE);

    Object.entries(femaleMarks).forEach(([control, value]: [string, string | undefined]) => {
      expect(component.form.get(control)!.value).withContext(control).toBe(value as string);
    });
  });

  it('rewrites them back when the sex flips the other way', () => {
    component.form.patchValue({ sex: Sex.FEMALE, ...femaleMarks });

    component.form.get('sex')!.setValue(Sex.MALE);

    Object.entries(maleMarks).forEach(([control, value]: [string, string]) => {
      expect(component.form.get(control)!.value).withContext(control).toBe(value);
    });
  });

  it('leaves every option-bearing mark matching one of its select`s options', () => {
    // The failure this whole phase exists to prevent: a value from the other
    // variant matches no option, so the select renders blank while `required`
    // still passes.
    component.form.patchValue({ sex: Sex.MALE, ...maleMarks });

    component.form.get('sex')!.setValue(Sex.FEMALE);

    const lists: Record<string, Marks[]> = {
      pronunciation: pronunciationMarks,
      vocabulary: vocabularyMarks,
      prepareToLecture: prepareToLectureMarks,
      homeworks: homeworksMarks,
      involvement: involvementMarks,
      behaviour: behaviourMarks,
    };

    Object.entries(lists).forEach(([control, list]: [string, Marks[]]) => {
      const options: string[] = list.map((mark) => mark.valueFemale as string);

      expect(options).withContext(control).toContain(component.form.get(control)!.value);
    });
  });

  it('leaves `frequency` and `avgMark` alone — their lists carry no female variant', () => {
    component.form.patchValue({ sex: Sex.MALE, ...maleMarks, frequency: frequencyMarks[0].value, avgMark: '5' });

    component.form.get('sex')!.setValue(Sex.FEMALE);

    expect(component.form.get('frequency')!.value).toBe(frequencyMarks[0].value);
    expect(component.form.get('avgMark')!.value).toBe('5');
  });

  it('touches nothing outside the six marks', () => {
    const untouched = {
      studentName: 'Jan Kowalski',
      name: 'Jaś',
      class: 'Klasa 5 szkoły podstawowej',
      course: 'A2',
      realizedMaterial: 'Units 1-8',
      signature: 'Anna Kowalska',
      additionalComment: 'Bardzo dobra praca',
    };

    component.form.patchValue({ sex: Sex.MALE, ...maleMarks, ...untouched });

    component.form.get('sex')!.setValue(Sex.FEMALE);

    Object.entries(untouched).forEach(([control, value]: [string, string]) => {
      expect(component.form.get(control)!.value).withContext(control).toBe(value);
    });
  });

  it('does nothing when the sex changes to a value on the same side of the predicate', () => {
    // `markOptions` reads `=== Sex.MALE`, so anything that is not male is female
    // as far as the option lists are concerned. Clearing the select must not
    // rewrite marks that are already in the right wording.
    component.form.patchValue({ sex: Sex.FEMALE, ...femaleMarks });

    component.form.get('sex')!.setValue(null);

    Object.entries(femaleMarks).forEach(([control, value]: [string, string | undefined]) => {
      expect(component.form.get(control)!.value).withContext(control).toBe(value as string);
    });
  });

  it('runs on a pick, before the picker has finished writing the identity', () => {
    component.form.patchValue({ sex: Sex.MALE, ...maleMarks });

    component.applyStudentIdentity({
      studentName: 'Zofia Nowak',
      name: 'Zosia',
      sex: Sex.FEMALE,
      class: 'Klasa 5 szkoły podstawowej',
    });

    // `class` is written after `sex` in `STUDENT_IDENTITY_FIELDS` order, so this
    // asserts the remap re-entered mid-patch and the outer patch still finished.
    expect(component.form.get('class')!.value).toBe('Klasa 5 szkoły podstawowej');
    Object.entries(femaleMarks).forEach(([control, value]: [string, string | undefined]) => {
      expect(component.form.get(control)!.value).withContext(control).toBe(value as string);
    });
  });

  it('leaves a sentence from no list alone rather than blanking a required select', () => {
    component.form.patchValue({ sex: Sex.MALE, pronunciation: 'X zdanie z poprzedniej wersji listy' });

    component.form.get('sex')!.setValue(Sex.FEMALE);

    expect(component.form.get('pronunciation')!.value).toBe('X zdanie z poprzedniej wersji listy');
  });
});
