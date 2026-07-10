import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MatError, MatFormField, MatFormFieldModule, MatLabel } from '@angular/material/form-field';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MatInput, MatInputModule } from '@angular/material/input';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Subject, takeUntil } from 'rxjs';

class ParentErrorStateMatcher implements ErrorStateMatcher {
  constructor(private readonly ngControlRef: () => NgControl | null) {}

  isErrorState(): boolean {
    const parent = this.ngControlRef()?.control;
    return !!(parent && parent.invalid && (parent.touched || parent.dirty));
  }
}

@Component({
  selector: 'app-date',
  imports: [
    MatLabel,
    MatDatepicker,
    MatFormField,
    MatError,
    MatDatepickerToggle,
    TranslateModule,
    MatDatepickerInput,
    MatInput,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './date.component.html',
  styleUrl: './date.component.scss',
})
export class DateComponent implements ControlValueAccessor, OnInit, OnDestroy {
  label = input<string>('chooseDate');
  placeholder = input<string>('chooseDate');
  required = input<boolean>(false);
  errorMessage = input<string>('error.fieldIsRequired');

  public readonly ngControl = inject(NgControl, { self: true, optional: true });

  protected readonly control = new FormControl<Date | null>(null);
  protected readonly errorStateMatcher: ErrorStateMatcher;

  private readonly destroy$ = new Subject<void>();
  private onChange: (value: Date | null) => void = () => {};
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

  writeValue(value: Date | null): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: (value: Date | null) => void): void {
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

  protected onBlur(): void {
    this.onTouched();
  }
}
