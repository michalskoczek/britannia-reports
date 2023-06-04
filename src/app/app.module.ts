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
import { SignatureModule } from './signature/signature.module';
import { HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatTableModule } from '@angular/material/table';
import { SpecialMarksModule } from './rating-scale/special-marks/special-marks.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';

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
    SignatureModule,
    HttpClientModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatMomentDateModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    SpecialMarksModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatIconModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pl-PL' },
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
