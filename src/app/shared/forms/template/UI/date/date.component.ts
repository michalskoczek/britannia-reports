import { Component, EventEmitter, Input, input, Output } from '@angular/core';
import {
  MatError,
  MatFormField,
  MatFormFieldModule,
  MatLabel,
} from '@angular/material/form-field';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { MatInput, MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';

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
    FormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './date.component.html',
  styleUrl: './date.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class DateComponent {
  @Input() model: Date | null = null;

  @Output() modelChange = new EventEmitter<Date | null>();

  label = input<string>('chooseDate');
  placeholder = input<string>('chooseDate');
  required = input<boolean>(false);
  errorMessage = input<string>('error.fieldIsRequired');

  onModelChange(value: Date | null): void {
    this.modelChange.emit(value);
  }
}
