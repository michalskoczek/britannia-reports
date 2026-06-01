import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
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
  itemList = input.required<SelectOptions<any>[]>();

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
    isDisabled ? this.control.disable({ emitEvent: false }) : this.control.enable({ emitEvent: false });
  }

  protected onClosed(): void {
    this.onTouched();
  }
}
