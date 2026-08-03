import {
  Component,
  computed,
  inject,
  input,
  InputSignal,
  OnInit,
  output,
  OutputEmitterRef,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { Student, StudentIdentity } from '../../model/student.interface';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormWrapperComponent } from '../../shared/components/form/form-wrapper/form-wrapper.component';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { SelectOptions } from '../../shared/components/form/select/select-options';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../templates/confirm-dialog/confirm-dialog.component';
import { FAILURE_KEYS } from '../student-failure-keys';
import { diffIdentity, StudentIdentityDiff } from '../student-identity-diff';
import { StudentsResult, StudentsService } from '../students.service';

/** The label a field is listed under in the confirmation dialog. */
const fieldLabelKey = (field: keyof StudentIdentity): string => `students.fields.${field}`;

/** Long enough to read one sentence, short enough not to sit on the form. */
const SNACKBAR_DURATION_MS = 4000;

/**
 * The teacher-facing surface for FR-013: pick a student, and the report's four
 * identity controls fill from the roster.
 *
 * Deliberately knows nothing about `SemestrReportComponent.form` — the same seam
 * `TemplatePanelComponent` established and for the same reason. It takes the
 * identity the form currently holds as an input and emits the picked one as an
 * output; the report owns the translation between that payload and its 48
 * controls. The two panels write disjoint halves of the field-domain partition
 * in `templates/template-domain.ts`, which is what lets them sit on the same
 * form without either one being able to touch the other's fields.
 */
@Component({
  selector: 'app-student-picker',
  templateUrl: './student-picker.component.html',
  styleUrl: './student-picker.component.scss',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, FormWrapperComponent, SelectComponent, ButtonComponent],
})
export class StudentPickerComponent implements OnInit {
  /**
   * What the report form holds right now — the left-hand side of the diff.
   *
   * Read at the moment a student is picked, never watched. Angular has already
   * run change detection for the keystroke that preceded the click, so the value
   * is current.
   */
  public readonly currentIdentity: InputSignal<StudentIdentity> = input.required<StudentIdentity>();

  /**
   * The identity the report should write into its four identity controls.
   *
   * Emitted only after the teacher has agreed to it — which, when nothing is at
   * stake, means immediately and without a dialog.
   */
  public readonly apply: OutputEmitterRef<StudentIdentity> = output<StudentIdentity>();

  private readonly studentsService: StudentsService = inject(StudentsService);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  private readonly translate: TranslateService = inject(TranslateService);

  /**
   * The picker needs a control of its own because `app-select` is a
   * `ControlValueAccessor`: without an `ngControl` binding it never writes back,
   * so there would be nothing to revert when a confirmation is dismissed.
   *
   * Not part of the report's form — this control says who the report is about,
   * which is a different question from what `studentName` holds.
   */
  protected readonly studentControl: FormControl<string | null> = new FormControl<string | null>(null);

  protected readonly students: Signal<readonly Student[]> = this.studentsService.students;

  /**
   * The roster as `app-select` options.
   *
   * Computed rather than mapped in the template so the array reference is stable
   * across change-detection passes — `itemList` is a signal input, and a fresh
   * array every pass would leave it permanently dirty.
   */
  protected readonly options: Signal<SelectOptions<string>[]> = computed<SelectOptions<string>[]>(() =>
    this.students().map((student: Student) => ({ label: student.identity.studentName, value: student.id })),
  );

  protected readonly loading: WritableSignal<boolean> = signal(false);

  /**
   * Why the roster is not on screen, as a translate key.
   *
   * Rendered inline with a retry rather than in a snackbar: a transient message
   * cannot explain an area that stays empty after it disappears.
   */
  protected readonly loadFailureKey: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * Who the select showed before the current pick, so a dismissed confirmation
   * can be put back.
   *
   * Tracked here rather than read off the control, because by the time the
   * dialog closes the control already holds the new id.
   */
  private selectedId: string | null = null;

  /**
   * The panel only ever mounts inside the shell, which `authGuard` holds until
   * the session stops being `resolving` — so the uid the service needs is
   * already known by the time this runs.
   *
   * Loads unconditionally rather than skipping on `hasFreshRoster()`, unlike
   * `StudentRosterComponent`. The recorded call: a teacher who just added a
   * student at `/students` and came back to write their report must see them,
   * and the tab remounts on every visit. The cost is one collection read per
   * visit against the Spark budget; if it bites, `hasFreshRoster()` is the
   * two-line change here.
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

  /**
   * Bound to `(selectionChange)` rather than to the control's `valueChanges`.
   *
   * `app-select` mirrors `mat-select`'s own output, which stays silent on a
   * programmatic write — so the revert below cannot re-enter this method and ask
   * the same question again.
   */
  protected async pick(studentId: string | null): Promise<void> {
    const student: Student | undefined = this.students().find((candidate: Student) => candidate.id === studentId);

    // The option list is built from the same signal, so this is unreachable
    // through the UI. It matters if the roster moved underneath an open panel.
    if (student === undefined) {
      this.revertSelection();

      return;
    }

    const applied: boolean = await this.applyIdentity(student.identity);

    if (applied) {
      this.selectedId = student.id;

      return;
    }

    // The select shows who the report is about. Leaving it on a student whose
    // details were never written would say the wrong thing about the form.
    this.revertSelection();
  }

  /**
   * Asks, if there is anything to ask about, and emits on a yes.
   *
   * Returns whether the identity was applied, so the caller can decide what to
   * do with the selection. `S-04` Phase 4's quick-add routes through here too,
   * which is what makes a created student behave exactly like a picked one.
   */
  private async applyIdentity(identity: StudentIdentity): Promise<boolean> {
    const diff: StudentIdentityDiff = diffIdentity(identity, this.currentIdentity());

    // Nothing the teacher typed is at stake, so the prompt would be noise — this
    // is the ordinary case of picking a student onto a blank report.
    if (diff.overwritten.length === 0 && diff.cleared.length === 0) {
      this.apply.emit(identity);
      this.notify('students.picker.applied');

      return true;
    }

    const confirmed: boolean = await this.confirm({
      titleKey: 'students.picker.confirmApply.title',
      messageKey: 'students.picker.confirmApply.message',
      messageParams: { name: identity.studentName },
      itemGroups: [
        { titleKey: 'students.picker.confirmApply.overwritten', items: diff.overwritten.map(fieldLabelKey) },
        { titleKey: 'students.picker.confirmApply.cleared', items: diff.cleared.map(fieldLabelKey) },
      ],
      confirmKey: 'students.picker.confirmApply.confirm',
      cancelKey: 'students.cancel',
    });

    if (confirmed) {
      this.apply.emit(identity);
      this.notify('students.picker.applied');
    }

    return confirmed;
  }

  /**
   * `{ emitEvent: false }` so `selectionChange` does not fire again — the
   * control has already moved to the new student by the time the dialog closes.
   */
  private revertSelection(): void {
    this.studentControl.setValue(this.selectedId, { emitEvent: false });
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
