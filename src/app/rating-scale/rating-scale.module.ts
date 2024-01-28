import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RatingScaleComponent } from './rating-scale.component';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SpecialMarksModule } from './special-marks/special-marks.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [RatingScaleComponent],
  imports: [
    CommonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    SpecialMarksModule,
    TranslateModule,
  ],
  exports: [RatingScaleComponent],
})
export class RatingScaleModule {}
