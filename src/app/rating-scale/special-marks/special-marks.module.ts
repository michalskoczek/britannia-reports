import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpecialMarksComponent } from './special-marks.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [SpecialMarksComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatButtonModule,
  ],
  exports: [SpecialMarksComponent],
})
export class SpecialMarksModule {}
