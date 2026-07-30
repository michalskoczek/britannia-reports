/**
 * Production environment. Swapped in for `environment.ts` by the
 * `fileReplacements` entry on the production build configuration in
 * `angular.json`.
 *
 * The Firebase config values and the reCAPTCHA site key below are PUBLIC BY
 * DESIGN — they ship inside the SPA bundle and are visible to every visitor.
 * They are not secrets and must not be moved into a secret store or a `.env`
 * file. Firestore security rules, not key secrecy, protect the data.
 *
 * Dev and prod share one Firebase project, so `firebase` is identical in both
 * files today; `production` and `useEmulators` are what differ.
 *
 * `useEmulators` MUST stay `false` here. This is the file that ships, and it is
 * the only one a default `npm run build` type-checks — a `true` here would point
 * the live app at a localhost that does not exist, and no gate would catch it.
 */
import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  useEmulators: false,
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
