import { Component, ElementRef, inject, OnInit, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Student, StudentIdentity } from '../../model/student.interface';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormWrapperComponent } from '../../shared/components/form/form-wrapper/form-wrapper.component';
import { InputTextComponent } from '../../shared/components/form/input-text/input-text.component';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { Sex } from '../../shared/enum/sex.enum';
import { classes, sexes } from '../../shared/select-values';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../templates/confirm-dialog/confirm-dialog.component';
import { STUDENT_IDENTITY_DEFAULTS } from '../student-domain';
import { StudentsFailure, StudentsResult, StudentsService } from '../students.service';

/**
 * One message per failure the service can name.
 *
 * A total record rather than a lookup with a fallback: a new member of
 * `StudentsFailure` fails to compile here instead of reaching a teacher as
 * "something went wrong". The same arrangement `TemplatePanelComponent` uses.
 */
const FAILURE_KEYS: Readonly<Record<StudentsFailure, string>> = {
  'not-signed-in': 'students.errors.notSignedIn',
  'name-required': 'students.errors.nameRequired',
  'name-too-long': 'students.errors.nameTooLong',
  'sex-required': 'students.errors.sexRequired',
  'permission-denied': 'students.errors.permissionDenied',
  offline: 'students.errors.offline',
  unknown: 'students.errors.unknown',
};

/**
 * Failures about what the teacher typed, as opposed to what the store did.
 *
 * These get an inline message under the form rather than a snackbar: a message
 * that disappears on its own is the wrong shape for one that has to stay
 * readable while the field it describes is being fixed.
 */
const FORM_FAILURES: readonly StudentsFailure[] = ['name-required', 'name-too-long', 'sex-required'];

/** Long enough to read one sentence, short enough not to sit on the form. */
const SNACKBAR_DURATION_MS = 4000;

/** The form's controls, typed so a rename here is a compile error there. */
interface RosterFormControls {
  studentName: FormControl<string>;
  name: FormControl<string>;
  sex: FormControl<Sex | null>;
  class: FormControl<string | null>;
}

/**
 * The teacher-facing student roster (FR-005…FR-008), mounted at `/students`.
 *
 * One form above one list, and the form does double duty: `editingId` is `null`
 * while it adds and holds a student id while it edits. A second, separate edit
 * form would mean two copies of the same four controls and two places to keep
 * the validation messages in agreement.
 *
 * A plain list rather than a `mat-table`: four values per student read fine as a
 * two-line row, and a Material table would drag in the `data-table-cells` mixin
 * and its row-height caveats for no gain.
 */
@Component({
  selector: 'app-student-roster',
  templateUrl: './student-roster.component.html',
  styleUrl: './student-roster.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    FormWrapperComponent,
    InputTextComponent,
    SelectComponent,
    ButtonComponent,
  ],
})
export class StudentRosterComponent implements OnInit {
  private readonly studentsService: StudentsService = inject(StudentsService);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly sexes: string[] = sexes;
  protected readonly classes: { label: string; value: string }[] = classes;

  protected readonly form: FormGroup<RosterFormControls> = new FormGroup<RosterFormControls>({
    studentName: new FormControl<string>('', { nonNullable: true }),
    name: new FormControl<string>('', { nonNullable: true }),
    sex: new FormControl<Sex | null>(null),
    class: new FormControl<string | null>(null),
  });

  protected readonly students: Signal<readonly Student[]> = this.studentsService.students;

  protected readonly loading: WritableSignal<boolean> = signal(false);
  protected readonly saving: WritableSignal<boolean> = signal(false);

  /**
   * `null` while the form adds a student; the id of the student being edited
   * otherwise. Everything the form says about itself — its submit label, whether
   * Cancel is offered, which row is highlighted — reads off this one signal.
   */
  protected readonly editingId: WritableSignal<string | null> = signal<string | null>(null);

  /** The student a delete is in flight for, so its row can say so. */
  protected readonly deletingId: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * Why the list is not on screen, as a translate key.
   *
   * Rendered inline with a retry rather than in a snackbar: a transient message
   * cannot explain an area that stays empty after it disappears.
   */
  protected readonly loadFailureKey: WritableSignal<string | null> = signal<string | null>(null);

  /** Why the form was refused, as a translate key. Cleared on the next submit. */
  protected readonly formFailureKey: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * The form's own element, so entering edit mode can bring it into view.
   *
   * The form sits above the list, so pressing Edit on a row far down the page
   * otherwise looks like it did nothing at all.
   */
  private readonly formElement: Signal<ElementRef<HTMLElement> | undefined> =
    viewChild<ElementRef<HTMLElement>>('rosterForm');

  /**
   * The roster only mounts behind `authGuard`, which holds until the session
   * stops being `resolving` — so the uid the service needs is already known.
   */
  public ngOnInit(): void {
    void this.reload();
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.loadFailureKey.set(null);

    try {
      const result: StudentsResult<readonly Student[]> = await this.studentsService.load();

      if (!result.ok) {
        this.loadFailureKey.set(FAILURE_KEYS[result.failure]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  /** One handler for both modes — `editingId` is what decides which. */
  protected async submit(): Promise<void> {
    const identity: StudentIdentity = this.readForm();
    const localFailure: StudentsFailure | null = this.studentsService.validate(identity);

    // Checked here as well as in the service so an unusable student costs a
    // message rather than a round-trip.
    if (localFailure !== null) {
      this.formFailureKey.set(FAILURE_KEYS[localFailure]);

      return;
    }

    this.formFailureKey.set(null);
    this.saving.set(true);

    const studentId: string | null = this.editingId();

    try {
      const result: StudentsResult<Student> =
        studentId === null
          ? await this.studentsService.create({ identity })
          : await this.studentsService.update(studentId, { identity });

      if (!result.ok) {
        if (FORM_FAILURES.includes(result.failure)) {
          this.formFailureKey.set(FAILURE_KEYS[result.failure]);
        } else {
          this.notify(FAILURE_KEYS[result.failure]);
        }

        return;
      }

      this.resetToAddMode();
      this.notify(studentId === null ? 'students.saved' : 'students.updated');
    } finally {
      this.saving.set(false);
    }
  }

  protected edit(student: Student): void {
    this.editingId.set(student.id);
    this.formFailureKey.set(null);

    this.form.setValue({
      studentName: student.identity.studentName,
      name: student.identity.name ?? '',
      sex: student.identity.sex,
      class: student.identity.class,
    });

    this.revealForm();
  }

  protected cancelEdit(): void {
    this.resetToAddMode();
  }

  /**
   * The translate key a stored `class` value is listed under.
   *
   * The select stores the Polish value (`"Klasa 5 szkoły podstawowej"`) because
   * that is what the report form's control holds and what `S-04` has to patch
   * back into it. Rendering that value directly would leave one option — `"Osoba
   * dorosła"`, whose key is lower-cased — untranslated, and would print Polish
   * on the English roster for all thirteen. Looking the label up is what keeps
   * the row bilingual without changing what is stored.
   *
   * A value with no matching option renders as itself: a document written
   * against an older option list is still readable, just not translated.
   */
  protected classLabelKey(value: string): string {
    return classes.find((option: { label: string; value: string }) => option.value === value)?.label ?? value;
  }

  protected async remove(student: Student): Promise<void> {
    const confirmed: boolean = await this.confirm({
      titleKey: 'students.confirmDelete.title',
      messageKey: 'students.confirmDelete.message',
      messageParams: { name: student.identity.studentName },
      confirmKey: 'students.confirmDelete.confirm',
      cancelKey: 'students.cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.deletingId.set(student.id);

    try {
      const result: StudentsResult<void> = await this.studentsService.remove(student.id);

      // A row being edited that is then deleted would leave the form pointing at
      // a student that no longer exists, and the next save would be an update
      // against a missing document.
      if (result.ok && this.editingId() === student.id) {
        this.resetToAddMode();
      }

      this.notify(result.ok ? 'students.deleted' : FAILURE_KEYS[result.failure]);
    } finally {
      this.deletingId.set(null);
    }
  }

  /**
   * The form's values as the service wants them.
   *
   * Blank optional text becomes `null` in the service, not here — one place
   * decides what an emptied field means.
   */
  private readForm(): StudentIdentity {
    const value = this.form.getRawValue();

    return {
      ...STUDENT_IDENTITY_DEFAULTS,
      studentName: value.studentName,
      name: value.name,
      sex: value.sex,
      class: value.class,
    };
  }

  private resetToAddMode(): void {
    this.editingId.set(null);
    this.formFailureKey.set(null);
    this.form.reset({ studentName: '', name: '', sex: null, class: null });
  }

  /**
   * Brings the form into view and puts the cursor in its first field.
   *
   * `block: 'nearest'` rather than `'start'`: when the form is already on screen
   * — the common case for the first few rows — `'start'` would scroll the page
   * for no reason.
   */
  private revealForm(): void {
    const element: HTMLElement | undefined = this.formElement()?.nativeElement;

    if (element === undefined) {
      return;
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    element.querySelector('input')?.focus();
  }

  private async confirm(data: ConfirmDialogData): Promise<boolean> {
    const dialogRef: MatDialogRef<ConfirmDialogComponent, boolean> = this.dialog.open<
      ConfirmDialogComponent,
      ConfirmDialogData,
      boolean
    >(ConfirmDialogComponent, { data, width: '480px' });

    // Escape and a backdrop click both close with `undefined`. Only an explicit
    // confirm counts.
    return (await firstValueFrom(dialogRef.afterClosed())) === true;
  }

  /**
   * `instant` rather than `get`, because `MatSnackBar.open` takes a string and
   * not an observable. The duration is passed rather than left to Material,
   * whose default is `0` — "never dismiss".
   */
  private notify(messageKey: string): void {
    this.snackBar.open(this.translate.instant(messageKey), undefined, { duration: SNACKBAR_DURATION_MS });
  }
}
