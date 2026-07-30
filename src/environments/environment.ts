/**
 * Development environment.
 *
 * The Firebase config values and the reCAPTCHA site key below are PUBLIC BY
 * DESIGN — they ship inside the SPA bundle and are visible to every visitor.
 * They are not secrets and must not be moved into a secret store or a `.env`
 * file. Firestore security rules, not key secrecy, protect the data.
 *
 * Dev and prod share one Firebase project, so `firebase` is identical in both
 * files today; `production` and `useEmulators` are what differ. `useEmulators`
 * is the first value that genuinely does — the seam S-01 left behind.
 */
import { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  useEmulators: true,
  firebase: {
    apiKey: 'AIzaSyBYXjjdYzjhewx1NUGJ079AuvvMveUskzc',
    authDomain: 'britannia-reports.firebaseapp.com',
    projectId: 'britannia-reports',
    storageBucket: 'britannia-reports.firebasestorage.app',
    messagingSenderId: '1039458477078',
    appId: '1:1039458477078:web:90de33b8569b522a060137',
  },
  recaptchaSiteKey: '6LfffGEtAAAAAHj0u6_WmNZLrw6FM9BbLukS05ZL',
};
