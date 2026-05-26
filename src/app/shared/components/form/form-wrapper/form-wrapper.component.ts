import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SectionTitleComponent } from '../../UI/section-title/section-title.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-wrapper',
  imports: [SectionTitleComponent, ReactiveFormsModule],
  templateUrl: './form-wrapper.component.html',
  styleUrl: './form-wrapper.component.scss',
})
export class FormWrapperComponent {
  @Input() sectionTitle = 'SET SECTION TITLE';
  @Input() formG: FormGroup;

  @Output() submitEmitter = new EventEmitter<FormGroup>();

  onSubmit(formGroup: FormGroup): void {
    this.submitEmitter.emit(formGroup);
  }
}
