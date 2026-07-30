import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent, ButtonVariant } from '../../shared/components/button/button.component';

/**
 * One labelled group inside the dialog body.
 *
 * A group rather than a flat list because the FR-011 prompt has to say two
 * different things about two sets of fields — "these will be replaced" and "these
 * will be reset" — and a single list would merge them into one claim that is
 * wrong for half its entries.
 */
export interface ConfirmDialogItemGroup {
  /** Translate key for the group heading. */
  titleKey: string;
  /** Translate keys, one per item. Resolved by the dialog, not by the caller. */
  items: readonly string[];
}

/**
 * Everything the dialog renders, as translate keys.
 *
 * Keys rather than resolved strings: FR-018 requires the PL/EN toggle to work on
 * every screen, and a dialog holding pre-translated text would freeze at whatever
 * language was active when it opened.
 */
export interface ConfirmDialogData {
  titleKey: string;
  messageKey: string;
  /** Interpolation values for `messageKey` — e.g. the template's name. */
  messageParams?: Record<string, string>;
  itemGroups?: readonly ConfirmDialogItemGroup[];
  confirmKey: string;
  cancelKey: string;
  /** `danger` for a destructive confirm. Defaults to `primary`. */
  confirmVariant?: ButtonVariant;
}

/**
 * The generic confirm/cancel prompt — the first dialog in this app.
 *
 * Two callers today, both in `TemplatePanelComponent`: apply-over-non-empty-fields
 * (FR-011) and delete-a-template. Kept content-free on purpose so `S-03` can
 * reuse it for "remove a student" without touching this file.
 *
 * Closes with `true` on confirm and `false` on cancel. Escape and a backdrop click
 * close with `undefined`, so a caller must treat anything other than `true` as a
 * refusal — `TemplatePanelComponent.confirm()` is where that normalization lives.
 */
@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions, TranslateModule, ButtonComponent],
})
export class ConfirmDialogComponent {
  protected readonly data: ConfirmDialogData = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef: MatDialogRef<ConfirmDialogComponent, boolean> =
    inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);

  /** Empty groups are dropped here so a caller can pass both unconditionally. */
  protected readonly itemGroups: readonly ConfirmDialogItemGroup[] = (this.data.itemGroups ?? []).filter(
    (group: ConfirmDialogItemGroup) => group.items.length > 0
  );

  protected confirm(): void {
    this.dialogRef.close(true);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }
}
