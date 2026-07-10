import { Component, Input } from '@angular/core';
import { SectionTitleComponent } from '../../UI/section-title/section-title.component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-wrapper',
  imports: [SectionTitleComponent, ReactiveFormsModule],
  templateUrl: './form-wrapper.component.html',
  styleUrl: './form-wrapper.component.scss',
})
export class FormWrapperComponent {
  @Input() sectionTitle = 'SET SECTION TITLE';
}
