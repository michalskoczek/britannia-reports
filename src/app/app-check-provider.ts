import { AppCheckOptions, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } from '@angular/fire/app-check';

import { Environment } from '../environments/environment.model';

/**
 * Builds the App Check provider an environment asks for.
 *
 * Production was registered in July 2026 with the classic reCAPTCHA v3 provider and still runs
 * on it. Firebase no longer lets a NEW app register the classic provider (it is deprecated in
 * favour of reCAPTCHA Enterprise / Google Cloud Fraud Defense), so the staging project, created
 * in November 2026, had to use Enterprise. The two keys are not interchangeable: a v3 site key
 * only works with `ReCaptchaV3Provider`, an Enterprise key only with `ReCaptchaEnterpriseProvider`
 * — the wrong pairing fails attestation, which shows up as `permission-denied` on Firestore
 * once enforcement is on.
 */
export function appCheckProviderFor(env: Pick<Environment, 'appCheckProvider' | 'recaptchaSiteKey'>): AppCheckOptions['provider'] {
  return env.appCheckProvider === 'recaptcha-enterprise'
    ? new ReCaptchaEnterpriseProvider(env.recaptchaSiteKey)
    : new ReCaptchaV3Provider(env.recaptchaSiteKey);
}
