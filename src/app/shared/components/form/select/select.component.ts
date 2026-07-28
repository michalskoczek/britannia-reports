import { Component, computed, inject, input, OnDestroy, OnInit, output } from '@angular/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption, ErrorStateMatcher } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { SelectOptions } from './select-options';

class ParentErrorStateMatcher implements ErrorStateMatcher {
  constructor(private readonly ngControlRef: () => NgControl | null) {}

  isErrorState(): boolean {
    const parent = this.ngControlRef()?.control;
    return !!(parent && parent.invalid && (parent.touched || parent.dirty));
  }
}

@Component({
  selector: 'app-select',
  imports: [MatFormField, MatError, MatLabel, MatOption, MatSelect, TranslateModule, ReactiveFormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  label = input<string>('set label');
  placeholder = input<string>('selectValue');
  required = input<boolean>(false);
  errorMessage = input<string>('error.fieldIsRequired');
  multiple = input<boolean>(false);

  /**
   * Accepts either `{ label, value }` options or a flat list of strings. The three older report forms
   * carry plain `string[]` lists (teachers, courses, books, exam types); normalizing here keeps them
   * from having to map in every consumer.
   */
  itemList = input.required<SelectOptions<any>[] | string[]>();

  protected readonly options = computed<SelectOptions<any>[]>(() =>
    this.itemList().map((item) => (typeof item === 'string' ? { label: item, value: item } : item))
  );

  /**
   * Emits when the user picks a different option. Deliberately mirrors `mat-select`'s own
   * `selectionChange` rather than the control's `valueChanges`: it stays silent on `patchValue`, so a
   * consumer can hang a side effect off a user choice without it firing during programmatic setup.
   */
  selectionChange = output<any>();

  public readonly ngControl = inject(NgControl, { self: true, optional: true });

  protected readonly control = new FormControl<any>(null);
  protected readonly errorStateMatcher: ErrorStateMatcher;

  private readonly destroy$ = new Subject<void>();
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.errorStateMatcher = new ParentErrorStateMatcher(() => this.ngControl);
  }

  ngOnInit(): void {
    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => this.onChange(value));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.control.disable({ emitEvent: false });
    } else {
      this.control.enable({ emitEvent: false });
    }
  }

  protected onClosed(): void {
    this.onTouched();
  }
}
