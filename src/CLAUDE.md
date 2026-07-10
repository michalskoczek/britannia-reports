# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. The root `CLAUDE.md` is a brief redirect plus 10xDevs toolkit content — all project conventions live here.

## Hard rules

**PDF fidelity is a hard guardrail.** The four existing report types must produce visually identical PDFs before and after any change. When touching a `*-report.component.ts` file, do not modify the `pdfmake` document definition or its inputs unless the task explicitly requires it. When in doubt, generate a PDF before and after with identical form inputs and compare visually.

## Project

Britannia Reports is an Angular 20 single-page app that generates end-of-term and exam reports as PDFs for a language school. Each report type (Cambridge, semester/trimester, Teddy Eddie, year-end) has its own feature folder and produces a `pdfmake` document from a Reactive Forms data entry surface. UI is bilingual (PL/EN) via `ngx-translate`.

## Common commands

```bash
npm start                                                  # ng serve on http://localhost:4200
npm run build                                              # production build → dist/britannia-reports/browser
npm run watch                                              # dev build with --watch
npm test                                                   # Karma + Jasmine, interactive (launches Chrome)
npm test -- --watch=false --browsers=ChromeHeadless        # headless single-run (use in CI / for verification)
npm run lint                                               # ESLint over **/*.ts and **/*.html
npm run lint -- --fix                                      # auto-fix what is auto-fixable
npx firebase deploy --only hosting                         # deploy (requires `npm run build` first; public = dist/browser)
```

Running a single spec: `npm test -- --include='**/teddy-eddie-form.component.spec.ts' --watch=false --browsers=ChromeHeadless`.

## Architecture

**Standalone-only.** There are no NgModules in `src/app/`. The app bootstraps via `src/app/app.config.ts` (the `appConfig: ApplicationConfig` export) with `bootstrapApplication` in `src/main.ts`. Every component — `AppComponent`, the four report components, shared form components, and the rating-scale surface — is `standalone: true` with its own `imports` array. New components must be standalone; do not introduce an NgModule.

**Composition is `NgComponentOutlet` against `TabData.tabs`.** `AppComponent` (`src/app/app.component.ts`) renders a `TabGroupComponent` plus an `<ng-component-outlet>` that swaps in the active tab's feature component. `TabData.tabs` in `src/app/shared/static-data/tab-data.ts` is the registry — adding a new report type means adding an entry there (with the report's standalone component class) and the new feature folder. There is no Angular Router.

**Global providers live in `app.config.ts`.** That single file wires `provideHttpClient()`, `provideTranslateService({ ... loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }) })` (the new `@ngx-translate/core@17` API — no `TranslateModule.forRoot()` at runtime), `LOCALE_ID = 'pl-PL'`, `MAT_DATE_LOCALE = 'pl-PL'`, `MAT_FORM_FIELD_DEFAULT_OPTIONS = { floatLabel: 'always' }`, and `provideMomentDateAdapter(MY_FORMATS)` with Polish moment locale. Date pickers and number formatting follow Polish conventions even when the UI is switched to English; `ngx-translate` toggles only user-visible strings, not locale-aware formatting. Custom date display format is `DD.MM.YYYY`.

**UI library mix.** `@angular/material` (datepicker, form-field, table, tabs, expansion, etc.) plus Bootstrap 5 (scss + JS bundle, registered in `angular.json`). For new surfaces, prefer Material; existing report layouts that mix both retain their current stack.

**PDF generation.** Each report component builds a `pdfmake` document definition inline. Large base64-encoded image/banner assets live in `src/app/shared/baner-base64.ts` and `src/app/shared/images-base64.ts` — they are intentionally large files; do not "clean them up." The four report components are large (400–500 lines each) because of the PDF builders; that is by design.

**i18n.** Translations live in `src/assets/i18n/en.json` and `src/assets/i18n/pl.json` and are loaded via `TranslateHttpLoader` (configured in `app.config.ts`). New user-facing strings must go through `ngx-translate` and ship in both files in the same change.

## Folder map

- `src/app/<feature>-report/` — feature folders per report type: `cambridge-report/`, `semestr-report/` (Polish spelling is intentional, do not "fix"), `teddy-eddie-report/`, `year-report/`. Each owns its standalone component + `pdfmake` builder.
- `src/app/rating-scale/` — `RatingScaleComponent` and a nested `SpecialMarksComponent`, both standalone. The rating-scale surface is reused across report types via direct `imports` in the consuming report component.
- `src/app/shared/` — Angular constructs reused across features: standalone components under `components/` (`button/`, `header/`, `form/`, `UI/tab-group`, `UI/section-title`), reusable form scaffolding under `forms/template/`, static data tables (`exams.ts`, `marks.ts`, `select-values.ts`, `development-path.ts`), `static-data/tab-data.ts` (the tab registry that drives `AppComponent`), `testing/translate-testing.ts` (shared spec helper, see below), and the base64 image blobs.
- `src/app/helper/` — pure-TypeScript helpers, no Angular decorators. Currently only `cambridge/` lives here; new pure helpers go here, not in `shared/`.
- `src/app/model/` — TypeScript interfaces and types only. No runtime code (`development-path-in-school.ts`, `development-path-teddy-eddie.ts`, `tab.interface.ts`).

## Conventions

**Test runner is pinned to Karma + Jasmine.** Spec files live next to their components as `<name>.component.spec.ts`. Do not introduce Jest, Vitest, or Web Test Runner patterns during routine work — a migration is explicit future work, not a side-effect of another change.

**Specs that render a component using `ngx-translate` must import the shared testing helper.** `src/app/shared/testing/translate-testing.ts` exports `translateTestingImports = [TranslateModule.forRoot()]`. Spread it into the spec's `TestBed.configureTestingModule({ imports: [Component, ...translateTestingImports] })` so the `translate` pipe / `TranslateDirective` resolve a `TranslateService` (without it, every spec touching a translate-aware component fails with NG0201). For Material datepicker specs (`DateComponent`, `TeddyEddieFormComponent`) additionally provide `provideNoopAnimations()` + `provideNativeDateAdapter()` — specs intentionally use the native adapter, not the app's moment adapter, because spec assertions don't depend on locale-aware formatting and native has fewer providers to wire.

**Angular CLI is aligned with the framework at 20.3.x.** `@angular/cli@~20.3.x` and `angular-eslint@~20.7.x` move together with `@angular/core@20.3.x`. Do not let `ng update` walk one of these in isolation — bump the whole Angular set as one unit on a dedicated branch.

**Pre-existing `@typescript-eslint/no-explicit-any` errors in PDF builders are known.** `*-report.component.ts` files carry `any` types around `pdfmake` doc-definition construction. The `eslint.config.js` has `@typescript-eslint/no-explicit-any: 'off'` so these don't fail lint. Do not add new `any` in new code; do not block work on refactoring legacy `any` unless the task is explicitly about typing the PDF builders.

**ESLint must be clean before merging.** `npm run lint` exits 0 on `master` today; that is a maintained invariant. Run `ng lint` locally before pushing — there is no CI gate yet.

**For subscription cleanup, use `takeUntil`, `async` pipe, or `destroyRef` — pick one per file.** Material modules and `ngx-translate` observables are the usual culprits.

**Design tokens live in `src/assets/styles/utils/`** (`_colors.scss`, `_typography.scss`, `_spacing.scss`, `_breakpoints.scss`, barrelled via `index.scss`; plus `src/assets/styles/mixins.scss`). New component SCSS must `@use` these tokens (see `src/app/teddy-eddie-report/teddy-eddie-form/teddy-eddie-form.component.scss` for the pattern) — do not hardcode hex colours, px font sizes, or breakpoint widths. The Teddy Eddie report is the styling reference for which tokens get used together; the older report types (Cambridge, semester/trimester, year-end) reflect earlier visual iterations and are not the reference, so do not copy their styling into new work.

**Build output is `dist/britannia-reports/browser`** (Angular 17+ application builder). `firebase.json` points `hosting.public` at `dist/browser` — confirm the path after `ng build` if deploying.

## Context directory

`context/foundation/` holds load-bearing project documents written by the 10xDevs toolkit chain: `prd.md`, `stack-assessment.md`, `health-check.md`. Read these when scoping a non-trivial change — they capture decisions and guardrails that are not derivable from the code alone. Never write to `context/archive/`.
