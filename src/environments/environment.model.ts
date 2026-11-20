/**
 * Shared shape contract for the environment files.
 *
 * This file is NEVER swapped by `fileReplacements`. Both `environment.ts` and
 * `environment.prod.ts` import `Environment` from here so the two stay in sync at
 * compile time. Do not move this interface into either environment file: under
 * `fileReplacements` the prod file *becomes* `environment.ts`, so an import
 * between them would resolve to the module itself.
 */
export interface Environment {
  production: boolean;

  /**
   * Point Auth and Firestore at the local emulators instead of the real project.
   *
   * `true` in `environment.ts`, `false` in `environment.prod.ts`. Dev and prod
   * share one Firebase project, so with this off, everything you do locally
   * reads and writes real teacher data — which is why the default for
   * development is on. When it is on, App Check is also skipped: attesting to
   * the real project while talking to localhost buys nothing.
   *
   * The emulators start empty. Seed one `allowedUsers` document through the
   * emulator UI before signing in locally, or `SessionService` refuses the
   * session and the app is unusable. `npm run emulators` imports and exports
   * `.emulator-data/` so the seed survives a restart.
   */
  useEmulators: boolean;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  recaptchaSiteKey: string;

  /**
   * Which App Check provider `recaptchaSiteKey` belongs to — the two key types are not
   * interchangeable (see `src/app/app-check-provider.ts`). Production is registered with the
   * classic `recaptcha-v3`; staging, created after Firebase stopped accepting new classic
   * registrations, uses `recaptcha-enterprise`. Changing it requires re-registering the app in
   * Firebase Console → App Check first.
   */
  appCheckProvider: 'recaptcha-v3' | 'recaptcha-enterprise';
}
