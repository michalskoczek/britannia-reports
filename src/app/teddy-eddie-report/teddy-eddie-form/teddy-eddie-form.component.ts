import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ageTE } from '../../shared/development-path';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextComponent } from '../../shared/components/form/input-text/input-text.component';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { DateComponent } from '../../shared/components/form/date/date.component';

@Component({
  selector: 'app-teddy-eddie-form',
  imports: [ReactiveFormsModule, TranslateModule, InputTextComponent, SelectComponent, DateComponent],
  templateUrl: './teddy-eddie-form.component.html',
  styleUrl: './teddy-eddie-form.component.scss',
})
export class TeddyEddieFormComponent implements OnInit, OnDestroy {
  @Input({ required: true }) form!: FormGroup;
  @Output() ageSelected = new EventEmitter<string>();

  protected readonly ageTE = ageTE;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.form
      .get('age')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((age: string) => this.ageSelected.emit(age));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
