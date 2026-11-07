---
date: 2026-09-08T15:24:26+02:00
researcher: Michał Skoczek
git_commit: 08b07a5989c55c74db6355bf7c0426512ae867e3
branch: 10xdevs-m3l4
repository: britannia-reports
topic: "Phase 5 — what browser-level coverage 'the click ends in a file' should add beyond seed.spec.ts"
tags: [research, codebase, e2e, playwright, pdf-download, risk-1, test-plan-phase-5]
status: complete
last_updated: 2026-09-08
last_updated_by: Michał Skoczek
---

# Research: Phase 5 — "The click ends in a file"

**Date**: 2026-09-08T15:24:26+02:00
**Researcher**: Michał Skoczek
**Git Commit**: 08b07a5989c55c74db6355bf7c0426512ae867e3
**Branch**: 10xdevs-m3l4
**Repository**: britannia-reports

## Research Question

`context/foundation/test-plan.md` §3 Phase 5 covers the **delivery half of Risk #1**:
that the download a teacher actually clicks produces a file, and that the page stays
free of uncaught exceptions getting there. Phase 1 (`testing-pdf-input-space`) closed
the builder half at the unit layer. `test/e2e/seed.spec.ts` demonstrates the semester
report's download end to end, but is the **exemplar** — excluded from every run by
`testIgnore` since 2026-09-08, and counted as a pattern rather than as coverage.

So: **what browser-level coverage remains, across all four report types, that §7's
ceiling actually permits?**

Scope agreed before research: all four download paths, plus prior-art de-duplication
against Phase 1. Harness generalisation and the Phase 6 gate handoff were explicitly
deferred out of this research.

## Summary

**The unit layer never executes a download.** `render-pdf.ts` replaces `pdfMake.createPdf`
wholesale; `capturePdfDefinition` returns an inert handle whose `download()` is
`() => Promise.resolve()` (`src/app/shared/testing/pdf-fidelity/render-pdf.ts:32-36`).
The four component specs only ever reach `.getBlob()`. So for **every** report type,
three things have never run in any test:

1. a click on the real download control reaching the handler,
2. the real `pdfMake.createPdf(dd).download(fileName)` call,
3. the browser delivering a file with the builder's computed name.

That is the whole of Phase 5's legitimate territory, and it is per-report-type — not
because the four types differ in input space (Phase 1 covered that), but because each
one wires its click differently.

**The framing that keeps Phase 5 inside §7's ceiling:** an e2e spec here asserts
*delivery*, never *generation*. "A PDF is produced from an untouched year-end form" is
owned by the `year-untouched` fixture and must not be restated. "Clicking the year-end
download control delivers a file" has never been asserted anywhere.

**Three findings change what the plan can assume:**

- **Teddy Eddie's download button does not read "Generuj PDF".** Its binding is
  `[translateKey]="'PDF'"` and `PDF` is not a key in either locale file, so ngx-translate
  echoes the key and the button renders **`PDF`**. A spec copying the seed's locator will
  not find it. This is a real product defect, not just a test obstacle.
- **Teddy Eddie is the default-active tab**, so its download is reachable with *zero*
  clicks before the download click itself.
- **Year-end and Teddy Eddie produce byte-identical filename expressions**, so a filename
  assertion cannot distinguish the two report types — and on an untouched form both
  interpolate the literal string `null`.

## Detailed Findings

### The shell: there are no routes, only tabs

Routing stops at the shell — there is no route per report type
(`src/app/app.routes.ts:26-32`: `/sign-in`, `''` → `ShellComponent` behind `authGuard`,
`/students`, `**` → `''`). The shell renders a tab bar plus an `NgComponentOutlet`
(`src/app/shell/shell.component.html:2-6`), and each tab is a native `<button>` whose
label is `{{ tab.name | translate }}`
(`src/app/shared/components/UI/tab-group/tab-group.component.html:3-10`).

Consequences for every spec in this phase:

- Every report type is reached by `getByRole('button', { name: <PL string> })`, never by
  a URL. **There is no deep link.**
- Leaving the shell (e.g. to `/students`) destroys the form and resets the bar to the
  default tab (`app.routes.ts:18-21`, `tab-group.component.ts:50-54`). A spec must not
  navigate mid-test.
- Tab order on screen is semester, year-end, Cambridge, Teddy Eddie
  (`src/app/shared/static-data/tab-data.ts:8-37`), and **Teddy Eddie carries
  `defaultActive: true`** (`tab-data.ts:33`) — it is already open when the shell mounts.

All four download controls are `app-button`, which renders a native
`<button [disabled]="disabled()">` with `{{ translateKey() | translate }}` as its text
(`src/app/shared/components/button/button.component.html:1-15`,
`button.component.ts:15-18`). The `mat-icon` sits inside the same button, so substring
name matching is right here — as the seed already does.

### The four download paths

| | Semester/trimester | Cambridge | Year-end | Teddy Eddie |
|---|---|---|---|---|
| Tab (PL) | "Raport semestralny" (`pl.json:2`) | "Raport Cambridge" (`pl.json:253`) | "Raport całoroczny" (`pl.json:3`) | "Raport Teddy Eddie" (`pl.json:5`) — **default active** |
| Button name | "Generuj PDF" | "Generuj PDF" | "Generuj PDF" | **"PDF"** ⚠ |
| Wiring | `(ngSubmit)` + `[type]="'submit'"` | `(ngSubmit)` + `[type]="'submit'"` | `(ngSubmit)` + `[type]="'submit'"` | **`(clicked)="downloadPDF()"`, no `<form>`** |
| Gate | `[disabled]="form.invalid"` (`html:408`) | `[disabled]="form.invalid"` (`html:285`) | **none** (`html:305-309`) | **none** (`html:38`) |
| Validators | 9 | 1 (`studentName`) | 0 | 0 |
| Student picker | **yes** (`html:14-17`) | no | no | no |
| Min. interaction | tab → name → sex → 6 marks → click | tab → name → click | **tab → click** | **click** (tab already open) |

**Semester/trimester.** Download at `src/app/semestr-report/semestr-report.component.html:404-409`,
gate at `:408`, form at `:2`. The nine `Validators.required` are at
`semestr-report.component.ts:1051,1052,1054,1070-1075`. Filename
(`semestr-report.component.ts:944-945`):

```ts
const fileName: string = form.value.studentName.split(' ').join('-') + '_semester_report';
pdfMake.createPdf(docDefinition).download(fileName);
```

**Order is load-bearing: set `sex` before the six marks.** `markOptions()` builds each
option list from `mark.value` vs `mark.valueFemale` off the current `sex`
(`semestr-report.component.ts:305-321`), and changing `sex` afterwards rewrites the six
controls. The seed already respects this.

**Cambridge.** Download at `cambridge-report.component.html:281-286`, gate at `:285`.
One validator: `studentName: new FormControl(null, Validators.required)`
(`cambridge-report.component.ts:444`). Filename at `:424-425`, same `split(' ').join('-')`
shape as semester. **The whole flow is: click the tab, fill one textbox, click download.**

**Year-end.** Download at `year-report.component.html:305-309` — the `app-button` carries
`[translateKey]`, `[icon]`, `[type]="'submit'"` and **no `[disabled]` binding**, so
`ButtonComponent.disabled` falls back to its `input<boolean>(false)` default
(`button.component.ts:18`). `createForm()` at `year-report.component.ts:775-817` declares
no validators at all. Filename at `:568-569`:

```ts
const fileName: string = 'Raport końcowy 2025-26 - ' + form.value.studentName;
```

On an untouched form `studentName` is `null`, so this concatenates to
`Raport końcowy 2025-26 - null`.

**Teddy Eddie.** Download at `teddy-eddie-report.component.html:38-40`. No `<form>` in the
template; the button uses `(clicked)="downloadPDF()"`. No gate. The form is
`this.fb.nonNullable.group({...})` at `teddy-eddie-report.component.ts:52-67` with no
validators. Filename at `:333-334` — **the identical expression to year-end**.

### ⚠ Teddy Eddie's button is a missing translation key

Verified directly against the tree, not only via agent report:

```html
<app-button [translateKey]="'PDF'" (clicked)="downloadPDF()" [icon]="'download'">
  {{ 'downloadPDF' | translate }}
</app-button>
```
`src/app/teddy-eddie-report/teddy-eddie-report.component.html:38-40`

`grep '"PDF"' src/assets/i18n/pl.json src/assets/i18n/en.json` returns **nothing** (exit 1);
only `"downloadPDF"` exists, at line 104 of both files. ngx-translate echoes an unknown key
verbatim, so the button renders **`PDF`** in both languages. The projected
`{{ 'downloadPDF' | translate }}` is silently dropped: `ButtonComponent`'s template has no
`<ng-content>` (`button.component.html:1-15`).

Two consequences the plan must decide between:

1. The correct locator today is `getByRole('button', { name: 'PDF' })`, not `'Generuj PDF'`.
2. This is a **product bug** — the button reads "PDF" to a Polish teacher and to an English
   one. Fixing it (`[translateKey]="'downloadPDF'"`) is a one-token change that would
   immediately break any spec written against `'PDF'`.

Note `'Generuj PDF'` *contains* `PDF`, so a substring match on `'PDF'` would match either
spelling — but only one tab renders at a time, so a name-based match cannot collide across
report types.

### What the unit layer cannot see

The mechanism is stated in the specs themselves — *"Every spec above calls `generatePDF`
directly and walks straight past that gate"* (`cambridge-report.component.spec.ts:107-116`,
`semestr-report.component.spec.ts:130-139`) — and in the harness:
`render-pdf.ts:7-13` records that `download` "routes through file-saver and would trigger
real browser downloads under Karma", which is why `createPdf` is replaced entirely
(original captured at module load, `:29-30`; swapped and restored through `try/finally`,
`:45-61`).

Unproven at the unit layer, for all four report types:

1. **The DOM click wiring.** No test clicks a download control anywhere.
2. **The real `.download()` call** — `cambridge-report.component.ts:425`,
   `semestr-report.component.ts:945`, `teddy-eddie-report.component.ts:334`,
   `year-report.component.ts:569` are never executed. The harness only calls `.getBlob()`.
3. **Browser file delivery** — no test observes a download event, a filename, or a file.
4. **Uncaught exceptions reaching only the console.** Karma surfaces a throw *inside*
   `generatePDF` as a failed expectation; it sees nothing asynchronous inside file-saver
   or outside the captured call. This is the silent failure mode Risk #1 is named after.
5. **The gate's *enabled* direction.** Phase 4 already asserts the *disabled* direction on
   the two gated forms by reading the rendered control
   (`cambridge-report.component.spec.ts:135-142`, `semestr-report.component.spec.ts:160-170`)
   — but only untouched, and never that filling the form re-enables the button.

### Prior art: what Phase 1 already owns

Every edge fixture is capture **+ real pdfmake render + `%PDF` + non-zero size +
`application/pdf`**. There is no capture-only tier. Fixtures:

- **Year-end** (`fixtures/edge/year-report.edge.fixture.ts`): `year-untouched` (`:21-26`),
  `year-all-details-deleted` (`:27-45`), `year-long-free-text` (`:46-61`),
  `year-non-ascii-name` (`:62-72`).
- **Cambridge** (`fixtures/edge/cambridge-report.edge.fixture.ts`): `cambridge-required-only`
  (`:25-34`), `cambridge-exam-type-without-terms` (`:36-47`), `cambridge-blank-exam-term`
  (`:49-62`), `cambridge-long-free-text` (`:64-82`), `cambridge-non-ascii-name` (`:84-93`).
- **Semester** (`fixtures/edge/semestr-report.edge.fixture.ts`): `REQUIRED_FLOOR` (`:46-56`),
  `semestr-required-only` (`:60-69`), `semestr-exam-recommendation-empty` (`:71-80`),
  `semestr-long-free-text` (`:82-98`), `semestr-non-ascii-name` (`:100-115`).
- **Teddy Eddie** (`fixtures/edge/teddy-eddie-report.edge.fixture.ts`): `teddy-eddie-untouched`
  (`:142-147`), `teddy-eddie-age-picked-rows-blank` (`:149-160`), `teddy-eddie-all-rows-deleted`
  (`:162-177`), `teddy-eddie-long-free-text` (`:179-201`), `teddy-eddie-non-ascii-name` (`:203-211`).

**The two Phase 1 crashes were fixed in the builder, not at the UI** — decided explicitly at
`testing-pdf-input-space/change.md:45-56`. Year-end's null `class`
(`year-report.component.ts:409-412`) and the empty `table.body` (`:751-764`) both now return
a guarded value. **The states remain one click away; they simply no longer throw.** No guards
landed on the other three reports.

### The de-duplication list

**Must NOT be restated at e2e** (a cheaper layer owns it):

- "A PDF is produced from an untouched year-end form" → `year-untouched`.
- "A PDF is produced from an untouched Teddy Eddie form" → `teddy-eddie-untouched`.
- "A PDF is produced from each form's validator floor" → `cambridge-required-only`,
  `semestr-required-only`.
- "Long free text does not break generation" → the four `*-long-free-text` fixtures.
  `hostile-text.ts:95-114` explicitly forbids any stronger claim.
- "Non-ASCII names do not break generation" → the four `*-non-ascii-name` fixtures. e2e must
  **not** assert glyphs rendered — no source supports it at any layer.
- "The output is a real PDF (`%PDF`, non-zero, `application/pdf`)" — as a claim *about an
  input state*. Asserting `%PDF` on a delivered file is different and legitimate.
- "The untouched Cambridge/semester form is invalid and its download button is disabled" →
  the Phase 4 gate blocks, which already read the rendered control.
- Half-filled structural states (exam type without terms, blank term, rows deleted, …).
- PDF content, layout, fidelity → Phase 4. Field ownership and the sex remap → Phase 2.
  The access boundary → Phase 3.

**Genuinely browser-only:**

- A click on the real download control reaches the handler — two distinct wirings
  (`ngSubmit` + submit button on three reports; `(clicked)` on Teddy Eddie).
- `pdfMake.createPdf(dd).download(fileName)` executes for real.
- The browser delivers a file, with a non-empty body and the builder's computed name.
- The page stays free of uncaught exceptions across the whole click, including anything
  asynchronous that Karma's synchronous capture cannot see.
- The gate's *enabled* direction: a form filled to its floor through the UI yields a
  clickable download button.

## Code References

- `src/app/app.routes.ts:26-32` — no route per report type; shell behind `authGuard`
- `src/app/shared/static-data/tab-data.ts:8-37` — the tab registry; `defaultActive` on Teddy Eddie at `:33`
- `src/app/shared/components/UI/tab-group/tab-group.component.html:3-10` — tabs are buttons with translated names
- `src/app/shared/components/button/button.component.html:1-15` — `app-button`; no `<ng-content>`
- `src/app/teddy-eddie-report/teddy-eddie-report.component.html:38-40` — `[translateKey]="'PDF'"`, the missing key
- `src/app/year-report/year-report.component.html:305-309` — download control with no `[disabled]`
- `src/app/year-report/year-report.component.ts:568-569` — filename interpolating a null `studentName`
- `src/app/teddy-eddie-report/teddy-eddie-report.component.ts:333-334` — the identical filename expression
- `src/app/semestr-report/semestr-report.component.ts:305-321` — `markOptions()`, why `sex` precedes the marks
- `src/app/shared/testing/pdf-fidelity/render-pdf.ts:29-36` — `createPdf` replaced; `download()` is a no-op stub
- `test/e2e/seed.spec.ts` — the exemplar: role locators, state waits, stamped data, store-side cleanup
- `test/e2e/fixtures/app.ts` — `signedIn` (IndexedDB seed), `roster`, `student`, `uncaughtErrors`

## Architecture Insights

- **Delivery and generation are separable, and the seam is `createPdf`.** Every cheaper layer
  stops at the document definition or the blob; the browser is the only place the call that
  writes a file actually runs. That seam is the precise justification for this phase, and the
  precise limit on it.
- **Two click wirings, not one.** Three reports submit a form; Teddy Eddie calls a method on
  a plain button with no `<form>` at all. A single parameterised spec that assumes `ngSubmit`
  would silently not cover the one report type whose wiring is different.
- **`app-button` defaults `[type]` to `'text'`**, which HTML resolves to *submit* — every
  in-form auxiliary button passes `[type]="'button'"` explicitly
  (`student-picker.component.html:9-13, 66-69`). A regression there surfaces as a spurious
  download event.
- **`{ disabled: true }` controls exist but never gate a download** — Teddy Eddie's `class`
  (`teddy-eddie-report.component.ts:56`), the dynamic-table cells (`:96-109, 128-135`;
  `year-report.component.ts:246-258`). Angular excludes them from validity and the builders
  use `getRawValue()`. A spec must never try to fill them.
- **Label collision inside the semester tab** — the quick-add's `students.studentNameLabel`
  and the report's `nameAndLastNameStudent` overlap as substrings; the seed handles it with
  `exact: true` (`seed.spec.ts:116-117`).

## Historical Context (from prior changes)

- `context/changes/testing-pdf-input-space/change.md:24-27` and `plan.md:79-81` — **the
  failure-UX half of Risk #1 is out of scope and remains unclaimed**: "Risk #1 has two halves:
  the builder throws, and the teacher gets no signal. This change researches and tests only
  the first." This is *not* the delivery half; it is a third thing nobody owns.
- `context/changes/testing-pdf-input-space/change.md:45-56` — the builder-guard-not-validator
  decision.
- `context/changes/testing-pdf-input-space/change.md:102-104` — `"null"`/`"undefined"` leakage
  belongs to Risk #2 and is a **fixture-sharpening** job, explicitly not a browser job. Directly
  relevant, since year-end and Teddy Eddie interpolate a literal `null` into the filename.
- `context/changes/testing-pdf-input-space/change.md:75-79` — Open Question #3 (what an emptied
  year-end detail table *should* render) stays open: "The Phase 1 oracle asserts only that a PDF
  is produced… Do not let it become an assertion." This binds e2e too.
- `context/foundation/test-plan.md:367-377` — §7's ceiling, and its re-evaluation clause.
- `context/foundation/lessons.md` — "The second test file is what tests whether the first one
  was isolated." The seed spec is currently the only file in `test/e2e/`; **Phase 5 adds the
  second**, and `fullyParallel: false` + one worker + one shared teacher account is exactly the
  shared-fixture shape that lesson describes.

## Related Research

- `context/changes/testing-pdf-input-space/research.md` — the builder-half input-space research.
  Note its line citation for the year-end `class` read is stale (`:409`; the guarded read is at
  `:412`). `change.md` is current.

## Decisions (settled 2026-09-08, after research)

1. **The Teddy Eddie `'PDF'` button is NOT fixed by this change.** The spec is written against
   the name the button carries today: `getByRole('button', { name: 'PDF' })`. The missing
   translate key is recorded here as a product defect for a separate change. A spec written
   against `'Generuj PDF'` would not find this control.
2. **`seed.spec.ts` is a pattern, not coverage — and no longer runs.** It is the exemplar every
   spec in this folder is modelled on, and it is not counted as protecting any report type.
   Therefore this phase writes **four** delivery specs — semester/trimester included — one per
   report type. Excluded from runs by `testIgnore: '**/seed.spec.ts'` in `playwright.config.ts`
   (applied 2026-09-08, ahead of the plan, on the user's instruction). It keeps its `.spec.ts`
   name deliberately: `eslint.config.js` matches `**/*.ts` and `tsconfig.json` declares no
   `include`, so both local `pre-commit` gates still check it and the exemplar cannot rot.
   `npx playwright test --list` now reports zero tests, which is the honest state until the
   four specs land.
3. **Filename assertions: fill `studentName` on every report type, never assert the untouched
   `null`.** All four builders interpolate the student name into the download name, so filling
   it makes the filename carry this run's unique stamp — the same evidence-of-provenance the
   seed spec relies on. Asserting the literal `Raport końcowy 2025-26 - null` is rejected: it
   would pin behaviour that `testing-pdf-input-space/change.md:102-104` explicitly routes to
   Risk #2 as a fixture-sharpening job. Year-end and Teddy Eddie share one filename expression,
   so the name proves delivery, never *which* report type produced it.
4. **The `student` fixture does not generalise, and does not need to.** Only the semester report
   embeds the student picker (`semestr-report.component.html:14-17`); the other three have no
   such feature. The four delivery specs therefore fill `studentName` directly through the form
   and **write nothing to the roster**, so they need neither the `student` fixture nor its
   Firestore cleanup. This also keeps the semester delivery spec distinct from `seed.spec.ts`,
   which exists to demonstrate the picker quick-add flow.
5. **The failure-UX half of Risk #1 remains unowned and out of scope** (see Historical Context).
   The plan should carry a pointer to it, not coverage for it.

## Open Questions

- **Nothing blocking.** The five questions this research raised were settled above.
- Carried forward for the plan, not for research: how the four specs are laid out on disk (one
  file per report type under `test/e2e/`, per the project default), and how the second, third and
  fourth files in `test/e2e/` respect the isolation lesson in `context/foundation/lessons.md`
  given one shared teacher account and `fullyParallel: false`. Since the delivery specs write
  nothing to the roster, the shared-fixture hazard that lesson describes is largely designed out
  — but the reasoning belongs in the plan, and in §6.7 when it is written.
