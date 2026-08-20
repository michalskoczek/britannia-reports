import { AbstractControl, FormArray, FormGroup } from '@angular/forms';

import { TeddyEddieReportComponent } from '../../../../../teddy-eddie-report/teddy-eddie-report.component';
import { ageTE } from '../../../../development-path';
import { ReportFixture } from '../../report-fixture';
import { LONG_FREE_TEXT, NON_ASCII_STUDENT_NAME } from './hostile-text';

/**
 * Reachable-but-hostile states for the Teddy Eddie development-path report.
 *
 * Kept out of `teddy-eddie-report.fixture.ts` for the same reason as the year-end edge module: that
 * array feeds the capture harness behind `docs/pdf-fidelity-check.md`, where each `id` becomes a
 * reference-PDF filename a human compares by eye. Edge states prove a document is produced at all,
 * so they would only grow that procedure with documents nobody reviews.
 *
 * **Why an untouched form is the floor here, and only here.** This report declares zero validators
 * and its download control is `<app-button (clicked)="downloadPDF()">`
 * (`teddy-eddie-report.component.html:38`) — not a submit button inside a form, and carrying no
 * `[disabled]` binding. So there is no gate at all: opening the tab and clicking download is
 * genuinely reachable. Cambridge and trimester/semester both gate on `form.invalid`, which is why
 * their edge modules start from their validator floor instead. Do not "simplify" those to match
 * this one.
 */
export const teddyEddieEdgeFixtures: ReportFixture<TeddyEddieReportComponent>[] = [
  {
    id: 'teddy-eddie-untouched',
    label: 'Teddy Eddie report downloaded from a form the teacher never typed into — the floor, because this form has no validators and no submit gate',
    apply(): void {
      // Intentionally empty. Opening the Teddy Eddie tab and clicking download is the whole state.
    },
  },
  {
    id: 'teddy-eddie-age-picked-rows-blank',
    label: 'Teddy Eddie report with an age picked but every generated row left blank — both tables exist and carry no cell values',
    apply(component: TeddyEddieReportComponent): void {
      // `setTableTE` is the handler the age select is wired to
      // (`teddy-eddie-report.component.html:5`); the youngest age produces the longest table, so
      // this is the widest version of the state. Nothing is filled in afterwards: picking an age
      // and scrolling straight past both tables to the download button is one click away from the
      // untouched form above.
      component.form.patchValue({ age: ageTE[0].value });
      component.setTableTE(ageTE[0].value);
    },
  },
  {
    id: 'teddy-eddie-all-rows-deleted',
    label: 'Teddy Eddie report with every row of both tables suppressed — the state that broke the year-end report, checked here against tables that do force a header',
    apply(component: TeddyEddieReportComponent): void {
      component.form.patchValue({ age: ageTE[0].value });
      component.setTableTE(ageTE[0].value);

      // Ticking every "usuń" checkbox is what emptied the year-end detail table and threw inside
      // pdfmake's measurement pass (Phase 2). Both tables here push an unconditional header row
      // (`teddy-eddie-report.component.ts:419,350`) and set `headerRows: 1`, so their bodies cannot
      // reach length zero — this fixture is what holds that difference in place rather than leaving
      // it as a reading of the code.
      [component.teddyEddieArray, component.developmentLanguageSkillsArray].forEach((array: FormArray) => {
        array.controls.forEach((row: AbstractControl) => (row as FormGroup).patchValue({ shouldDeleteRow: true }));
      });
    },
  },
  {
    id: 'teddy-eddie-long-free-text',
    label:
      'Teddy Eddie report with long free text in the one control that accepts it — the name — asserting only that a PDF is produced, see `hostile-text.ts` for why nothing stronger is claimed',
    apply(component: TeddyEddieReportComponent): void {
      // `studentName` is this report's ENTIRE free-text surface, and that is worth stating because
      // it is not obvious from the builder. Two things narrow it that far:
      //
      // - The builder reads `additionalComment` and `realizedMaterial`
      //   (`teddy-eddie-report.component.ts:185,199`), but no template binds either — the form is
      //   `studentName`, `age`, `date` (`teddy-eddie-form.component.html`) plus the two tables.
      //   Setting them would record a state no teacher can produce.
      // - The four `<input matInput>` cells in those tables (`schoolYear`, `studentsAge`,
      //   `classInSchool`, `schoolExam`) are all constructed `disabled` and auto-populated
      //   (`:96-111,128-135`), so they are read-outs, not entry points — and `patchValue` skips
      //   disabled controls anyway, so a fixture aiming at them would silently do nothing.
      //
      // Nothing caps the name's length, so a paste into it is where this report's long-text class
      // actually lives. `age` is picked so both tables exist and the text has a full document
      // around it rather than an empty one.
      component.form.patchValue({ age: ageTE[0].value, studentName: LONG_FREE_TEXT });
      component.setTableTE(ageTE[0].value);
    },
  },
  {
    id: 'teddy-eddie-non-ascii-name',
    label:
      'Teddy Eddie report for a student whose name carries Polish diacritics — asserts only that a PDF is produced, not that any glyph rendered',
    apply(component: TeddyEddieReportComponent): void {
      // The builder reads `form.value.name` nowhere in this report, so `studentName` is the whole
      // name surface.
      component.form.patchValue({ studentName: NON_ASCII_STUDENT_NAME });
    },
  },
];
