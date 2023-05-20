import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';
import { BasicQuestionsModule } from './form/basic-questions/basic-questions.module';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RatingScaleModule } from './rating-scale/rating-scale.module';
import { ProficiencyLevelModule } from './proficiency-level/proficiency-level.module';
import { ExaminationRecommendationModule } from './examination-recommendation/examination-recommendation.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HeaderModule,
    ReactiveFormsModule,
    BasicQuestionsModule,
    RatingScaleModule,
    ProficiencyLevelModule,
    ExaminationRecommendationModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pl-PL' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
