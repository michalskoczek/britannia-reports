import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { BasicQuestionsComponent } from './basic-questions.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MAT_DATE_LOCALE } from '@angular/material/core';

@NgModule({
  declarations: [BasicQuestionsComponent],
  exports: [BasicQuestionsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatInputModule,
    MatSelectModule,
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'pl-PL' }],
})
export class BasicQuestionsModule {}
