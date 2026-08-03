import { Component, input, InputSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { StudentIdentity } from '../../model/student.interface';
import { InputTextComponent } from '../../shared/components/form/input-text/input-text.component';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { Sex } from '../../shared/enum/sex.enum';
import { classes, sexes } from '../../shared/select-values';
import { STUDENT_IDENTITY_DEFAULTS } from '../student-domain';

/** The form's controls, typed so a rename here is a compile error there. */
export interface StudentFormControls {
  studentName: FormControl<string>;
  name: FormControl<string>;
  sex: FormControl<Sex | null>;
  class: FormControl<string | null>;
}

/**
 * A blank student form.
 *
 * The group is built here rather than in each host so the roster and the
 * picker's quick-add cannot end up with differently-typed copies of the same
 * four controls. The control names are `STUDENT_IDENTITY_DOMAIN`'s, which is
 * what lets `readStudentForm` read the group straight into a `StudentIdentity`.
 */
export const createStudentForm = (): FormGroup<StudentFormControls> =>
  new FormGroup<StudentFormControls>({
    studentName: new FormControl<string>('', { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true }),
    sex: new FormControl<Sex | null>(null),
    class: new FormControl<string | null>(null),
  });

/**
 * The form's values as the service wants them.
 *
 * Blank optional text becomes `null` in the service, not here — one place
 * decides what an emptied field means.
 */
export const readStudentForm = (form: FormGroup<StudentFormControls>): StudentIdentity => ({
  ...STUDENT_IDENTITY_DEFAULTS,
  ...form.getRawValue(),
});

/** Back to blank. `reset()` alone would set the non-nullable controls to `null`. */
export const resetStudentForm = (form: FormGroup<StudentFormControls>): void => {
  form.reset({ studentName: '', name: '', sex: null, class: null });
};

/**
 * The four identity fields, their labels, and the inline rejection message.
 *
 * Extracted from `StudentRosterComponent` by `S-04` so the picker's quick-add
 * mounts the same definition rather than a copy of it: two surfaces asking for a
 * student are one place where a drifting label or a missing `required` marker
 * would be invisible until a teacher met the other one.
 *
 * Deliberately owns nothing but the fields. The buttons, the service calls, the
 * submit flow and the add/edit distinction all stay with the host — the roster
 * edits, the picker only ever adds, and folding that difference in here would
 * make this component know which surface it is on.
 */
@Component({
  selector: 'app-student-form',
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, InputTextComponent, SelectComponent],
})
export class StudentFormComponent {
  /** Owned by the host, so it can read, patch and reset it around its own flow. */
  public readonly form: InputSignal<FormGroup<StudentFormControls>> = input.required<FormGroup<StudentFormControls>>();

  /** Why the form was refused, as a translate key. `null` renders nothing. */
  public readonly failureKey: InputSignal<string | null> = input<string | null>(null);

  protected readonly sexes: string[] = sexes;
  protected readonly classes: { label: string; value: string }[] = classes;
}
