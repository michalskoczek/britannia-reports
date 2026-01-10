import { Component, input, InputSignal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SectionTitleComponent } from '../../../../components/UI/section-title/section-title.component';

@Component({
  selector: 'app-form-wrapper-template',
  imports: [SectionTitleComponent, FormsModule],
  templateUrl: './form-wrapper-template.component.html',
  styleUrl: './form-wrapper-template.component.scss',
})
export class FormWrapperComponent {
  sectionTitle: InputSignal<string> = input<string>('SET SECTION TITLE');
}
