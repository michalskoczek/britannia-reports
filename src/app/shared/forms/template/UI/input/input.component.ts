import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  input,
  Input,
  InputSignal,
  Output,
  output,
  signal,
  WritableSignal,
} from '@angular/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-input',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    TranslateModule,
    MatError,
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent {
  @Input() model: any;

  @Output() modelChange: EventEmitter<any> = new EventEmitter();

  type: InputSignal<string> = input<string>('text');
  placeholder: InputSignal<string> = input<string>('typeValue');
  label: InputSignal<string> = input<string>('set label');
  required: InputSignal<boolean> = input<boolean>(false);
  errorMessage: InputSignal<string> = input<string>('set error message');

  onModelChange(value: any): void {
    this.modelChange.emit(value);
  }
}
