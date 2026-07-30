# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. The root `CLAUDE.md` is a brief redirect plus 10xDevs toolkit content — all project conventions live here.

## Hard rules

**PDF fidelity is a hard guardrail.** The four existing report types must produce visually identical PDFs before and after any change. When touching a `*-report.component.ts` file, do not modify the `pdfmake` document definition or its inputs unless the task explicitly requires it. When the task does require it, follow `docs/pdf-fidelity-check.md` — it names the recorded form inputs, the capture command, and the comparison checklist. `npm test` smoke-covers that every report type still renders a PDF; it asserts nothing about layout, so a green suite is not evidence of fidelity.

## Project

Britannia Reports is an Angular 20 single-page app that generates end-of-term and exam reports as PDFs for a language school. Each report type (Cambridge, semester/trimester, Teddy Eddie, year-end) has its own feature folder and produces a `pdfmake` document from a Reactive Forms data entry surface. UI is bilingual (PL/EN) via `ngx-translate`.

## Common commands

```bash
npm start                                                  # ng serve on http://localhost:4200
npm run build                                              # production build → dist/browser
npm run watch                                              # dev build with --watch
npm test                                                   # Karma + Jasmine, interactive (launches Chrome)
npm test -- --watch=false --browsers=ChromeHeadless        # headless single-run (use in CI / for verification)
npm run test:capture                                       # PDF-fidelity capture → docs/pdf-fidelity/captured/ (headed Chrome only)
npm run emulators                                          # Firebase Auth + Firestore emulators + UI (needs a JDK; run alongside npm start)
npm run test:rules                                         # Firestore rules tests: node --test test/rules, behind emulators:exec (needs a JDK)
npm run lint                                               # ESLint over **/*.ts and **/*.html
npm run lint -- --fix                                      # auto-fix what is auto-fixable
npx firebase deploy --only hosting                         # deploy (requires `npm run build` first; public = dist/browser)
```

Running a single spec: `npm test -- --include='**/teddy-eddie-form.component.spec.ts' --watch=false --browsers=ChromeHeadless`.

## Architecture

**Standalone-only.** There are no NgModules in `src/app/`. The app bootstraps via `src/app/app.config.ts` (the `appConfig: ApplicationConfig` export) with `bootstrapApplication` in `src/main.ts`. Every component — `AppComponent`, the four report components, shared form components, and the rating-scale surface — is `standalone: true` with its own `imports` array. New components must be standalone; do not introduce an NgModule.

**Two layers of navigation, and they do different jobs.** The router decides *whether you are in the app*; the tab registry decides *which report you are looking at*. Do not merge them.

- **Router — two routes, added by `S-01`.** `src/app/app.routes.ts`: `/sign-in` → `SignInComponent` behind `signInGuard`, and `''` → `ShellComponent` behind `authGuard`, with `**` redirecting to `''`. `provideRouter(routes)` sits in `app.config.ts`. `AppComponent` is now just the header plus a `<router-outlet>` plus the boot indicator. There is deliberately **no route per report type** — adding one would rewrite the registry below for no gain.
- **Composition inside the shell is still `NgComponentOutlet` against `TabData.tabs`.** `ShellComponent` (`src/app/shell/`) renders a `TabGroupComponent` plus an `<ng-component-outlet>` that swaps in the active tab's feature component. `TabData.tabs` in `src/app/shared/static-data/tab-data.ts` is the registry — adding a new report type means adding an entry there (with the report's standalone component class) and the new feature folder.

**The header lives in `AppComponent`, above the outlet, and must stay there.** It carries the PL/EN toggle, and FR-018 requires that toggle on *every* screen including sign-in. Moving it into `ShellComponent` would silently strip it from the sign-in screen.

**Global providers live in `app.config.ts`.** That single file wires `provideHttpClient()`, `provideTranslateService({ ... loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }) })` (the new `@ngx-translate/core@17` API — no `TranslateModule.forRoot()` at runtime), `LOCALE_ID = 'pl-PL'`, `MAT_DATE_LOCALE = 'pl-PL'`, `MAT_FORM_FIELD_DEFAULT_OPTIONS = { floatLabel: 'always' }`, and `provideMomentDateAdapter(MY_FORMATS)` with Polish moment locale. Date pickers and number formatting follow Polish conventions even when the UI is switched to English; `ngx-translate` toggles only user-visible strings, not locale-aware formatting. Custom date display format is `DD.MM.YYYY`.

**Firebase is wired into that same array — standalone providers, never an NgModule.** Four `@angular/fire` providers sit at the end of `appConfig.providers`: `provideFirebaseApp(() => initializeApp(environment.firebase))` **first**, then `provideAppCheck(...)`, `provideAuth(() => getAuth())`, `provideFirestore(() => getFirestore())`. `@angular/fire`'s own docs default to these standalone idioms, so its snippets drop in as-is — but agents reliably try to scaffold an `AppModule` when wiring Firebase anyway. **Reject that**; there is no NgModule in this app and Firebase does not need one.

The App Check debug-token assignment at the top of `app.config.ts` (`FIREBASE_APPCHECK_DEBUG_TOKEN`, guarded by `!environment.production`) must execute **before** `initializeAppCheck` runs — that is why it sits at module scope rather than inside the provider factory. `@angular/fire` also sets this itself on localhost, so the line is belt-and-braces; keep it, because it makes the mechanism legible instead of buried in a dependency.

**The emulator suite exists as of `S-02`, and `environment.ts` sets `useEmulators: true` — so local development no longer talks to the production project.** `npm run emulators` starts Auth + Firestore + the emulator UI; `npm run test:rules` runs the Firestore rules tests against them. Both need a JDK (21 LTS is what this was set up with). **Local development is now two commands, not one:** the emulators in one terminal, `npm start` in another.

The emulators start empty, so seed one `allowedUsers` document through the emulator UI (`http://localhost:4000/firestore`, document id = your lowercased address, one `role` field) before signing in locally — otherwise `SessionService` refuses the session and the app is unusable. `npm run emulators` imports and exports `.emulator-data/`, which is gitignored: **on a fresh clone create it first (`mkdir .emulator-data`)**, because `--import` fails on a missing directory. Only a clean exit (Ctrl+C) triggers the export.

Flipping `useEmulators` back to `false` returns local development to reading and writing real teacher data — dev and prod share one Firebase project. `provideAppCheck` is skipped entirely while the flag is on.

**The session gate lives in `src/app/auth/`, and `SessionService` is the only source of session truth.** It exposes one `SessionState` signal — `resolving` | `anonymous` | `authorized` | `denied` — and the guards, the sign-in screen, and the header all read it and nothing else. Two thin gateways (`auth.gateway.ts`, `allowlist.gateway.ts`) hold every raw SDK call; that seam exists so the state machine can be unit-tested with fakes, and new Firebase calls belong behind it rather than sprinkled into components.

Three rules learned the hard way in `S-01`, each from a defect a green test suite did not catch:

- **Do not decide anything while the state is `resolving`.** Guards return an observable that waits; deciding early produces a redirect and an immediate bounce back.
- **`signIn()` and `signOut()` do not resolve until the state stops describing the old session.** Firebase settles its own promises independently of the auth stream, so acting on the signal immediately after either call reads a stale answer. This is what makes the post-sign-in and post-sign-out navigations safe.
- **Guards run on activation, not on session change.** Any in-app transition between signed-in and signed-out must navigate explicitly.

Fakes in specs are more obliging than Firebase — model the gaps (a `Subject` that stays silent, a `signOut` that withholds its follow-up emission), or the specs will pass over exactly the windows where bugs live.

**`src/app/templates/` repeats that same seam, and it is the one to copy for the next Firestore feature.** `templates.gateway.ts` holds every `@angular/fire/firestore` call and makes no decisions; `templates.service.ts` holds all of them (list, save, delete, name normalization, duplicate rejection, emptiness, the apply diff) and maps gateway rejections to a small result type instead of leaking Firebase error codes. The service is unit-tested against a fake gateway. **New Firestore calls belong behind a gateway of their own, never inline in a component.** Reads are one-shot `getDocs`, not `collectionData`/`onSnapshot` — Spark's 50K reads/day is the reason, and `allowlist.gateway.ts` records it at its own call site.

**The trimester/semester form's control set is frozen by an exhaustive partition, not by prose.** `src/app/templates/template-domain.ts` declares four disjoint sets — `TEMPLATE_DOMAIN` (the 10 cohort-level controls a template owns), `STUDENT_IDENTITY_FIELDS` (4), `PER_STUDENT_FIELDS` (12), `UNREACHABLE_FIELDS` (22) — and `semestr-report.component.spec.ts` asserts they are pairwise disjoint and that their union equals `Object.keys(form.controls)` exactly. Adding a control to that form, or moving one across the boundary, now fails a test rather than passing quietly. No per-student assessment field is in the template domain on purpose: a template that pre-filled a mark would turn "the teacher missed one select" into "a parent received another child's grade". `S-04`'s student picker is built on those two domains never overlapping, so widening `TEMPLATE_DOMAIN` means updating the partition in the same change.

**UI library mix.** `@angular/material` (datepicker, form-field, table, tabs, expansion, etc.) plus Bootstrap 5 (scss + JS bundle, registered in `angular.json`). For new surfaces, prefer Material; existing report layouts that mix both retain their current stack.

**PDF generation.** Each report component builds a `pdfmake` document definition inline. Large base64-encoded image/banner assets live in `src/app/shared/baner-base64.ts` and `src/app/shared/images-base64.ts` — they are intentionally large files; do not "clean them up." The four report components are large (400–500 lines each) because of the PDF builders; that is by design.

**i18n.** Translations live in `src/assets/i18n/en.json` and `src/assets/i18n/pl.json` and are loaded via `TranslateHttpLoader` (configured in `app.config.ts`). New user-facing strings must go through `ngx-translate` and ship in both files in the same change.

## Folder map

- `src/app/auth/` — the sign-in gate: `session.service.ts` (the `SessionState` signal), `auth.gateway.ts` and `allowlist.gateway.ts` (the only files calling the Firebase SDK), `auth.guard.ts` (`authGuard` + `signInGuard`), and `sign-in/` (the sign-in screen).
- `src/app/templates/` — the FR-009…FR-012 report-template surface: `template-domain.ts` (the four-set partition of the trimester/semester form's controls, plus the domain defaults and `schemaVersion`), `templates.gateway.ts` (the only file calling Firestore for templates), `templates.service.ts` (every decision), `template-panel/` (the panel mounted at the top of the trimester/semester form) and `confirm-dialog/` (the app's only `MatDialog` — generic on purpose, `S-03` reuses it for "delete a student").
- `src/app/shell/` — `ShellComponent`, the signed-in surface: the tab bar plus the `NgComponentOutlet` that mounts the active report.
- `src/app/<feature>-report/` — feature folders per report type: `cambridge-report/`, `semestr-report/` (Polish spelling is intentional, do not "fix"), `teddy-eddie-report/`, `year-report/`. Each owns its standalone component + `pdfmake` builder.
- `src/app/rating-scale/` — `RatingScaleComponent` and a nested `SpecialMarksComponent`, both standalone. The rating-scale surface is reused across report types via direct `imports` in the consuming report component.
- `src/app/shared/` — Angular constructs reused across features: standalone components under `components/` (`button/`, `header/`, `form/`, `UI/tab-group`, `UI/section-title`), reusable form scaffolding under `forms/template/`, static data tables (`exams.ts`, `marks.ts`, `select-values.ts`, `development-path.ts`), `static-data/tab-data.ts` (the tab registry that drives `ShellComponent`), `testing/translate-testing.ts` (shared spec helper, see below), `testing/pdf-fidelity/` (fixtures, the pdfmake interception helper, and the capture harness behind `docs/pdf-fidelity-check.md`), and the base64 image blobs.
- `src/app/helper/` — pure-TypeScript helpers, no Angular decorators. Currently only `cambridge/` lives here; new pure helpers go here, not in `shared/`.
- `src/app/model/` — TypeScript interfaces and types only. No runtime code (`development-path-in-school.ts`, `development-path-teddy-eddie.ts`, `tab.interface.ts`, `auth.interface.ts`).

## Conventions

**Test runner is pinned to Karma + Jasmine.** Spec files live next to their components as `<name>.component.spec.ts`. Do not introduce Jest, Vitest, or Web Test Runner patterns during routine work — a migration is explicit future work, not a side-effect of another change.

**The one non-Karma test suite is `test/rules/`, and it is deliberately kept outside `src/`.** `@firebase/rules-unit-testing` is Node-only, so `npm run test:rules` runs `node --test` under `firebase emulators:exec` on `.mjs` files. Because they sit outside `src/`, Karma, `tsconfig.spec.json` (`src/**/*.spec.ts`) and ESLint (`src/**/*.{ts,html}`) all ignore them — **do not add them to any of those configs**, and do not read this suite as a licence to move `src/` specs off Karma. It is not wired into `npm test` and there is no CI: run it yourself whenever `firestore.rules` changes, before deploying.

**Specs that render a component using `ngx-translate` must import the shared testing helper.** `src/app/shared/testing/translate-testing.ts` exports `translateTestingImports = [TranslateModule.forRoot()]`. Spread it into the spec's `TestBed.configureTestingModule({ imports: [Component, ...translateTestingImports] })` so the `translate` pipe / `TranslateDirective` resolve a `TranslateService` (without it, every spec touching a translate-aware component fails with NG0201). For Material datepicker specs (`DateComponent`, `TeddyEddieFormComponent`) additionally provide `provideNoopAnimations()` + `provideNativeDateAdapter()` — specs intentionally use the native adapter, not the app's moment adapter, because spec assertions don't depend on locale-aware formatting and native has fewer providers to wire.

**Angular CLI is aligned with the framework at 20.3.x.** `@angular/cli@~20.3.x` and `angular-eslint@~20.7.x` move together with `@angular/core@20.3.x`. Do not let `ng update` walk one of these in isolation — bump the whole Angular set as one unit on a dedicated branch.

**Pre-existing `@typescript-eslint/no-explicit-any` errors in PDF builders are known.** `*-report.component.ts` files carry `any` types around `pdfmake` doc-definition construction. The `eslint.config.js` has `@typescript-eslint/no-explicit-any: 'off'` so these don't fail lint. Do not add new `any` in new code; do not block work on refactoring legacy `any` unless the task is explicitly about typing the PDF builders.

**ESLint must be clean before merging.** `npm run lint` exits 0 on `master`; that is a maintained invariant. Run `npm run lint` locally before pushing — there is no CI gate yet.

The 9 errors this section used to record in `src/app/year-report/year-report.component.ts` were cleared in a dedicated change on 2026-07-20, and lint has been clean since. The reason they needed a dedicated change is still the operative rule: that file is under the PDF-fidelity guardrail, so clearing lint errors inside a `*-report.component.ts` carries a before/after PDF check and is never a drive-by during unrelated work. The reason they survived for over a month is also still true — nothing runs the linter between commits. A CI lint gate is now unblocked but still absent (`.github/` does not exist); see `context/foundation/health-check.md`.

**For subscription cleanup, use `takeUntil`, `async` pipe, or `destroyRef` — pick one per file.** Material modules and `ngx-translate` observables are the usual culprits.

**The style layer has two halves, and `docs/design-language.md` is the authority on both.** Read it before adding any component SCSS.

- `src/assets/styles/utils/` holds **tokens** — `_colors.scss`, `_typography.scss`, `_spacing.scss`, `_breakpoints.scss`, `_radius.scss`, `_elevation.scss`, plus the global `_reset.scss`, all barrelled via `index.scss`. Reach them with `@use ".../assets/styles/utils/index" as ds`.
- `src/assets/styles/patterns/` holds **composite mixins** — `card-surface`, `data-table-cells`, `data-table-empty-cell`, `section-tile`, `form-row`, `form-col`. Do not `@use` that directory directly: `src/assets/styles/mixins.scss` forwards it, so every existing `@use ".../assets/styles/mixins"` path keeps resolving. There is no `patterns/index.scss`.

New component SCSS must `@use` these instead of hardcoding hex colours, px font sizes, breakpoint widths, corner radii, or box-shadows — tokens now exist for all six. `src/app/teddy-eddie-report/tables/teddy-eddie-table/teddy-eddie-table.component.scss` is the compact example of consuming both halves.

**`data-table-cells` must be included inside a scoping selector, never at stylesheet root.** It emits an `::ng-deep` block, which at root escapes component encapsulation and overrides every Material table in the app.

Three root-level `::ng-deep` blocks do escape today, and all three are **deliberately retained, not oversights** — each carries a comment at its site saying so. `semestr-report.component.scss:66` and `year-report.component.scss:105` declare `.mat-mdc-row { height: 38px !important }`; they are the only source of the Teddy Eddie tables' row height, so deleting them would grow the reference tab's rows to Material's ~52px default. `date.component.scss:5-7` sets `.mat-mdc-form-field-flex { height: 36px }` for every Material form field in the app. Removing any of them is a visual change to surfaces far from the file it lives in — do not do it as a drive-by. See `docs/design-language.md` §3.

**Form fields go through the shared wrappers, never a raw `mat-form-field`:** `app-input-text`, `app-textarea`, `app-select`, `app-date`, with `app-form-wrapper` / `app-section-title` for section headings and `app-button` for actions. All four report forms compose them; `docs/design-language.md` §4 is the picking guide and lists every input.

**The one exception is a control inside a Material table cell**, which uses a raw `<mat-form-field class="cell-field">`. The `data-table-cells` mixin styles `.cell-field` for exactly that case — the wrappers render their own label and error subscript, which a 38px table row cannot fit. Four tables do this: both Teddy Eddie tables and the year-end detail and development-path tables. Two traps it documents: a button inside a `<form>` must pass `[type]` (`app-button` defaults to an invalid value that HTML resolves to *submit*), and `app-input-text` spells its `type="number"` branch out separately because Angular's `NumberValueAccessor` only matches a static attribute.

The Teddy Eddie report is the styling reference for which tokens get used together. Its **tables** are the pattern to copy for new Material tables. The three older report types (Cambridge, semester/trimester, year-end) now compose the same language on their **forms** — `S-05b` converted them — so they are safe to read for the form-row / form-col layout idiom. What is still not a model there is anything outside those forms.

**Configuration lives in `src/environments/`, and the three files there have distinct jobs.** `environment.ts` (dev, `production: false`) and `environment.prod.ts` (`production: true`) each export a const named `environment`; both hold the Firebase SDK config, the reCAPTCHA site key, and the `useEmulators` flag. `environment.model.ts` exports the `Environment` interface that both files type themselves against.

Three rules govern this, and each exists because breaking it fails silently:

- **`environment.model.ts` must never be merged into either environment file.** `fileReplacements` in `angular.json` swaps `environment.ts` for `environment.prod.ts` on production builds — so the prod file *becomes* `environment.ts`, and an import between the two would resolve to the module itself. A third, never-replaced file is the only arrangement that gives them a shared compile-time contract. Without it, file replacement offers no guarantee whatsoever that the replacement matches the original's shape.
- **`npm run build` type-checks only the prod file.** `angular.json` sets `defaultConfiguration: "production"`, so a plain build applies `fileReplacements` and compiles `environment.prod.ts` alone; with `tsconfig.app.json` using `files: ["src/main.ts"]`, nothing else pulls `environment.ts` into a type-check. An error in the dev file survives every default gate. Run `npm run build -- --configuration development` to check it.
- **The Firebase config values and the reCAPTCHA site key are public by design.** They ship inside the SPA bundle and are visible to every visitor. Do not "fix" them into a secret store, a `.env`, or CI secrets. Firestore security rules, not key secrecy, are what protect the data. Dev and prod share one Firebase project, so the Firebase and reCAPTCHA values are identical in both files; `useEmulators` is the one value that genuinely differs, and it is why the seam exists.

**Build output is `dist/browser`.** `angular.json` sets `outputPath: { base: "dist" }` and `@angular/build:application` appends the `browser` subdirectory. `firebase.json` points `hosting.public` at `dist/browser`, so the two are aligned — **do not "fix" either one in isolation.** If you ever change `outputPath`, change `hosting.public` in the same commit; otherwise `firebase deploy` cheerfully publishes an empty directory over the live site and exits 0. Gate deploys on `ls dist/browser/index.html` after building.

## Context directory

`context/foundation/` holds load-bearing project documents written by the 10xDevs toolkit chain: `prd.md`, `stack-assessment.md`, `health-check.md`. Read these when scoping a non-trivial change — they capture decisions and guardrails that are not derivable from the code alone. Never write to `context/archive/`.
