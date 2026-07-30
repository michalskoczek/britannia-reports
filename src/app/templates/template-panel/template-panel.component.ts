import {
  Component,
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
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { ReportTemplate, ReportTemplateFields, TemplateField } from '../../model/report-template.interface';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormWrapperComponent } from '../../shared/components/form/form-wrapper/form-wrapper.component';
import { InputTextComponent } from '../../shared/components/form/input-text/input-text.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { TemplateApplyDiff, TemplatesFailure, TemplatesResult, TemplatesService } from '../templates.service';

/**
 * One message per failure the service can name.
 *
 * A total record rather than a lookup with a fallback: a new member of
 * `TemplatesFailure` fails to compile here instead of reaching a teacher as
 * "something went wrong".
 */
const FAILURE_KEYS: Readonly<Record<TemplatesFailure, string>> = {
  'not-signed-in': 'templates.errors.notSignedIn',
  'name-required': 'templates.errors.nameRequired',
  'name-too-long': 'templates.errors.nameTooLong',
  'name-invalid': 'templates.errors.nameInvalid',
  'name-taken': 'templates.errors.nameTaken',
  'permission-denied': 'templates.errors.permissionDenied',
  offline: 'templates.errors.offline',
  unknown: 'templates.errors.unknown',
};

/**
 * Failures about what the teacher typed, as opposed to what the store did.
 *
 * These get an inline message next to the name field rather than a snackbar: a
 * message that disappears on its own is the wrong shape for one that has to stay
 * readable while the name is being fixed.
 */
const NAME_FAILURES: readonly TemplatesFailure[] = ['name-required', 'name-too-long', 'name-invalid', 'name-taken'];

/** The label a field is listed under in the confirmation dialog. */
const fieldLabelKey = (field: TemplateField): string => `templates.fields.${field}`;

/** Long enough to read one sentence, short enough not to sit on the form. */
const SNACKBAR_DURATION_MS = 4000;

/**
 * The teacher-facing surface for report templates (FR-009…FR-012).
 *
 * Deliberately knows nothing about `SemestrReportComponent.form`. It takes the
 * ten domain values as an input and emits them as an output; the report owns the
 * translation between those values and its 48 controls. That seam is what keeps
 * the frozen form contract and the PDF-fidelity fixtures honest, and it is the
 * one `S-04` reuses for the student picker.
 */
@Component({
  selector: 'app-template-panel',
  templateUrl: './template-panel.component.html',
  styleUrl: './template-panel.component.scss',
  standalone: true,
  imports: [ReactiveFormsModule, TranslateModule, FormWrapperComponent, InputTextComponent, ButtonComponent],
})
export class TemplatePanelComponent implements OnInit {
  /**
   * What the report form holds right now — the left-hand side of the FR-011 diff.
   *
   * Read at the moment Apply or Save is pressed, never watched. Angular has
   * already run change detection for the keystroke that preceded the click, so
   * the value is current.
   */
  public readonly currentFields: InputSignal<ReportTemplateFields> = input.required<ReportTemplateFields>();

  /**
   * The domain payload the report should write into its form.
   *
   * Emitted only after the teacher has agreed to it — and not at all for an empty
   * template, which US-01 requires to be a no-op.
   */
  public readonly apply: OutputEmitterRef<ReportTemplateFields> = output<ReportTemplateFields>();

  private readonly templatesService: TemplatesService = inject(TemplatesService);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  private readonly translate: TranslateService = inject(TranslateService);

  protected readonly nameControl: FormControl<string> = new FormControl<string>('', { nonNullable: true });

  protected readonly templates: Signal<readonly ReportTemplate[]> = this.templatesService.templates;

  protected readonly loading: WritableSignal<boolean> = signal(false);
  protected readonly saving: WritableSignal<boolean> = signal(false);

  /** The template a delete is in flight for, so its row can say so. */
  protected readonly deletingId: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * Why the list is not on screen, as a translate key.
   *
   * Rendered inline with a retry rather than in a snackbar: a transient message
   * cannot explain an area that stays empty after it disappears.
   */
  protected readonly loadFailureKey: WritableSignal<string | null> = signal<string | null>(null);

  /** Why the name was refused, as a translate key. Cleared as soon as it changes. */
  protected readonly nameFailureKey: WritableSignal<string | null> = signal<string | null>(null);

  constructor() {
    this.nameControl.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.nameFailureKey.set(null));
  }

  /**
   * The panel only ever mounts inside the shell, which `authGuard` holds until the
   * session stops being `resolving` — so the uid the service needs is already
   * known by the time this runs.
   */
  public ngOnInit(): void {
    void this.reload();
  }

  protected async reload(): Promise<void> {
    this.loading.set(true);
    this.loadFailureKey.set(null);

    try {
      const result: TemplatesResult<readonly ReportTemplate[]> = await this.templatesService.load();

      if (!result.ok) {
        this.loadFailureKey.set(FAILURE_KEYS[result.failure]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  protected async save(): Promise<void> {
    const name: string = this.nameControl.value;
    const nameFailure: TemplatesFailure | null = this.templatesService.validateName(name);

    // Checked here as well as in the service so an unusable name costs a message
    // rather than a round-trip.
    if (nameFailure !== null) {
      this.nameFailureKey.set(FAILURE_KEYS[nameFailure]);

      return;
    }

    this.saving.set(true);

    try {
      const result: TemplatesResult<ReportTemplate> = await this.templatesService.save({
        name,
        fields: this.currentFields(),
      });

      if (result.ok) {
        this.nameControl.setValue('');
        this.notify('templates.saved');

        return;
      }

      if (NAME_FAILURES.includes(result.failure)) {
        this.nameFailureKey.set(FAILURE_KEYS[result.failure]);
      } else {
        this.notify(FAILURE_KEYS[result.failure]);
      }
    } finally {
      this.saving.set(false);
    }
  }

  protected async applyTemplate(template: ReportTemplate): Promise<void> {
    const fields: ReportTemplateFields = template.fields;

    // US-01: an all-defaults template applies as a no-op. Said out loud, because a
    // button that silently does nothing reads as broken rather than as obedient.
    if (this.templatesService.isEmpty(fields)) {
      this.notify('templates.nothingToApply');

      return;
    }

    const diff: TemplateApplyDiff = this.templatesService.diff(fields, this.currentFields());

    // Nothing the teacher typed is at stake, so FR-011's prompt would be noise.
    if (diff.overwritten.length === 0 && diff.cleared.length === 0) {
      this.apply.emit(fields);

      return;
    }

    const confirmed: boolean = await this.confirm({
      titleKey: 'templates.confirmApply.title',
      messageKey: 'templates.confirmApply.message',
      messageParams: { name: template.name },
      itemGroups: [
        { titleKey: 'templates.confirmApply.overwritten', items: diff.overwritten.map(fieldLabelKey) },
        { titleKey: 'templates.confirmApply.cleared', items: diff.cleared.map(fieldLabelKey) },
      ],
      confirmKey: 'templates.confirmApply.confirm',
      cancelKey: 'templates.cancel',
    });

    if (confirmed) {
      this.apply.emit(fields);
    }
  }

  protected async remove(template: ReportTemplate): Promise<void> {
    const confirmed: boolean = await this.confirm({
      titleKey: 'templates.confirmDelete.title',
      messageKey: 'templates.confirmDelete.message',
      messageParams: { name: template.name },
      confirmKey: 'templates.confirmDelete.confirm',
      cancelKey: 'templates.cancel',
      confirmVariant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    this.deletingId.set(template.id);

    try {
      const result: TemplatesResult<void> = await this.templatesService.remove(template.id);

      this.notify(result.ok ? 'templates.deleted' : FAILURE_KEYS[result.failure]);
    } finally {
      this.deletingId.set(null);
    }
  }

  /**
   * Saves on Enter instead of letting the report's `<form>` submit.
   *
   * The panel is mounted inside `semestr-report.component.html`'s form, whose
   * submit handler downloads a PDF — so an unhandled Enter in the name field
   * generates a report instead of saving a template.
   */
  protected onNameEnter(event: Event): void {
    event.preventDefault();

    void this.save();
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
   * `instant` rather than `get`, because `MatSnackBar.open` takes a string and not
   * an observable. The bundle is loaded long before a teacher can reach this
   * panel, and a snackbar outlives a language switch by a couple of seconds at
   * most — unlike the dialog, which renders its keys through the pipe.
   *
   * The duration is passed rather than left to Material, whose default is `0` —
   * "never dismiss". An outcome message that has to be clicked away is a nag, and
   * there is no action to offer alongside it.
   */
  private notify(messageKey: string): void {
    this.snackBar.open(this.translate.instant(messageKey), undefined, { duration: SNACKBAR_DURATION_MS });
  }
}
