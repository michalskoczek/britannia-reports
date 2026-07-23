import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { ReCaptchaV3Provider, provideAppCheck, initializeAppCheck } from '@angular/fire/app-check';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import 'moment/locale/pl';
import moment from 'moment';

moment.locale('pl');

// App Check has no verifiable attestation on localhost, so a debug token is the
// only way to get a token there. This MUST execute before initializeAppCheck().
// The token is printed to the console on first boot and has to be registered in
// Firebase Console → App Check → Apps → Manage debug tokens (per machine and
// per browser profile).
if (!environment.production) {
  (self as unknown as Record<string, unknown>)['FIREBASE_APPCHECK_DEBUG_TOKEN'] = true;
}

export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MM YYYY',
    dateA11yLabel: 'dd',
    monthYearA11yLabel: 'MM YYYY',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideTranslateService({
      fallbackLang: 'pl',
      lang: 'pl',
      loader: provideTranslateHttpLoader({
        prefix: './assets/i18n/',
        suffix: '.json',
      }),
    }),
    { provide: LOCALE_ID, useValue: 'pl-PL' },
    { provide: MAT_DATE_LOCALE, useValue: 'pl-PL' },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { floatLabel: 'always' } },
    provideMomentDateAdapter(MY_FORMATS),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAppCheck(() =>
      initializeAppCheck(undefined, {
        provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      }),
    ),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
};
