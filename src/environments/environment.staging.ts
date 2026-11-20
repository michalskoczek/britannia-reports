/**
 * Staging environment — the client's testbed, built from `develop`.
 *
 * Swapped in for `environment.ts` by the `fileReplacements` entry on the `staging`
 * build configuration in `angular.json` (`npm run build -- --configuration staging`).
 *
 * Points at a SEPARATE Firebase project, `britannia-reports-staging`, with its own Auth,
 * Firestore, allowlist and App Check registration — so nothing done on staging can touch
 * production data, which belongs to real children. Never point this file at
 * `britannia-reports`.
 *
 * `production: true` on purpose: staging must behave like the live app (no App Check debug
 * token, no emulators). The Firebase config values and the reCAPTCHA site key are PUBLIC BY
 * DESIGN, exactly as in `environment.prod.ts`.
 *
 * `recaptchaSiteKey` stays empty until the staging reCAPTCHA v3 key exists (Firebase Console →
 * App Check, see `docs/PLAN-AUTOMATYZACJI.md`). Until then App Check cannot attest on staging,
 * so App Check enforcement must stay OFF in the staging project.
 */
import { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  useEmulators: false,
  firebase: {
    apiKey: 'AIzaSyCHvUV45SFUFaqY6MlBkllNL466_9g1ieQ',
    authDomain: 'britannia-reports-staging.firebaseapp.com',
    projectId: 'britannia-reports-staging',
    storageBucket: 'britannia-reports-staging.firebasestorage.app',
    messagingSenderId: '272690012215',
    appId: '1:272690012215:web:7ac29c82b2b36b35a25fb2',
  },
  recaptchaSiteKey: '',
};
