# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Hard rules

**PDF fidelity is a hard guardrail.** The four existing report types must produce visually identical PDFs before and after any change. When touching a `*-report.component.ts` file, do not modify the `pdfmake` document definition or its inputs unless the task explicitly requires it. When in doubt, generate a PDF before and after with identical form inputs and compare visually.

## Project

Britannia Reports is an Angular 19 single-page app that generates end-of-term and exam reports as PDFs for a language school. Each report type (Cambridge, semester/trimester, Teddy Eddie, year-end) has its own feature folder and produces a `pdfmake` document from a Reactive Forms data entry surface. UI is bilingual (PL/EN) via `ngx-translate`.

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

**Module model is hybrid.** `src/app/app.module.ts` is the only NgModule. Older report components (`AppComponent`, `YearReportComponent`, `SemestrReportComponent`, `CambridgeReportComponent`) are declared in `AppModule.declarations`; newer surfaces under `src/app/shared/components/` and `TeddyEddieFormComponent` are standalone components consumed via `AppModule.imports`. New shared components should be standalone; existing report components stay in `declarations` — do not refactor them to standalone in the same change that does anything else (PDF-fidelity risk, see below).

**Locale is hardcoded to `pl-PL`** at the module level (`LOCALE_ID` and `MAT_DATE_LOCALE`). Date pickers and number formatting follow Polish conventions even when the UI is switched to English. `ngx-translate` toggles only user-visible strings, not locale-aware formatting.

**UI library mix.** `@angular/material` (datepicker, form-field, table, tabs, expansion, etc.) plus Bootstrap 5 (scss + JS bundle, registered in `angular.json`). Material is configured globally with `floatLabel: 'always'` on form fields. For new surfaces, prefer Material; existing report layouts that mix both retain their current stack.

**PDF generation.** Each report component builds a `pdfmake` document definition inline. Large base64-encoded image/banner assets live in `src/app/shared/baner-base64.ts` and `src/app/shared/images-base64.ts` — they are intentionally large files; do not "clean them up." The four report components are large (400–500 lines each) because of the PDF builders; that is by design.

**i18n.** Translations live in `src/assets/i18n/en.json` and `src/assets/i18n/pl.json` and are loaded via `TranslateHttpLoader`. New user-facing strings must go through `ngx-translate` and ship in both files in the same change.

## Folder map

- `src/app/<feature>-report/` — feature folders per report type: `cambridge-report/`, `semestr-report/` (Polish spelling is intentional, do not "fix"), `teddy-eddie-report/`, `year-report/`. Each owns its component + `pdfmake` builder.
- `src/app/rating-scale/` — its own NgModule (`RatingScaleModule`) plus a nested `special-marks/` NgModule. Imported by `AppModule`. The rating-scale surface is reused across report types.
- `src/app/shared/` — Angular constructs reused across features: standalone components under `components/` (`button/`, `header/`, `form/`, `UI/tab-group`, `UI/section-title`), reusable form scaffolding under `forms/template/`, static data tables (`exams.ts`, `marks.ts`, `select-values.ts`, `development-path.ts`), and the base64 image blobs.
- `src/app/helper/` — pure-TypeScript helpers, no Angular decorators. Currently only `cambridge/` lives here; new pure helpers go here, not in `shared/`.
- `src/app/model/` — TypeScript interfaces and types only. No runtime code (`development-path-in-school.ts`, `development-path-teddy-eddie.ts`, `tab.interface.ts`).

## Conventions

**Test runner is pinned to Karma + Jasmine.** Spec files live next to their components as `<name>.component.spec.ts`. Do not introduce Jest, Vitest, or Web Test Runner patterns during routine work — a migration is explicit future work, not a side-effect of another change.

**Angular CLI is pinned to 19.x to match the framework.** `@angular/cli@~19.2.26` and `angular-eslint@~19.8.1` are aligned. Do not let `ng update` walk the CLI to 21 in isolation — it would generate standalone-only components with `@if`/`@for` control-flow syntax that does not match the codebase.

**Pre-existing `@typescript-eslint/no-explicit-any` errors in PDF builders are known.** `*-report.component.ts` files carry `any` types around `pdfmake` doc-definition construction. Do not add new `any` in new code; do not block work on refactoring legacy `any` unless the task is explicitly about typing the PDF builders.

**Component subscriptions clean up on destroy.** Use `takeUntil`, `async` pipe, or `destroyRef` — pick one per file consistently. Material modules and `ngx-translate` observables are the usual culprits.

**Styling baseline is the Teddy Eddie report.** When introducing new components or updating visual surfaces, match the colour palette and form-element styling used in `src/app/teddy-eddie-report/` — that surface carries the most current design direction. The older report types (Cambridge, semester/trimester, year-end) reflect earlier visual iterations and are not the reference; do not propagate their styling into new work.

**Build output is `dist/britannia-reports/browser`** (Angular 17+ application builder). `firebase.json` points `hosting.public` at `dist/browser` — confirm the path after `ng build` if deploying.

## Context directory

`context/foundation/` holds load-bearing project documents written by the 10xDevs toolkit chain: `prd.md`, `stack-assessment.md`, `health-check.md`. Read these when scoping a non-trivial change — they capture decisions and guardrails that are not derivable from the code alone. Never write to `context/archive/`.
