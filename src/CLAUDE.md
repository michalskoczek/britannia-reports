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
npm run lint                                               # ESLint over **/*.ts and **/*.html
npm run lint -- --fix                                      # auto-fix what is auto-fixable
npx firebase deploy --only hosting                         # deploy (requires `npm run build` first; public = dist/browser)
```

Running a single spec: `npm test -- --include='**/teddy-eddie-form.component.spec.ts' --watch=false --browsers=ChromeHeadless`.

## Architecture

**Standalone-only.** There are no NgModules in `src/app/`. The app bootstraps via `src/app/app.config.ts` (the `appConfig: ApplicationConfig` export) with `bootstrapApplication` in `src/main.ts`. Every component — `AppComponent`, the four report components, shared form components, and the rating-scale surface — is `standalone: true` with its own `imports` array. New components must be standalone; do not introduce an NgModule.

**Composition is `NgComponentOutlet` against `TabData.tabs`.** `AppComponent` (`src/app/app.component.ts`) renders a `TabGroupComponent` plus an `<ng-component-outlet>` that swaps in the active tab's feature component. `TabData.tabs` in `src/app/shared/static-data/tab-data.ts` is the registry — adding a new report type means adding an entry there (with the report's standalone component class) and the new feature folder. There is no Angular Router.

**Global providers live in `app.config.ts`.** That single file wires `provideHttpClient()`, `provideTranslateService({ ... loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }) })` (the new `@ngx-translate/core@17` API — no `TranslateModule.forRoot()` at runtime), `LOCALE_ID = 'pl-PL'`, `MAT_DATE_LOCALE = 'pl-PL'`, `MAT_FORM_FIELD_DEFAULT_OPTIONS = { floatLabel: 'always' }`, and `provideMomentDateAdapter(MY_FORMATS)` with Polish moment locale. Date pickers and number formatting follow Polish conventions even when the UI is switched to English; `ngx-translate` toggles only user-visible strings, not locale-aware formatting. Custom date display format is `DD.MM.YYYY`.

**Firebase is wired into that same array — standalone providers, never an NgModule.** Four `@angular/fire` providers sit at the end of `appConfig.providers`: `provideFirebaseApp(() => initializeApp(environment.firebase))` **first**, then `provideAppCheck(...)`, `provideAuth(() => getAuth())`, `provideFirestore(() => getFirestore())`. `@angular/fire`'s own docs default to these standalone idioms, so its snippets drop in as-is — but agents reliably try to scaffold an `AppModule` when wiring Firebase anyway. **Reject that**; there is no NgModule in this app and Firebase does not need one.

The App Check debug-token assignment at the top of `app.config.ts` (`FIREBASE_APPCHECK_DEBUG_TOKEN`, guarded by `!environment.production`) must execute **before** `initializeAppCheck` runs — that is why it sits at module scope rather than inside the provider factory. `@angular/fire` also sets this itself on localhost, so the line is belt-and-braces; keep it, because it makes the mechanism legible instead of buried in a dependency.

**There is no emulator suite.** No `emulators` block in `firebase.json`, no `connect*Emulator` calls, no `useEmulators` flag — so `npm start` is a single command. This is deliberate for now, but it means local development talks to the **production** Firebase project. That is harmless only while Firestore is empty under deny-all rules. The first change that adds a real collection must stand up the emulator suite and a rules-testing harness first — see `context/foundation/infrastructure.md` → Getting Started step 4.

**UI library mix.** `@angular/material` (datepicker, form-field, table, tabs, expansion, etc.) plus Bootstrap 5 (scss + JS bundle, registered in `angular.json`). For new surfaces, prefer Material; existing report layouts that mix both retain their current stack.

**PDF generation.** Each report component builds a `pdfmake` document definition inline. Large base64-encoded image/banner assets live in `src/app/shared/baner-base64.ts` and `src/app/shared/images-base64.ts` — they are intentionally large files; do not "clean them up." The four report components are large (400–500 lines each) because of the PDF builders; that is by design.

**i18n.** Translations live in `src/assets/i18n/en.json` and `src/assets/i18n/pl.json` and are loaded via `TranslateHttpLoader` (configured in `app.config.ts`). New user-facing strings must go through `ngx-translate` and ship in both files in the same change.

## Folder map

- `src/app/<feature>-report/` — feature folders per report type: `cambridge-report/`, `semestr-report/` (Polish spelling is intentional, do not "fix"), `teddy-eddie-report/`, `year-report/`. Each owns its standalone component + `pdfmake` builder.
- `src/app/rating-scale/` — `RatingScaleComponent` and a nested `SpecialMarksComponent`, both standalone. The rating-scale surface is reused across report types via direct `imports` in the consuming report component.
- `src/app/shared/` — Angular constructs reused across features: standalone components under `components/` (`button/`, `header/`, `form/`, `UI/tab-group`, `UI/section-title`), reusable form scaffolding under `forms/template/`, static data tables (`exams.ts`, `marks.ts`, `select-values.ts`, `development-path.ts`), `static-data/tab-data.ts` (the tab registry that drives `AppComponent`), `testing/translate-testing.ts` (shared spec helper, see below), `testing/pdf-fidelity/` (fixtures, the pdfmake interception helper, and the capture harness behind `docs/pdf-fidelity-check.md`), and the base64 image blobs.
- `src/app/helper/` — pure-TypeScript helpers, no Angular decorators. Currently only `cambridge/` lives here; new pure helpers go here, not in `shared/`.
- `src/app/model/` — TypeScript interfaces and types only. No runtime code (`development-path-in-school.ts`, `development-path-teddy-eddie.ts`, `tab.interface.ts`).

## Conventions

**Test runner is pinned to Karma + Jasmine.** Spec files live next to their components as `<name>.component.spec.ts`. Do not introduce Jest, Vitest, or Web Test Runner patterns during routine work — a migration is explicit future work, not a side-effect of another change.

**Specs that render a component using `ngx-translate` must import the shared testing helper.** `src/app/shared/testing/translate-testing.ts` exports `translateTestingImports = [TranslateModule.forRoot()]`. Spread it into the spec's `TestBed.configureTestingModule({ imports: [Component, ...translateTestingImports] })` so the `translate` pipe / `TranslateDirective` resolve a `TranslateService` (without it, every spec touching a translate-aware component fails with NG0201). For Material datepicker specs (`DateComponent`, `TeddyEddieFormComponent`) additionally provide `provideNoopAnimations()` + `provideNativeDateAdapter()` — specs intentionally use the native adapter, not the app's moment adapter, because spec assertions don't depend on locale-aware formatting and native has fewer providers to wire.

**Angular CLI is aligned with the framework at 20.3.x.** `@angular/cli@~20.3.x` and `angular-eslint@~20.7.x` move together with `@angular/core@20.3.x`. Do not let `ng update` walk one of these in isolation — bump the whole Angular set as one unit on a dedicated branch.

**Pre-existing `@typescript-eslint/no-explicit-any` errors in PDF builders are known.** `*-report.component.ts` files carry `any` types around `pdfmake` doc-definition construction. The `eslint.config.js` has `@typescript-eslint/no-explicit-any: 'off'` so these don't fail lint. Do not add new `any` in new code; do not block work on refactoring legacy `any` unless the task is explicitly about typing the PDF builders.

**ESLint must be clean before merging.** `npm run lint` exits 0 on `master`; that is a maintained invariant. Run `npm run lint` locally before pushing — there is no CI gate yet.

As of 2026-07-10, `dev` does **not** satisfy this: 9 errors in `src/app/year-report/year-report.component.ts` (`prefer-const`, `no-inferrable-types`, an unused `Validators` import). All are cosmetic and 8 are `--fix`-able, but the file is under the PDF-fidelity guardrail, so clear them in a dedicated change with a before/after PDF check — not as a drive-by during unrelated work. Do not add a CI lint gate until this is cleared.

**For subscription cleanup, use `takeUntil`, `async` pipe, or `destroyRef` — pick one per file.** Material modules and `ngx-translate` observables are the usual culprits.

**The style layer has two halves, and `docs/design-language.md` is the authority on both.** Read it before adding any component SCSS.

- `src/assets/styles/utils/` holds **tokens** — `_colors.scss`, `_typography.scss`, `_spacing.scss`, `_breakpoints.scss`, `_radius.scss`, `_elevation.scss`, plus the global `_reset.scss`, all barrelled via `index.scss`. Reach them with `@use ".../assets/styles/utils/index" as ds`.
- `src/assets/styles/patterns/` holds **composite mixins** — `card-surface`, `data-table-cells`, `data-table-empty-cell`, `section-tile`. Do not `@use` that directory directly: `src/assets/styles/mixins.scss` forwards it, so every existing `@use ".../assets/styles/mixins"` path keeps resolving. There is no `patterns/index.scss`.

New component SCSS must `@use` these instead of hardcoding hex colours, px font sizes, breakpoint widths, corner radii, or box-shadows — tokens now exist for all six. `src/app/teddy-eddie-report/tables/teddy-eddie-table/teddy-eddie-table.component.scss` is the compact example of consuming both halves.

**`data-table-cells` must be included inside a scoping selector, never at stylesheet root.** It emits an `::ng-deep` block, which at root escapes component encapsulation and overrides every Material table in the app. `semestr-report.component.scss:21` and `year-report.component.scss:98` already do this by accident — that is where the Teddy Eddie tables' row height actually comes from.

The Teddy Eddie report is the styling reference for which tokens get used together; the older report types (Cambridge, semester/trimester, year-end) reflect earlier visual iterations and are not the reference, so do not copy their styling into new work.

**Configuration lives in `src/environments/`, and the three files there have distinct jobs.** `environment.ts` (dev, `production: false`) and `environment.prod.ts` (`production: true`) each export a const named `environment`; both hold the Firebase SDK config and the reCAPTCHA site key. `environment.model.ts` exports the `Environment` interface that both files type themselves against.

Three rules govern this, and each exists because breaking it fails silently:

- **`environment.model.ts` must never be merged into either environment file.** `fileReplacements` in `angular.json` swaps `environment.ts` for `environment.prod.ts` on production builds — so the prod file *becomes* `environment.ts`, and an import between the two would resolve to the module itself. A third, never-replaced file is the only arrangement that gives them a shared compile-time contract. Without it, file replacement offers no guarantee whatsoever that the replacement matches the original's shape.
- **`npm run build` type-checks only the prod file.** `angular.json` sets `defaultConfiguration: "production"`, so a plain build applies `fileReplacements` and compiles `environment.prod.ts` alone; with `tsconfig.app.json` using `files: ["src/main.ts"]`, nothing else pulls `environment.ts` into a type-check. An error in the dev file survives every default gate. Run `npm run build -- --configuration development` to check it.
- **The Firebase config values and the reCAPTCHA site key are public by design.** They ship inside the SPA bundle and are visible to every visitor. Do not "fix" them into a secret store, a `.env`, or CI secrets. Firestore security rules, not key secrecy, are what protect the data. Dev and prod share one Firebase project, so these values are currently identical in both files — the seam exists for the first value that genuinely differs.

**Build output is `dist/browser`.** `angular.json` sets `outputPath: { base: "dist" }` and `@angular/build:application` appends the `browser` subdirectory. `firebase.json` points `hosting.public` at `dist/browser`, so the two are aligned — **do not "fix" either one in isolation.** If you ever change `outputPath`, change `hosting.public` in the same commit; otherwise `firebase deploy` cheerfully publishes an empty directory over the live site and exits 0. Gate deploys on `ls dist/browser/index.html` after building.

## Context directory

`context/foundation/` holds load-bearing project documents written by the 10xDevs toolkit chain: `prd.md`, `stack-assessment.md`, `health-check.md`. Read these when scoping a non-trivial change — they capture decisions and guardrails that are not derivable from the code alone. Never write to `context/archive/`.
