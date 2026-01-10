import { Component, EventEmitter, Input, input, Output } from '@angular/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { SelectList } from '../../model/select-list';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-select',
  imports: [
    MatFormField,
    MatError,
    MatLabel,
    MatOption,
    MatSelect,
    TranslateModule,
    FormsModule,
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent {
  @Input() model: any;

  label = input<string>('set label');
  placeholder = input<string>('selectValue');
  required = input<boolean>(false);
  errorMessage = input<string>('error.fieldIsRequired');
  itemList = input.required<SelectList<any>[]>();

  @Output() modelChange = new EventEmitter<any>();

  onModelChange(value: any): void {
    this.modelChange.emit(value);
  }
}
