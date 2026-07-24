# PDF Fidelity Baseline Implementation Plan

## Overview

Build the regression barrier that guards the PRD's hardest guardrail — "all four report types continue to produce PDFs a reader would consider visually equivalent" — and then run the first real change through it.

The barrier has three layers:

1. **Reference form inputs** — typed fixture modules, two per report type (minimal and maximal), that drive each component's own array-building methods and then patch the form.
2. **Smoke coverage** — a spec per report type that captures the `pdfmake` document definition and renders it for real, asserting a non-empty PDF and no exception.
3. **Reference PDFs and a written procedure** — a capture harness that generates PDFs from the fixtures, two committed reference PDFs for the trimester/semester form, and `docs/pdf-fidelity-check.md` as the runbook that `src/CLAUDE.md` points at.

Phase 3 then applies an explicit `pl-PL` locale to the five date-formatting call sites and validates it through the procedure built in phase 2 — proving the barrier works on a real change without expanding scope into unrelated cleanup.

This is roadmap item **F-02**, a foundation with no prerequisites. It unlocks `S-01` (sign-in gating touches all four forms) and `S-02` (template apply writes into the trimester/semester form's state).

## Current State Analysis

**Four report components, one shared shape.** `semestr-report`, `year-report`, `cambridge-report`, and `teddy-eddie-report` each own a standalone component that builds a `pdfmake` document definition inline and ends with the same call:

- `src/app/semestr-report/semestr-report.component.ts:569`
- `src/app/year-report/year-report.component.ts:474`
- `src/app/cambridge-report/cambridge-report.component.ts:429`
- `src/app/teddy-eddie-report/teddy-eddie-report.component.ts:334`

All four are `pdfMake.createPdf(docDefinition).download(fileName)`. There is no seam, no shared builder, and no test coverage of any of them — the repo's five existing specs cover shared form controls only.

**No barrier exists today.** `src/CLAUDE.md` declares PDF fidelity a hard rule and prescribes "generate a PDF before and after with identical form inputs and compare visually", but there are no recorded inputs and no reference outputs, so the instruction has nothing to compare against. That is precisely the gap F-02 closes.

**pdfmake 0.3.9 is promise-based and the app ignores it.** `node_modules/pdfmake/src/browser-extensions/OutputDocumentBrowser.js:32` defines `download()` as `async`; all four components call it without `await` and without `catch`. A document definition that cannot render therefore produces a **silent unhandled rejection** — the teacher clicks "Generate", nothing downloads, and nothing is logged. The definitions are `any`-typed throughout (`eslint.config.js` disables `no-explicit-any` for exactly this reason), so malformed `colSpan` counts, missing filler cells, or a corrupt base64 image are all reachable and all invisible.

**Form state is not reconstructible by `patchValue` alone.** Three of the four components grow `FormArray`s through user interaction, and each does it differently:

- `cambridge-report.component.ts:153` `addNextComment()` and `:175` `addNextExamTerm(nameOfArray)` push comment controls and `{ date, score, result }` exam rows.
- `year-report.component.ts:131` `initClassesFromFirstSelectedClass(classValue)` clears and rebuilds `developmentLanguageSkillsArray`, deriving `schoolYear`, `classInSchool`, and `schoolExam` as **disabled** controls from the selected class.
- `teddy-eddie-report.component.ts:86` builds `teddyEddieArray` and `developmentLanguageSkillsArray` from the selected age, also with disabled derived controls.

**The trimester/semester form's fourteen `FormArray`s are dead.** `semestr-report.component.html` contains no `formArrayName` binding anywhere, so `comments`, `recommendations`, and the twelve exam-level arrays declared at `semestr-report.component.ts:705-730` can never be populated through the UI. `generatePDF` builds `commentsArray` and `recommendationsArray` from them at `:241-245` and then never references either in the document definition. This is inherited scaffolding, and it constrains fixture design: a faithful maximal fixture must leave those arrays empty, because no user can fill them.

**Date formatting is locale-dependent in five places.** Every call is `new Date(...).toLocaleDateString()` with no locale argument, which resolves against the browser's default locale rather than the app's `LOCALE_ID = 'pl-PL'`:

- `semestr-report.component.ts:239`, `cambridge-report.component.ts:192`, `teddy-eddie-report.component.ts:208`, `year-report.component.ts:276`, and `helper/cambridge/static-function/generate-table.ts:12`.

The same form input therefore produces a different PDF on a machine with a different system locale, which makes any reference PDF conditional on the environment that produced it.

**Test infrastructure is Karma + Jasmine, pinned.** `angular.json:125` uses `@angular/build:karma`, whose schema supports both `include` and `exclude` — the mechanism phase 2 relies on to keep the capture harness out of the default run. `npm run lint` currently exits 0 on this branch. `src/app/shared/testing/translate-testing.ts` is the established pattern for a non-spec test helper imported by specs, which is why fixtures can be `.ts` modules: `resolveJsonModule` is not enabled in `tsconfig.json`, so JSON fixtures would not compile.

## Desired End State

A developer about to touch any report component can:

1. Run `npm test` and see eight smoke cases confirm every report type still renders a PDF from recorded inputs.
2. Open `docs/pdf-fidelity-check.md` and follow a numbered procedure to produce "before" and "after" PDFs for any report type from the same recorded inputs.
3. Compare the trimester/semester output against two PDFs committed in the repository, without needing to reconstruct anything.
4. Read `src/CLAUDE.md` and be pointed at that procedure by the hard rule that currently only says "compare visually".

Verification: `npm test -- --watch=false --browsers=ChromeHeadless` is green with the new smoke cases; `npm run test:capture` writes eight PDFs; `docs/pdf-fidelity/reference/` holds `semestr-minimal.pdf` and `semestr-maximal.pdf`; the five date call sites read `toLocaleDateString('pl-PL')` and the trimester/semester PDFs produced after that change are visually identical to the committed references.

### Key Discoveries

- `pdfMake` is a mutable module object — every component already mutates it (`pdfMake.vfs = pdfFonts.vfs`, e.g. `semestr-report.component.ts:51`). A spec can therefore `spyOn(pdfMake, 'createPdf')` to intercept the document definition and suppress the real `.download()`, then call the saved original to render. **No production code needs a seam.**
- `.download()` routes through `file-saver`'s `saveAs` (`OutputDocumentBrowser.js:34`), so an unstubbed smoke test would trigger real browser downloads under Karma. Interception is mandatory, not stylistic.
- `getBlob()` returns `Promise<Blob>` (`OutputDocumentBrowser.js:23`), so smoke specs are plain `async` Jasmine specs.
- `year-report.component.ts:338` reads `form.getRawValue()`, and its generated rows carry disabled controls — fixtures must be written against raw-value semantics, and `patchValue` silently skips disabled controls, which is correct here because those values are derived, not authored.
- Angular's karma builder accepts a per-target `configurations` block, which gives the capture harness a declarative on/off switch instead of a hand-flipped constant.

## What We're NOT Doing

- **No structural or value snapshots of the document definition.** Decided during planning: the automated layer is smoke only. Layout regressions are caught by the manual comparison procedure, not by `npm test`. See "Open Risks & Assumptions".
- **No pixel-diff harness, no PDF text extraction, no byte or hash comparison.** The roadmap names pixel-diff as the scope trap for this item; byte comparison is impossible regardless because pdfkit stamps a fresh `CreationDate` into every document.
- **No dev-only fixture loader in the application.** Replay lives entirely in specs; no code is added to any component under the hard rule.
- **No baseline for the rating-scale PDF** (`src/app/rating-scale/special-marks/special-marks.component.ts:253`, which calls `.open()`). Scope is the four report types named by F-02 and FR-015–FR-017.
- **No lint cleanup in `year-report.component.ts`.** The nine errors noted in `src/CLAUDE.md` concern the `dev` branch; lint is clean here. Phase 3 changes exactly one expression in that file.
- **No fix for the unhandled `download()` rejection.** The smoke layer surfaces the failure mode; wiring error handling into the components is a behavior change and belongs to whichever slice owns it.
- **No CI gate.** `.github/` does not exist and the roadmap parks CI/CD deliberately.

## Implementation Approach

Fixtures come first because everything downstream consumes them — the smoke specs assert against them, and the capture harness renders them into the reference PDFs. Each fixture owns the knowledge of how to reach its own state, so the shared harness stays generic and per-component quirks stay local.

The capture harness reuses the smoke test's interception: intercept `createPdf`, then call the saved original with a deterministic filename. That is why phase 2 costs almost nothing once phase 1 lands, and it is what makes "regenerate the other three types on demand" a one-command operation rather than forty fields of retyping.

Phase ordering is load-bearing. Reference PDFs must be captured from **unmodified** code. If the locale change landed first, "before" and "after" would describe the same state and the barrier would have measured nothing at the one moment it mattered.

## Critical Implementation Details

**Fixtures must drive the component, not construct controls.** A fixture may not build `FormGroup`s by hand for the array rows. It calls the component's own public builder — `addNextExamTerm`, `initClassesFromFirstSelectedClass` — and only then patches values. Hand-built rows can diverge from what the UI produces (disabled flags, derived `schoolExam` values), and a reference PDF describing an unreachable state is worse than no reference PDF.

**Fixed dates must be timezone-stable.** Use a local-midnight literal (`new Date('2026-06-12T00:00:00')`, not the `Z`-suffixed form). A UTC-midnight value shifts to the previous day in negative offsets and changes the rendered date.

**Jasmine's 5-second default timeout is tight here.** Each render embeds the base64 banner (`src/app/shared/baner-base64.ts`, ~62 KB) and the full Roboto VFS. Raise `jasmine.DEFAULT_TIMEOUT_INTERVAL` in the PDF specs rather than diagnosing flaky failures later.

**Capture must run in headed Chrome.** Headless Chrome blocks or discards `saveAs` downloads by default; the capture script must not pass `--browsers=ChromeHeadless`.

---

## Phase 1: Fixtures, rehydration, and smoke coverage

### Overview

Record eight reachable form states as typed modules and prove each one renders a PDF. Nothing outside `src/app/shared/testing/` and the four new spec files is touched.

### Changes Required

#### 1. Fixture contract

**File**: `src/app/shared/testing/pdf-fidelity/report-fixture.ts`

**Intent**: Define the shape every fixture satisfies, so the smoke specs and the capture harness consume all eight uniformly.

**Contract**: Exports a `ReportFixture<TComponent>` interface with `id: string` (kebab-case, used as the capture filename), `label: string` (human-readable, quoted in the procedure doc), and `apply(component: TComponent): void`. `apply` is responsible for reaching the state by any means the UI offers, including calling the component's public methods before patching.

#### 2. Fixture modules

**File**: `src/app/shared/testing/pdf-fidelity/fixtures/semestr-report.fixture.ts`

**Intent**: Two states for the trimester/semester form — minimal (required fields only) and maximal (every conditional section on).

**Contract**: Exports `semestrFixtures: ReportFixture<SemestrReportComponent>[]` with ids `semestr-minimal` and `semestr-maximal`. Minimal fills only the `Validators.required` controls (`reportType`, `studentName`, `sex`, `pronunciation`, `vocabulary`, `prepareToLecture`, `homeworks`, `involvement`, `behaviour`) and leaves `additionalComment` and `isExamRecommendation` falsy, exercising the empty-`{}` return paths at `semestr-report.component.ts:590` and `:614`. Maximal sets `reportType: ReportType.SEMESTER`, `isExamRecommendation: true` with `examRecommendationOptions: '3'` and an `examRecommendationResult`, a non-empty `additionalComment`, `studentBookTitle`, `avgMark`, `signature`, and a `teachers` array of two. **Both leave all fourteen `FormArray`s empty** — the template has no `formArrayName` binding, so no other state is reachable.

**File**: `src/app/shared/testing/pdf-fidelity/fixtures/cambridge-report.fixture.ts`

**Intent**: Two states for the Cambridge form, whose exam-level arrays are the only real array surface among the four.

**Contract**: Exports `cambridgeFixtures` with ids `cambridge-minimal` and `cambridge-maximal`. Maximal calls `addNextExamTerm` for the arrays belonging to one exam level (the A2–B1 set) and `addNextComment` twice before patching, so the generated table rows and the comment block at `cambridge-report.component.ts:436` are both exercised. Minimal leaves every array empty.

**File**: `src/app/shared/testing/pdf-fidelity/fixtures/year-report.fixture.ts`

**Intent**: Two states for the end-of-school-year form, including its derived-row table.

**Contract**: Exports `yearFixtures` with ids `year-minimal` and `year-maximal`. Maximal calls `initClassesFromFirstSelectedClass` with a class value that yields several rows, patches the authorable controls on those rows (`courseLevel`, `certificationPurpose`), leaves the derived disabled controls alone, and sets at least one row's `shouldDeleteRow` to `true` so the filter at `year-report.component.ts:342` is covered. Minimal leaves the array empty and `additionalComment` null, covering the `!== null` branches at `:224` and `:236`.

**File**: `src/app/shared/testing/pdf-fidelity/fixtures/teddy-eddie-report.fixture.ts`

**Intent**: Two states for the Teddy Eddie form and its two derived tables.

**Contract**: Exports `teddyEddieFixtures` with ids `teddy-eddie-minimal` and `teddy-eddie-maximal`. Maximal drives the age-selection path that populates `teddyEddieArray` and `developmentLanguageSkillsArray` before patching. Note the disabled `class` control (`teddy-eddie-report.component.ts:56`): it is absent from `form.value` and must be set through the same path the UI uses, not patched.

#### 3. Shared spec harness

**File**: `src/app/shared/testing/pdf-fidelity/render-pdf.ts`

**Intent**: One helper that intercepts the document definition, suppresses the download, and renders for real — used identically by the smoke specs and the capture harness.

**Contract**: Exports `capturePdfDefinition(generate: () => void): unknown`, which saves the original `pdfMake.createPdf`, installs a Jasmine spy returning a stub whose `download`/`open` resolve to `undefined`, invokes `generate`, restores the original, and returns the captured definition. Also exports `renderToBlob(definition: unknown): Promise<Blob>` calling the saved original's `getBlob()`.

The interception is the one non-obvious part of this change and every later phase depends on its shape:

```ts
const original = pdfMake.createPdf;
let captured: unknown;
spyOn(pdfMake, 'createPdf').and.callFake((dd: unknown) => {
  captured = dd;
  return { download: () => Promise.resolve(), open: () => Promise.resolve() };
});
```

#### 4. Smoke specs

**File**: `src/app/semestr-report/semestr-report.component.spec.ts` (and the three siblings in `year-report/`, `cambridge-report/`, `teddy-eddie-report/`)

**Intent**: For each fixture, assert the component produces a document definition that pdfmake actually renders into a non-empty PDF.

**Contract**: Each spec configures `TestBed` with the standalone component plus `...translateTestingImports`, `provideNoopAnimations()`, and `provideNativeDateAdapter()` per the convention in `src/CLAUDE.md`. One `it` per fixture: apply the fixture, capture the definition through `capturePdfDefinition`, assert it is a non-null object, `await renderToBlob(...)`, and assert `blob.size > 0` and `blob.type === 'application/pdf'`. Raise `jasmine.DEFAULT_TIMEOUT_INTERVAL` at the top of each spec.

### Success Criteria

#### Automated Verification

- Linting passes: `npm run lint`
- Full suite passes with eight new cases: `npm test -- --watch=false --browsers=ChromeHeadless`
- Production build still compiles the new `src/` modules: `npm run build`
- Dev-configuration build type-checks: `npm run build -- --configuration development`

#### Manual Verification

- Each maximal fixture demonstrably reaches its conditional branches — spot-check by reading the captured definition for the presence of the exam-recommendation table and the additional-comment block
- Each minimal fixture leaves the corresponding branches absent
- No fixture constructs a `FormArray` row by hand; every row originates from a component method
- The trimester/semester fixtures leave all fourteen `FormArray`s empty

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding.

---

## Phase 2: Capture harness, reference PDFs, and the written procedure

### Overview

Turn the fixtures into PDFs on demand, commit the two trimester/semester references, and write the runbook that makes the comparison repeatable by someone who was not in this conversation.

### Changes Required

#### 1. Capture harness

**File**: `src/app/shared/testing/pdf-fidelity/pdf-fidelity-capture.spec.ts`

**Intent**: Render every fixture to a real downloaded PDF with a deterministic filename, on explicit invocation only.

**Contract**: Iterates all eight fixtures across the four components. For each, applies the fixture, captures the definition via `capturePdfDefinition`, then calls the saved original's `download()` with `${fixture.id}.pdf` — so filenames come from the fixture id, not from the component's `studentName`-derived name. Must never run during a normal `npm test`.

#### 2. Test target configuration

**File**: `angular.json`

**Intent**: Exclude the capture spec from the default run and give it a named configuration.

**Contract**: Under `projects.britannia-reports.architect.test`, add `"exclude": ["**/pdf-fidelity-capture.spec.ts"]` to `options`, and a `configurations.capture` block setting `"include": ["**/pdf-fidelity-capture.spec.ts"]` and `"exclude": []`.

#### 3. Capture script

**File**: `package.json`

**Intent**: One command a human runs to produce the PDFs.

**Contract**: Adds `"test:capture": "ng test --configuration capture --watch=false"`. No `--browsers` override — headed Chrome is required for downloads to land on disk.

#### 4. Reference PDFs

**File**: `docs/pdf-fidelity/reference/semestr-minimal.pdf`, `docs/pdf-fidelity/reference/semestr-maximal.pdf`

**Intent**: The two committed artifacts that carry the layout guardrail for the form `S-02` will modify.

**Contract**: Generated by `npm run test:capture` from the **unmodified** code on this branch, in a Chrome running under a `pl-PL` locale, and moved from the browser download directory into the reference folder unrenamed. The six PDFs for the other three report types are produced by the same command and deliberately not committed.

#### 5. The procedure

**File**: `docs/pdf-fidelity-check.md`

**Intent**: The runbook `src/CLAUDE.md` will point at — executable by someone with no context beyond the repository.

**Contract**: Sections, in order: when the procedure is mandatory (any change touching a `*-report.component.ts`, the base64 asset modules, or `helper/cambridge/`); environment preconditions (headed Chrome, `pl-PL` locale, and why); producing the "before" artifacts — committed references for trimester/semester, and for the other three a `git worktree add` of the pre-change commit followed by `npm ci` and `npm run test:capture`; producing the "after" artifacts; the comparison checklist (page count, table row and column counts, column widths, margins and spacing, page breaks, image placement and size, font sizes, the date field); recording the outcome in the change's `plan.md`; and an explicit warning that PDF bytes and hashes always differ because pdfkit stamps a fresh `CreationDate`, so only visual comparison is meaningful.

#### 6. Convention pointer

**File**: `src/CLAUDE.md`

**Intent**: Replace the vague closing sentence of the hard rule with the concrete procedure, and keep the folder map accurate.

**Contract**: In `## Hard rules`, the sentence "When in doubt, generate a PDF before and after with identical form inputs and compare visually" is replaced by a pointer to `docs/pdf-fidelity-check.md` plus a note that `npm test` smoke-covers renderability but does not verify layout. In `## Folder map`, the `src/app/shared/` bullet gains `testing/pdf-fidelity/` alongside the existing `testing/translate-testing.ts` mention.

*Disclosed scope note*: the folder-map edit is not strictly required by the phase's purpose. It is included per `context/foundation/lessons.md` — "when editing a document makes another of its sections stale, that section is in scope for the same change" — because the bullet enumerates the contents of `shared/` and would otherwise be wrong the moment phase 1 landed.

### Success Criteria

#### Automated Verification

- Default suite is unchanged and green, with the capture spec excluded: `npm test -- --watch=false --browsers=ChromeHeadless`
- Capture produces eight PDFs: `npm run test:capture`
- Linting passes: `npm run lint`
- Production build passes: `npm run build`

#### Manual Verification

- All eight captured PDFs open without a viewer error and render their expected sections
- `semestr-minimal.pdf` and `semestr-maximal.pdf` are committed under `docs/pdf-fidelity/reference/`
- The maximal trimester/semester PDF visibly contains the exam-recommendation table and the additional-comment row; the minimal one contains neither
- A second reader can follow `docs/pdf-fidelity-check.md` end to end without asking a question
- `src/CLAUDE.md`'s hard rule points at the procedure and no longer ends with the vague instruction

**Implementation Note**: After completing this phase and all automated verification passes, pause for manual confirmation before proceeding. Do not start phase 3 until the reference PDFs are committed — they must predate the first change.

---

## Phase 3: Explicit `pl-PL` date locale, validated through the procedure

### Overview

Apply the first real change under the new barrier: make date formatting independent of the browser's system locale, and prove through the phase 2 procedure that the trimester/semester PDFs are unchanged.

### Changes Required

#### 1. Date formatting call sites

**File**: `src/app/semestr-report/semestr-report.component.ts:239`, `src/app/cambridge-report/cambridge-report.component.ts:192`, `src/app/teddy-eddie-report/teddy-eddie-report.component.ts:208`, `src/app/year-report/year-report.component.ts:276`, `src/app/helper/cambridge/static-function/generate-table.ts:12`

**Intent**: Pin the rendered date format to Polish so the same form input yields the same PDF on any machine.

**Contract**: Each `new Date(...).toLocaleDateString()` becomes `new Date(...).toLocaleDateString('pl-PL')`. No other expression in these files changes. On a machine already running a `pl-PL` locale the rendered output is identical, which is why the phase 2 reference PDFs stay valid rather than needing regeneration.

#### 2. Procedure outcome record

**File**: `context/changes/pdf-fidelity-baseline/plan.md`

**Intent**: The procedure requires recording its outcome in the change's plan; this change records its own.

**Contract**: Appends a short "PDF fidelity check" note under `## Progress` naming the date of the run, the report types compared, and the verdict.

### Success Criteria

#### Automated Verification

- Linting passes: `npm run lint`
- Full suite passes: `npm test -- --watch=false --browsers=ChromeHeadless`
- Production build passes: `npm run build`
- Dev-configuration build type-checks: `npm run build -- --configuration development`
- Capture reruns cleanly after the change: `npm run test:capture`

#### Manual Verification

- The post-change `semestr-minimal.pdf` and `semestr-maximal.pdf` are visually identical to the committed references, checked against the phase 2 comparison checklist
- Exactly five expressions changed; `git diff` shows no other edit in the four report components or the Cambridge helper
- The committed reference PDFs are left as-is, not regenerated
- The procedure was followed as written, and any step that proved unclear is corrected in `docs/pdf-fidelity-check.md`

**Implementation Note**: This phase is the procedure's first consumer. If a step turns out to be ambiguous while executing it, fixing the document is in scope — that feedback is the point of running it here rather than discovering it during `S-01`.

---

## Testing Strategy

### Unit Tests

- Eight smoke cases, two per report type: apply fixture → capture definition → render → non-empty `application/pdf` blob.
- Deliberately no assertions on definition content. The automated layer answers "does it still render", not "does it still look the same".

### Integration Tests

None. The change adds no cross-component behavior.

### Manual Testing Steps

1. Run `npm run test:capture` and confirm eight PDFs arrive in the browser's download directory.
2. Open the maximal trimester/semester PDF and verify the exam-recommendation table, the additional-comment row, and the two-teacher line are present.
3. Open the minimal trimester/semester PDF and verify those sections are absent and the document still renders cleanly.
4. Open the maximal end-of-school-year PDF and verify the development-path table shows the derived rows with the row marked `shouldDeleteRow` omitted.
5. Open the maximal Cambridge PDF and verify the A2–B1 exam rows and both comments render.
6. Follow `docs/pdf-fidelity-check.md` from a clean state for one non-committed report type, using `git worktree`, and confirm the "before" artifact reproduces.

## Performance Considerations

Each render embeds the Roboto VFS and the base64 banner, so the eight smoke cases add measurable time to `npm test`. That is the cost of rendering for real rather than asserting on a definition, and it is bounded — eight documents, no network, no file I/O in the default run. Raise the Jasmine timeout rather than reducing coverage. The capture harness is excluded from the default run precisely so this cost is paid once per suite, not twice.

## Migration Notes

None. No persisted data, no schema, no deployed behavior changes in phases 1 and 2. Phase 3 changes rendered output only for users whose browser locale is not Polish — for whom the current output is already wrong relative to the app's `LOCALE_ID = 'pl-PL'`.

## Open Risks & Assumptions

- **The automated layer does not guard layout.** Smoke-only coverage passes even if every margin, `fontSize`, column width, and section ordering changes. This was chosen deliberately during planning over a structural snapshot. The consequence is that the PRD's fidelity guardrail rests entirely on a human following `docs/pdf-fidelity-check.md`, and nothing in `npm test` will notice if they skip it. If `S-01` or `S-02` ever produces a fidelity regression that reaches the live site, adding a structural snapshot on top of the existing fixtures is the cheapest correction — the fixtures and the interception helper are already in place.
- **Only the trimester/semester references are committed.** For the other three report types the "before" artifact must be reconstructed from history via `git worktree` at the moment it is needed. This is reliable as long as the procedure documents it and `npm ci` still resolves for the base commit; it becomes fragile once dependencies drift.
- **Reference PDFs are environment-conditional until phase 3 lands.** They must be produced on a `pl-PL` Chrome. After the locale fix the rendered date is pinned, but other locale-sensitive formatting could be introduced later without anyone noticing.
- **Headed Chrome is required for capture.** If the repository later gains CI, `npm run test:capture` will not work there unaltered; the default `npm test` will.
- **The silent `download()` rejection stays unfixed.** A render failure in production is still invisible to the teacher. The smoke layer means we would catch it in a test rather than in the field, which is a mitigation, not a fix.

## References

- Roadmap item: `context/foundation/roadmap.md` → F-02
- Guardrails: `context/foundation/prd.md` → `## Success Criteria` (Guardrails), FR-015, FR-016, FR-017
- Hard rule being made concrete: `src/CLAUDE.md` → `## Hard rules`
- Recurring rule applied in phase 2: `context/foundation/lessons.md` → "Updating a document includes the sections the new content contradicts"
- Existing test-helper pattern: `src/app/shared/testing/translate-testing.ts`
- pdfmake browser API: `node_modules/pdfmake/src/browser-extensions/OutputDocumentBrowser.js:23`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Fixtures, rehydration, and smoke coverage

#### Automated

- [x] 1.1 Linting passes: `npm run lint`
- [x] 1.2 Full suite passes with eight new cases: `npm test -- --watch=false --browsers=ChromeHeadless`
- [x] 1.3 Production build still compiles the new `src/` modules: `npm run build`
- [x] 1.4 Dev-configuration build type-checks: `npm run build -- --configuration development`

#### Manual

- [x] 1.5 Each maximal fixture demonstrably reaches its conditional branches
- [x] 1.6 Each minimal fixture leaves the corresponding branches absent
- [x] 1.7 No fixture constructs a `FormArray` row by hand
- [x] 1.8 The trimester/semester fixtures leave all fourteen `FormArray`s empty

### Phase 2: Capture harness, reference PDFs, and the written procedure

#### Automated

- [ ] 2.1 Default suite green with the capture spec excluded: `npm test -- --watch=false --browsers=ChromeHeadless`
- [ ] 2.2 Capture produces eight PDFs: `npm run test:capture`
- [ ] 2.3 Linting passes: `npm run lint`
- [ ] 2.4 Production build passes: `npm run build`

#### Manual

- [ ] 2.5 All eight captured PDFs open without a viewer error and render their expected sections
- [ ] 2.6 `semestr-minimal.pdf` and `semestr-maximal.pdf` are committed under `docs/pdf-fidelity/reference/`
- [ ] 2.7 The maximal trimester/semester PDF contains the exam-recommendation table and additional-comment row; the minimal one contains neither
- [ ] 2.8 A second reader can follow `docs/pdf-fidelity-check.md` end to end without asking a question
- [ ] 2.9 `src/CLAUDE.md`'s hard rule points at the procedure and the folder map lists `testing/pdf-fidelity/`

### Phase 3: Explicit `pl-PL` date locale, validated through the procedure

#### Automated

- [ ] 3.1 Linting passes: `npm run lint`
- [ ] 3.2 Full suite passes: `npm test -- --watch=false --browsers=ChromeHeadless`
- [ ] 3.3 Production build passes: `npm run build`
- [ ] 3.4 Dev-configuration build type-checks: `npm run build -- --configuration development`
- [ ] 3.5 Capture reruns cleanly after the change: `npm run test:capture`

#### Manual

- [ ] 3.6 Post-change trimester/semester PDFs are visually identical to the committed references
- [ ] 3.7 Exactly five expressions changed; no other edit in the four components or the Cambridge helper
- [ ] 3.8 The committed reference PDFs are left as-is, not regenerated
- [ ] 3.9 Any ambiguous step discovered while executing the procedure is corrected in `docs/pdf-fidelity-check.md`
