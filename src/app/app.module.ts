import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HeaderModule } from './header/header.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RatingScaleModule } from './rating-scale/rating-scale.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HeaderModule,
    NoopAnimationsModule,
    RatingScaleModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
