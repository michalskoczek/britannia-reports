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
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  recaptchaSiteKey: string;
}
