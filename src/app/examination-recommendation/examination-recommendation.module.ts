import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExaminationRecommendationComponent } from './examination-recommendation.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [ExaminationRecommendationComponent],
  exports: [ExaminationRecommendationComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatExpansionModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
})
export class ExaminationRecommendationModule {}
