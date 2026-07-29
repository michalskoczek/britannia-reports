import { Component, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';

class ParentErrorStateMatcher implements ErrorStateMatcher {
  constructor(private readonly ngControlRef: () => NgControl | null) {}

  isErrorState(): boolean {
    const parent = this.ngControlRef()?.control;
    return !!(parent && parent.invalid && (parent.touched || parent.dirty));
  }
}

@Component({
  selector: 'app-textarea',
  imports: [MatFormField, MatLabel, MatInput, ReactiveFormsModule, TranslateModule, MatError],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
})
export class TextareaComponent implements ControlValueAccessor, OnInit, OnDestroy {
  placeholder = input<string>('typeValue');
  label = input<string>('set label');
  required = input<boolean>(false);
  errorMessage = input<string>('error.fieldIsRequired');
  rows = input<number>(3);

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

  protected onBlur(): void {
    this.onTouched();
  }
}
