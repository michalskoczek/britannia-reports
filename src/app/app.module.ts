import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';
import { BasicQuestionsModule } from './form/basic-questions/basic-questions.module';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HeaderModule,
    ReactiveFormsModule,
    BasicQuestionsModule,
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'pl-PL' }],
  bootstrap: [AppComponent],
})
export class AppModule {}
