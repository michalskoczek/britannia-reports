import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { ReCaptchaV3Provider, provideAppCheck, initializeAppCheck } from '@angular/fire/app-check';
import { connectAuthEmulator, getAuth, provideAuth } from '@angular/fire/auth';
import { connectFirestoreEmulator, getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';
import 'moment/locale/pl';
import moment from 'moment';

moment.locale('pl');

/** Must match the `emulators` block in `firebase.json`. */
const EMULATOR_HOST = 'localhost';
const AUTH_EMULATOR_PORT = 9099;
const FIRESTORE_EMULATOR_PORT = 8080;

// App Check has no verifiable attestation on localhost, so a debug token is the
// only way to get a token there. This MUST execute before initializeAppCheck().
// The token is printed to the console on first boot and has to be registered in
// Firebase Console → App Check → Apps → Manage debug tokens (per machine and
// per browser profile).
//
// Unreachable while `useEmulators` is on, since App Check is not provided at
// all in that case — but still correct for a non-emulator development build,
// which is why it stays.
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
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Skipped entirely under the emulators: attesting to the real project while
    // Auth and Firestore point at localhost protects nothing, and it would drag
    // the per-machine debug-token registration into every dev environment.
    ...(environment.useEmulators
      ? []
      : [
          provideAppCheck(() =>
            initializeAppCheck(undefined, {
              provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
              isTokenAutoRefreshEnabled: true,
            }),
          ),
        ]),
    provideAuth(() => {
      const auth = getAuth();

      if (environment.useEmulators) {
        // `disableWarnings` silences the banner the SDK injects into the DOM;
        // the emulator is the intended target here, not an accident.
        connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, {
          disableWarnings: true,
        });
      }

      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();

      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, EMULATOR_HOST, FIRESTORE_EMULATOR_PORT);
      }

      return firestore;
    }),
  ],
};
