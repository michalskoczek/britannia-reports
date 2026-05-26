import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ageTE } from '../../shared/development-path';
import { TranslateModule } from '@ngx-translate/core';
import { InputComponent } from '../../shared/forms/template/UI/input/input.component';
import { TeddyEddieReport } from '../model/teddy-eddie-report.interface';
import { SelectComponent } from '../../shared/forms/template/UI/select/select.component';
import { DateComponent } from '../../shared/forms/template/UI/date/date.component';

@Component({
  selector: 'app-teddy-eddie-form',
  imports: [
    FormsModule,
    TranslateModule,
    InputComponent,
    SelectComponent,
    DateComponent,
  ],
  templateUrl: './teddy-eddie-form.component.html',
  styleUrl: './teddy-eddie-form.component.scss',
})
export class TeddyEddieFormComponent implements OnInit {
  @Input() form!: TeddyEddieReport;
  @Output() ageSelected = new EventEmitter<string>();

  protected readonly ageTE = ageTE;

  ngOnInit(): void {}

  onAgeChange(age: string): void {
    this.ageSelected.emit(age);
  }
}
