import { ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } from '@angular/fire/app-check';

import { environment as production } from '../environments/environment.prod';
import { environment as staging } from '../environments/environment.staging';
import { appCheckProviderFor } from './app-check-provider';

describe('appCheckProviderFor', () => {
  it('builds the classic v3 provider for a recaptcha-v3 environment', () => {
    const provider = appCheckProviderFor({ appCheckProvider: 'recaptcha-v3', recaptchaSiteKey: 'site-key' });

    expect(provider).toBeInstanceOf(ReCaptchaV3Provider);
  });

  it('builds the Enterprise provider for a recaptcha-enterprise environment', () => {
    const provider = appCheckProviderFor({ appCheckProvider: 'recaptcha-enterprise', recaptchaSiteKey: 'site-key' });

    expect(provider).toBeInstanceOf(ReCaptchaEnterpriseProvider);
  });

  // Production's App Check registration is the classic provider; switching the provider here
  // without re-registering the app in the console would fail every attestation in production.
  it('keeps production on the classic v3 provider it is registered with', () => {
    expect(production.appCheckProvider).toBe('recaptcha-v3');
  });

  it('puts staging on Enterprise, the only provider a new app can register', () => {
    expect(staging.appCheckProvider).toBe('recaptcha-enterprise');
  });
});
