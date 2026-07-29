import { Component, inject, input, output } from '@angular/core';
import { ControlContainer, FormArray, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { ButtonComponent } from '../../shared/components/button/button.component';
import { DateComponent } from '../../shared/components/form/date/date.component';
import { InputTextComponent } from '../../shared/components/form/input-text/input-text.component';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { resultOfExam } from '../../shared/exams';

/**
 * One skill section of the Cambridge exam-results block: a heading, an "Add test" button, and the
 * rows of the `FormArray` named by `arrayName`.
 *
 * The array lives on the parent form, not here — `viewProviders` re-exposes the parent
 * `FormGroupDirective` as this view's `ControlContainer`, so `formArrayName` / `formGroupName`
 * resolve against the parent `FormGroup` exactly as they did when this markup was inline.
 * Add and remove are outputs rather than local mutations because the parent's `addNextExamTerm` /
 * `onRemoveExamTerm` are what the PDF-fidelity fixtures call.
 */
@Component({
  selector: 'app-exam-term-rows',
  templateUrl: './exam-term-rows.component.html',
  styleUrl: './exam-term-rows.component.scss',
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    ButtonComponent,
    DateComponent,
    InputTextComponent,
    SelectComponent,
  ],
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
})
export class ExamTermRowsComponent {
  arrayName = input.required<string>();
  heading = input<string>('');

  addTerm = output<void>();
  removeTerm = output<number>();

  public readonly resultOfExam: string[] = resultOfExam;

  private readonly parentContainer = inject(ControlContainer);

  get rows(): FormArray {
    return this.parentContainer.control?.get(this.arrayName()) as FormArray;
  }
}
