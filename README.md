# BritanniaReports

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.6.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Driving the app in a browser (Playwright CLI)

Start the emulators and the dev server first (`npm run emulators`, then `npm start`),
because sign-in goes through the Auth emulator.

```bash
npx playwright-cli open http://localhost:4200
```

Signing in is a Google popup, so it cannot be scripted away — but you only have to do
it once. In the browser that opens, click **Zaloguj się przez Google**, pick an account
that exists in the `allowedUsers` collection of your Firestore emulator, then:

```bash
npm run e2e:auth:save
```

Every browser after that starts signed in as that account:

```bash
npx playwright-cli open http://localhost:4200
npm run e2e:auth:restore
```

`playwright-cli state-save` is the built-in way to do this and does **not** work here:
it captures cookies and localStorage, while the Firebase Web SDK keeps its session in
IndexedDB. `test/e2e/auth-session.mjs` moves that IndexedDB record instead. The saved
file lives in `test/e2e/.auth/` and is gitignored — it holds live Auth-emulator tokens
and is tied to your own `.emulator-data`. Re-run `e2e:auth:save` after wiping the
emulator data or removing the account.

## Running the end-to-end test

```bash
npm run emulators   # terminal 1
npm start           # terminal 2
npm run e2e         # terminal 3
```

The suite reuses the session saved above, so run `npm run e2e:auth:save` once before
the first run. Neither process is started by `playwright.config.ts` on purpose — see the
comment there.

`test/e2e/seed.spec.ts` is the worked example every spec here is modelled on — and it is
**excluded from every run** by `testIgnore` in `playwright.config.ts`. It is a pattern,
not coverage: it demonstrates the shape against Risk #1 from
`context/foundation/test-plan.md` §2 (a filled report that produces no PDF) without being
counted as protecting it. Copy its shape: role-based locators, waits on application state
rather than on time, per-run unique test data, and cleanup that goes straight at the
emulator instead of through the UI. It keeps its `.spec.ts` name so ESLint and
`npx tsc --noEmit` still check it, because an exemplar nothing verifies rots into wrong
advice. It is the reference shape §3 Phase 5 of the test plan builds on; §7 bounds what
e2e may assert, and no quality gate in §5 runs the suite yet.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
