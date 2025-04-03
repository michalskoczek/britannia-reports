import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RatingScaleModule } from './rating-scale/rating-scale.module';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
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
import { YearReportComponent } from './year-report/year-report.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { SemestrReportComponent } from './semestr-report/semestr-report.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { CambridgeReportComponent } from './cambridge-report/cambridge-report.component';
import { TeddyEddieReportComponent } from './teddy-eddie-report/teddy-eddie-report.component';
import { ButtonComponent } from './shared/components/button/button.component';
import { TabGroupComponent } from './shared/UI/tab-group/tab-group.component';
import { HeaderComponent } from './shared/components/header/header.component';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    YearReportComponent,
    SemestrReportComponent,
    CambridgeReportComponent,
    TeddyEddieReportComponent,
  ],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    ReactiveFormsModule,
    RatingScaleModule,
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
    MatTabsModule,
    MatRadioModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatCheckboxModule,
    ButtonComponent,
    TabGroupComponent,
    HeaderComponent,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'pl-PL' },
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' },
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
