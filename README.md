# Britannia Reports

A web app that lets teachers at the Britannia language school fill structured forms and
download per-student end-of-period reports as PDF, replacing the prior workflow of
writing each report by hand in MS Word. Four report types are supported: end-of-trimester
/ semester, end-of-school-year, post-Cambridge-exam, and Teddy Eddie.

Teachers sign in with a Google account (and must additionally be on the `allowedUsers`
allowlist), keep their own student roster, and save reusable phrasing as templates — so
each report is only the per-student delta rather than 80% retyped boilerplate. Student
data and templates live under `users/{uid}/...` in Firestore and are owned per teacher;
PDFs are produced client-side with pdfmake and are not retained anywhere.

The written foundation this app is built from lives in `context/foundation/`:

- [`prd.md`](context/foundation/prd.md) — problem, personas, scope, FR-001…FR-015, non-goals
- [`roadmap.md`](context/foundation/roadmap.md) — slices and their status
- [`test-plan.md`](context/foundation/test-plan.md) — the risk map and the phased test rollout
- [`infrastructure.md`](context/foundation/infrastructure.md) — the verified deploy story
- [`stack-assessment.md`](context/foundation/stack-assessment.md), [`health-check.md`](context/foundation/health-check.md), [`lessons.md`](context/foundation/lessons.md)

Project conventions for anyone (or anything) writing code here are in
[`src/CLAUDE.md`](src/CLAUDE.md). Operational runbooks — seeding the teacher allowlist,
the PDF fidelity check, the design language — are in [`docs/`](docs/).

## Stack

Angular 20.3 (standalone, no `AppModule`), Angular Material + CDK, ngx-translate
(Polish / English), Bootstrap 5, moment, pdfmake, Firebase (Auth, Firestore, Hosting).

## Running it locally

```bash
npm install
npm run emulators   # terminal 1 — Firebase Auth + Firestore emulators
npm start           # terminal 2 — dev server on http://localhost:4200
```

Sign-in goes through the Auth emulator, so the emulators have to be up before the app is
useful. The account you sign in with must exist in the `allowedUsers` collection of your
Firestore emulator — see [`docs/teacher-allowlist-runbook.md`](docs/teacher-allowlist-runbook.md).

## Build

```bash
npm run build       # artifacts in dist/ — Firebase Hosting serves dist/browser
```

## Tests

```bash
npm test            # unit / component suite (Karma + Jasmine)
npm run test:rules  # firestore.rules against the emulator (needs a JDK)
npm run lint
npm run e2e         # Playwright — see below for the session setup it needs
```

`npm run test:rules` is not wired into `npm test` and there is no CI yet: run it yourself
whenever `firestore.rules` changes, before deploying.

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
