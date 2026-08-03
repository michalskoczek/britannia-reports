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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { FAILURE_KEYS, FORM_FAILURES } from '../student-failure-keys';
import {
  createStudentForm,
  readStudentForm,
  resetStudentForm,
  StudentFormComponent,
  StudentFormControls,
} from '../student-form/student-form.component';
import { diffIdentity, StudentIdentityDiff } from '../student-identity-diff';
import { StudentsFailure, StudentsResult, StudentsService } from '../students.service';

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
 *
 * It also carries the quick-add: "this student isn't in my roster yet" arrives
 * mid-report, and `/students` is a route, so sending the teacher there to add one
 * destroys `ShellComponent` and every half-written report form with it
 * (`src/CLAUDE.md`). Adding from here is what closes that cost.
 */
@Component({
  selector: 'app-student-picker',
  templateUrl: './student-picker.component.html',
  styleUrl: './student-picker.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    FormWrapperComponent,
    SelectComponent,
    StudentFormComponent,
    ButtonComponent,
  ],
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
   * Whether the quick-add fields are on screen.
   *
   * Collapsed by default: picking is the ordinary action here and adding is the
   * exception, so four extra controls sitting open above the report would be
   * paying for the exception on every visit.
   */
  protected readonly quickAddOpen: WritableSignal<boolean> = signal(false);

  /**
   * The quick-add's own group, built by the same factory the roster uses so the
   * two surfaces cannot end up with differently-typed copies of the four
   * controls. Owned here; `app-student-form` only renders it.
   */
  protected readonly quickAddForm: FormGroup<StudentFormControls> = createStudentForm();

  /** Why the quick-add was refused, as a translate key. `null` renders nothing. */
  protected readonly quickAddFailureKey: WritableSignal<string | null> = signal<string | null>(null);

  /** A create in flight, so the quick-add's buttons can say so. */
  protected readonly saving: WritableSignal<boolean> = signal(false);

  constructor() {
    // The message goes when its cause goes, not when the teacher presses Add
    // again — otherwise a corrected name still reads as rejected. The whole group
    // rather than one control, because any of the four can be what the failure
    // was about. Same shape as `StudentRosterComponent`.
    this.quickAddForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.quickAddFailureKey.set(null));
  }

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

    await this.selectStudent(student);
  }

  protected openQuickAdd(): void {
    this.quickAddFailureKey.set(null);
    this.quickAddOpen.set(true);
  }

  protected cancelQuickAdd(): void {
    this.closeQuickAdd();
  }

  /**
   * Creates the student and then treats them exactly as a picked one.
   *
   * Routing the created identity through `selectStudent` rather than emitting it
   * directly is what makes quick-add and pick the same action: the diff runs, the
   * confirmation appears when something the teacher typed is at stake, and a
   * dismissed prompt puts the select back. A student can be worth adding to the
   * roster without being the one this half-written report is about.
   */
  protected async submitQuickAdd(): Promise<void> {
    const identity: StudentIdentity = readStudentForm(this.quickAddForm);
    const localFailure: StudentsFailure | null = this.studentsService.validate(identity);

    // Checked here as well as in the service so an unusable student costs a
    // message rather than a round-trip — the roster's arrangement.
    if (localFailure !== null) {
      this.quickAddFailureKey.set(FAILURE_KEYS[localFailure]);

      return;
    }

    this.quickAddFailureKey.set(null);
    this.saving.set(true);

    try {
      const result: StudentsResult<Student> = await this.studentsService.create({ identity });

      if (!result.ok) {
        // What the teacher typed stays inline, under the field it is about; what
        // the store did goes to the snackbar. A message that disappears on its
        // own is the wrong shape for one that has to stay readable while the
        // field it describes is being fixed.
        if (FORM_FAILURES.includes(result.failure)) {
          this.quickAddFailureKey.set(FAILURE_KEYS[result.failure]);
        } else {
          this.notify(FAILURE_KEYS[result.failure]);
        }

        return;
      }

      const created: Student = result.value;

      this.closeQuickAdd();

      // `{ emitEvent: false }` so this does not re-enter `pick()` and ask about a
      // student `selectStudent` is about to ask about anyway.
      this.studentControl.setValue(created.id, { emitEvent: false });

      // Only on the failure path. `StudentsService.create` sets `loadedFor` on
      // success, so a create after a failed `load()` leaves the cache holding
      // exactly this one student — a one-entry roster that looks complete, with
      // every previously-added student silently missing from the select. On the
      // ordinary path the service has already appended to the cache, and an
      // unconditional reload would spend a full-collection read per quick-add
      // against the Spark budget for nothing. Third instance of this branch, after
      // `TemplatePanelComponent.save()` and `StudentRosterComponent.submit()`.
      if (this.loadFailureKey() !== null) {
        await this.reload();
      }

      await this.selectStudent(created);

      // Notified last, and deliberately after the apply message: the create is
      // the fact that outlives the pick — the student is on the roster whether or
      // not the teacher let the details into this report — so it is the one worth
      // leaving on screen.
      this.notify('students.picker.quickAdd.added');
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Saves on Enter instead of letting the report's `<form>` submit.
   *
   * The panel is mounted inside `semestr-report.component.html`'s form, whose
   * submit handler downloads a PDF — so an unhandled Enter in either quick-add
   * text field generates a report instead of adding a student. The same trap
   * `TemplatePanelComponent.onNameEnter` documents at its own field.
   */
  protected onQuickAddEnter(event: Event): void {
    event.preventDefault();

    void this.submitQuickAdd();
  }

  /** Back to the collapsed, blank state — after a cancel and after a success. */
  private closeQuickAdd(): void {
    this.quickAddOpen.set(false);
    this.quickAddFailureKey.set(null);
    resetStudentForm(this.quickAddForm);
  }

  /** Offers the identity to the report, and keeps the select telling the truth. */
  private async selectStudent(student: Student): Promise<void> {
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
