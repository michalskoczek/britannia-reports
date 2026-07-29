# Design language

`src/CLAUDE.md` names the Teddy Eddie report as the styling reference. This document is what that
reference actually consists of: the tokens and patterns any new surface can `@use`, the components it
should compose, and — just as important — the styling that is deliberately *not* part of the language.

Everything here is a **contract**. `S-01` (sign-in gate) and `S-05b` (form restyle) compile against these
names. Extend them additively; a rename is a breaking change.

## 1. Where the language came from

Until 2026-07-27 the language existed only implicitly, spread by copy-paste across four component
stylesheets. The same elevation shadow was typed out five times, the same `20px` radius five times, and
the two Teddy Eddie table stylesheets were ~95% identical across ~110 lines each.

The extraction used one criterion, and it is worth stating because it explains every omission below:

> A value or block became part of the language only if it already had **two or more consumers** *and*
> a planned surface (`S-05b` or `S-01`) will need it.

That test is falsifiable — every entry in §2 and §3 can be defended by pointing at its call sites — and it
is what keeps this from becoming a speculative design system. Anything repeated by coincidence rather than
by intent stayed local. See §5.

## 2. Published tokens

All tokens are reachable through a single entry point:

```scss
@use "path/to/assets/styles/utils/index" as ds;
```

### Colour — `utils/_colors.scss`

| Token | Value | What it is for | Example call site |
| --- | --- | --- | --- |
| `$main-color` | `#0022b7` | Material tab theming only | `custom-theme/_tab.scss:17` |
| `$britannia-blue` | `#1c4794` | Primary text on light surfaces; table header text | `patterns/_section-title.scss:12`, `header.component.scss:16` |
| `$britannia-dark` | `#2d3845` | Raised button fill — `app-button`'s `primary` variant | `button.component.scss:7` |
| `$britannia-background` | `#d6dcf5` | Section-title bar fill; `app-button`'s `secondary` variant fill | `patterns/_section-title.scss:13`, `button.component.scss:24` |
| `$britannia-light-blue` | `#eef0fa` | Data-table header row fill | `patterns/_data-table.scss:15` |
| `$white` | `#ffffff` | Card and table-row surfaces | `patterns/_card.scss:7` |
| `$black-87` | `rgba(0, 0, 0, 0.87)` | Disabled-cell text, kept legible | `patterns/_data-table.scss:77` |
| `$black-08` | `rgba(0, 0, 0, 0.08)` | Header-cell divider | `patterns/_data-table.scss:24` |
| `$black-06` | `rgba(0, 0, 0, 0.06)` | Body-cell divider | `patterns/_data-table.scss:37` |
| `$britannia-red` | `#d4162f` | Destructive-action fill — `app-button`'s `danger` variant | `button.component.scss:35` |

### Typography — `utils/_typography.scss`

| Token | Value | Example call site |
| --- | --- | --- |
| `$font` | `"Montserrat", sans-serif` | `patterns/_section-title.scss:7`, `button.component.scss:12` |

There is no type scale. Font sizes are still written inline at each site (`20px` in the section title,
`13px` in table headers, `14px` on buttons). Three sizes across three unrelated surfaces did not pass the
two-consumer test — a scale would have been invented, not extracted.

### Spacing — `utils/_spacing.scss`

| Token | Value | Example call site |
| --- | --- | --- |
| `$distance-8` | `8px` | `patterns/_section-title.scss:14`, `tab-group.component.scss:9` |
| `$distance-16` | `16px` | `patterns/_section-title.scss:14`, `header.component.scss:7` |
| `$distance-24` | `24px` | `styles.scss:20` |
| `$distance-32` | `32px` | **No consumer** — see §6 |
| `$distance-40` | `40px` | **No consumer** — see §6 |

### Radius — `utils/_radius.scss`

| Token | Value | Example call site |
| --- | --- | --- |
| `$radius-20` | `20px` | `patterns/_card.scss:6`, `patterns/_section-title.scss:19` |

### Elevation — `utils/_elevation.scss`

| Token | Value | Example call site |
| --- | --- | --- |
| `$shadow-1` | Material's three-layer elevation triple | `patterns/_card.scss:9`, `patterns/_section-title.scss:20` |

### Breakpoints — `utils/_breakpoints.scss`

| Member | Threshold | Example call site |
| --- | --- | --- |
| `$tablet` / `breakpoint-max-tablet()` | `768px` | `button.component.scss:41`, `teddy-eddie-form.component.scss:15` |
| `$tablet` / `breakpoint-tablet()` | `768px` | `styles.scss:19`, `header.component.scss:25` |
| `$desktop` / `breakpoint-desktop()` | `1200px` | **No consumer** |
| `$xxl-desktop` / `breakpoint-desktop-xxl()` | `1600px` | **No consumer** |

`breakpoint-desktop-xxl()` tested `$desktop` until 2026-07-27, making it a silent duplicate of
`breakpoint-desktop()`. It was fixed in the same change that wrote this document. Since neither mixin has
a call site, the fix changed no output — but the next surface to reach for it now gets the breakpoint the
name promises.

## 3. Published patterns

Composite mixins live in `src/assets/styles/patterns/` and are re-exported by `mixins.scss`, so the import
path every existing stylesheet already uses keeps working:

```scss
@use "path/to/assets/styles/mixins" as *;
```

There is no `patterns/index.scss` — `mixins.scss` is the barrel.

### `card-surface($radius)`

The white elevated surface. Emits exactly three declarations: `background-color`, `border-radius`,
`box-shadow`. Default radius is `0 0 $radius-20 $radius-20` — bottom corners only, because the card
normally sits under a section-title bar that rounds the top. Pass a full radius for a standalone card.

**Deliberately does not emit** layout: `padding`, `margin`, `width`, `max-width`, `height`, `overflow` all
differ between the three current consumers and stay in the consumer's own rule.

Consumers: `form-wrapper.component.scss:4`, `teddy-eddie-table.component.scss:4`,
`cambridge-path-table.component.scss:4`.

### `data-table-cells`

Every Material table override the two Teddy Eddie tables share: header row and header cell styling, row
background, cell padding and hairline dividers, in-cell form fields stripped of their notched outline, and
the disabled-cell text colour override.

> **Usage constraint — this one bites.** Include it inside a selector that scopes it. **Never at the root
> of a stylesheet.**
>
> The mixin emits an `::ng-deep` block. Nested under `.te-table` it compiles to
> `.te-table[_ngcontent-x] .mat-mdc-cell` — scoped to the component. At stylesheet root it compiles to a
> bare `.mat-mdc-cell` and overrides **every Material table in the app**.
>
> This is not a hypothetical. `semestr-report.component.scss:66` declares
> `::ng-deep .mat-mdc-row { height: 38px !important }` at root, and `year-report.component.scss:105`
> repeats it. That is why the Teddy Eddie tables get their row height from two components a reader would
> never think to look at. Do not reproduce the pattern in new work.

Consumers: `teddy-eddie-table.component.scss:16`, `cambridge-path-table.component.scss:22`,
`semestr-report.component.scss:42`, `year-report.component.scss:47`.

#### The three root-level `::ng-deep` leaks are knowingly retained

An earlier revision of this document assigned the cleanup of the two `.mat-mdc-row` rules to `S-05b`.
**That instruction was wrong and has been withdrawn.** `S-05b` investigated and found that neither the
table stylesheets nor `data-table-cells` sets a row height — so those two rules are the *only* source of
the Teddy Eddie tables' 38px rows. Deleting them would grow the reference tab's rows to Material's ~52px
default, which is a visible change to the tab that takes no delta in that slice.

There is a third leak of the same shape: `date.component.scss:5-7` declares
`::ng-deep .mat-mdc-form-field-flex { height: 36px }` at stylesheet root, so it governs every Material
form field in the app from the moment `app-date` first renders.

All three are **deliberately retained**, each with a comment at its site saying so. Removing any of them
is a visual change across surfaces far from the file it lives in, and belongs to a change that owns that
outcome — not to a drive-by cleanup.

### `form-row($gap)` / `form-col($of, $gap)`

The flex row that replaces Bootstrap's grid on form content. `form-row` is the container: flex, wrapping,
`align-items: flex-start`, full width, `$distance-16` gap by default. `form-col($of)` is one column,
sized by **how many equal columns the row holds** — `form-col(2)` is half of a two-column row,
`form-col(3)` a third, `form-col(1)` full width — collapsing to `100%` inside `breakpoint-max-tablet()`.

Taking the column *count* rather than a raw width is the point: two `width: 50%` children plus a `16px`
gap overflow their row, `calc((100% - 16px) / 2)` does not. Pass the same `$gap` to both if you override
it.

Both emit **declarations only and carry no selector**, the same convention `data-table-empty-cell` set —
the consumer keeps its own nesting, typically a `.field-row` class holding `.field-half` / `.field-full`
children.

Consumers: `semestr-report.component.scss:14`, `year-report.component.scss:14`,
`cambridge-report.component.scss:14`, `exam-term-rows.component.scss:20`.

### `data-table-empty-cell`

The italic centred "no data" row body. **Declarations only, no selector of its own** — the two consumers
nest their `.no-data-row .mat-cell` at different depths, and a mixin that emitted the selector would
change specificity in one of them. Include it inside whatever nesting the consumer already has.

Consumers: `teddy-eddie-table.component.scss:21`, `cambridge-path-table.component.scss:34`.

### `section-tile`

The section-header bar: the top half of the card surface, filled `$britannia-background` with
`$britannia-blue` text and a `$radius-20 $radius-20 0 0` radius.

The name is a typo for "tile"/"title" that predates this document. It was kept because it is already
published and consumed; renaming it would be a breaking change for no functional gain.

Consumer: `section-title.component.scss:4`.

## 4. Composition

The language is not only values. A surface built from correct tokens but the wrong building blocks still
will not look like the rest of the app. These are the components the Teddy Eddie report composes, and
composing them the same way is how a new screen lands in the same language.

Until `S-05b` each of these had exactly one consumer, so none passed the two-consumer test as a *token* —
they were listed because a new screen needs them more than it needs any variable. **That is no longer
true:** all four report forms now compose them, and the inputs below are the full published surface, not
just what Teddy Eddie happens to use.

| Component | Inputs | Call sites |
| --- | --- | --- |
| `app-form-wrapper` | `[sectionTitle]`, content projected | `teddy-eddie-report.component.html:4`, `semestr-report.component.html:4`, `year-report.component.html:4`, `cambridge-report.component.html:4` |
| `app-section-title` | `[sectionTitle]` (translate key) | `teddy-eddie-report.component.html:11`, `semestr-report.component.html:135`, `year-report.component.html:114` |
| `app-input-text` | `formControlName`, `[label]`, `[type]`, `[placeholder]`, `[required]`, `[errorMessage]` | `teddy-eddie-form.component.html:2`, `semestr-report.component.html:22`, `exam-term-rows.component.html:26` (`[type]="'number'"`) |
| `app-select` | the above minus `[type]`, plus `[itemList]`, `[multiple]`, `(selectionChange)` | `teddy-eddie-form.component.html:9`, `semestr-report.component.html:70` (`[multiple]`), `cambridge-report.component.html:69` (`(selectionChange)`) |
| `app-textarea` | `formControlName`, `[label]`, `[placeholder]`, `[required]`, `[errorMessage]`, `[rows]` | `semestr-report.component.html:124`, `year-report.component.html:282` |
| `app-date` | `formControlName`, `[label]`, `[required]`, `[errorMessage]`, `[hint]`, `[readonly]` | `teddy-eddie-form.component.html:17`, `semestr-report.component.html:48` (`[hint]`), `cambridge-report.component.html:19` (`[readonly]`) |
| `app-button` | `[translateKey]`, `[icon]`, `[type]`, `[disabled]`, `[variant]`, `(clicked)` | `teddy-eddie-report.component.html:38`, `semestr-report.component.html:353` (`[disabled]`), `exam-term-rows.component.html:8` (`[variant]`) |

### Choosing a form-field component

- Plain text, numbers, anything on one line → **`app-input-text`**. Pass `[type]` for `number` / `email`
  / `password`.
- Multi-line free text → **`app-textarea`**. `[rows]` sets the initial height; there is no height
  override, because the `.signature-textarea` rule the older forms carried was dead CSS (see §5).
- A fixed list of choices → **`app-select`**. `[itemList]` accepts either `SelectOptions<T>[]`
  (`{ label, value }`) or a flat `string[]`, which it normalizes internally. `[multiple]` for a
  multi-select — it round-trips an array through the control. `(selectionChange)` fires on a *user*
  choice only, staying silent on `patchValue`, so it is the right hook for a side effect.
- A date → **`app-date`**. `[hint]` renders a `<mat-hint>` when non-empty; `[readonly]` blocks typed
  input and opens the picker on click.
- Never a raw `mat-form-field` — **outside a table cell**. The wrappers carry the `appearance="outline"`
  choice, the translate pipe on labels, and the error-state plumbing that makes a control show its parent's
  validation state.
- **Inside a Material table cell, use a raw `<mat-form-field class="cell-field">`.** This is the one
  exception, and it is the established pattern, not a shortcut: `data-table-cells` styles `.cell-field`
  (`_data-table.scss:44`) precisely for in-cell controls, stripping the subscript area so a row stays one
  line high. The wrappers render their own label and error subscript, which is what you want in a form and
  wrong in a 38px table row. Call sites: `teddy-eddie-table.component.html`,
  `cambridge-path-table.component.html`, and the year-end detail and development-path tables
  (`year-report.component.html:146`, `:190`, `:199`, `:208`, `:221`, `:234`).

### Two composition rules worth copying

- `app-form-wrapper` already renders `app-section-title` above its card. Use the wrapper for a titled form
  section; use `app-section-title` alone when the content below it is not a form (the tables do this).
- **Buttons inside a `<form>` must pass `[type]`.** `app-button` defaults `type` to `"text"`, which is not
  a valid `<button>` type, so HTML's invalid-value default makes it a **submit** button. Pass
  `[type]="'submit'"` for the real submit and `[type]="'button'"` for every add/remove action, or the row
  buttons will generate a PDF.

### `app-button` variants

| Variant | Fill / label | For |
| --- | --- | --- |
| `primary` (default) | `$britannia-dark` / `$white` | The page's main action — "download PDF". |
| `secondary` | `$britannia-background` / `$britannia-blue` | Repeated in-form actions — "add a row", "add a comment". Deliberately lower emphasis so they do not compete with submit. Same fill as the section-title bar, so they read as one family. |
| `danger` | `$britannia-red` / `$white` | Destructive actions — removing a row. |

### `app-input-text` has two inputs on purpose

`input-text.component.html` spells the `type="number"` case out as its own `@if` branch instead of
binding `[type]` on a single input. This looks like duplication and is not: Angular's
`NumberValueAccessor` selector is `input[type=number][formControl]`, which matches a **static attribute
only**. Behind a binding the control silently falls back to `DefaultValueAccessor` and starts writing
`"85"` where it used to write `85`. That reaches the Cambridge PDF through `GenerateTable.formatScore`,
where `0` renders `-` and `"0"` renders `0%`. `input-text.component.spec.ts` guards the invariant —
do not collapse the branches.

## 5. What is deliberately not the language

These repeat in the codebase but were **not** extracted. Each entry exists so the question does not get
re-litigated every time someone notices the duplication.

| Not extracted | Where it repeats | Why not |
| --- | --- | --- |
| Fixed generate-button offsets | `app.component.scss:6`, `teddy-eddie-report.component.scss:8`, `semestr-report.component.scss:54`, `year-report.component.scss:97` use `bottom: 30px`; `cambridge-report.component.scss:48` uses `bottom: 10px` | Repeated by coincidence, not by intent, and already inconsistent. A token would freeze the inconsistency and imply a decision nobody made. `S-05b` left the `10px` outlier alone for the same reason. |
| The tab bar's copy of the elevation shadow | `tab-group.component.scss:15` | Left alone on purpose: it is app shell rather than report layer, and it uses a full `20px` radius, not the card's bottom-only radius. `S-01` should absorb it when it builds the sign-in surface. |

Two rows were removed from this table by `S-05b`, and the reasons are worth keeping:

- **`.subtitle { font: 600 22px/1 $font }`** was listed as a live repetition across the three older report
  stylesheets. All three now compose `app-section-title` instead, so the class is gone from every one of
  them. `rating-scale.component.scss:3` still declares its own `.subtitle` at `600 20px/24px` — a
  different value on a surface `S-05b` did not touch.
- **`height: 250px !important` on signature textareas** was listed as un-extracted repetition. It was in
  fact **dead CSS**: the rule existed in all three stylesheets and was applied by no template. `S-05b`
  deleted it rather than leaving an entry describing something that never ran. This is why `app-textarea`
  has no height input.

## 6. Known costs

Recorded rather than hidden, so nobody rediscovers them as surprises.

- **Literal naming couples names to values.** `$radius-20` says what it is, not what it is for. If
  `S-05b` changes the corner radius to something else, the name will misdescribe its own value. This was a
  deliberate choice for consistency with `$distance-8` and friends; the alternative was a semantic layer
  alongside the existing brand names.
- **Two tokens have no consumer**: `$distance-32` and `$distance-40`. They were kept rather than deleted
  because deleting names from a layer meant to be a stable contract is the wrong default. `$britannia-red`
  was the third until `S-05b` gave it to `app-button`'s `danger` variant.
- **`tab-group.component.scss` still holds a fifth copy of the elevation shadow** — see §5.
- **Three root-level `::ng-deep` blocks escape their components on purpose** — see §3. They are load
  bearing, not oversights.
- **Almost nothing enforces any of this.** There is still no stylelint config and no visual-regression
  harness; the build failing on a missing SCSS member remains the whole *style* safety net. What did
  arrive with `S-05b` is one layer down: form-model contract specs in
  `semestr-report.component.spec.ts`, `year-report.component.spec.ts`, and
  `cambridge-report.component.spec.ts` freeze each report's control names, its `FormArray`s, and — for
  Cambridge — the inner control names of a generated exam row. They say nothing about how a form *looks*,
  but they make "the restyle did not move a control" a machine-checked fact rather than a claim.

## 7. Verifying that a style change is a visual no-op

Used when a change is meant to restructure styles without moving anything on screen.

1. **Populate the tables first.** `.is-empty` hides both Teddy Eddie tables' header rows
   (`teddy-eddie-table.component.scss:25`). On a freshly loaded tab, none of the table styling is on
   screen, so inspecting the default state proves nothing. Select an age, then add a row to the English
   immersion table and to the Cambridge path table.
2. **Check by eye**, on all four tabs: table header fill; header text colour, weight, size; cell padding
   and dividers; in-cell fields still borderless; disabled-cell text colour; empty-state row; card radius
   and shadow; section-title bar.
3. **Clear the age** and confirm both tables return to hiding their header rows.
4. **For anything touching module load order** — a new `@use`, a moved mixin, a changed barrel — also
   compile the affected stylesheet before and after and diff the generated CSS:

   ```bash
   git show HEAD:path/to/file.component.scss > path/to/__before.scss
   npx sass --no-source-map path/to/__before.scss > before.css
   npx sass --no-source-map path/to/file.component.scss > after.css
   git diff --no-index before.css after.css
   rm path/to/__before.scss
   ```

   Write the temporary file into the **same directory** as the original so its relative `@use` paths still
   resolve. This is the only check that catches a cascade-order shift in `_reset.scss`, which no amount of
   looking at the running app will reveal.

5. **Record the outcome** under `## Progress` in the change's plan. An unrecorded check did not happen —
   the same convention `docs/pdf-fidelity-check.md` §8 establishes for PDFs.

**The PDF fidelity procedure is a separate concern.** `docs/pdf-fidelity-check.md` §1 lists its triggers:
the `pdfmake` builders, the base64 assets, the Cambridge helper, and the `pdfmake` version. A pure style
change hits none of them — pdfmake builds its documents from JavaScript objects and never reads the DOM or
a stylesheet. Do not run `npm run test:capture` for a styling change.

## 8. How `S-05b` was verified

Recorded because the slice touched `*-report.component.ts` — a file the PDF guardrail names — and
deliberately did **not** run the capture procedure. The reasoning has to survive the change that made it.

**What was checked.** Composition adopted on all three older forms; the form model frozen by the §6
contract specs; `npm run build`, `npm run lint`, and the Karma suite green at every phase boundary; each
tab compared by eye against the Teddy Eddie tab and confirmed by the human before its commit, per §7.

**Why the capture procedure was not run.** `docs/pdf-fidelity-check.md` §1 is written by trigger, and this
change trips one. It was read by purpose instead, and that reading rests on three checkable facts:

1. No line of any document definition changed in any of the three components — an explicit automated
   criterion at every phase. The edit scope was `imports` only for Cambridge, and `imports` plus
   option-list getters for the semester form. **The year-end form went wider**: its two hand-rolled tables
   became `mat-table`s, so `year-report.component.ts` also gained `detailColumns`, `pathColumns`,
   `detailRows`, `getPathRowGroup()`, and `trackByIndex`. All five feed the template only; the builder
   reads `form.value`, and the diff on that file contains no hunk past line 130.
2. The fidelity fixtures never drive the DOM. They call `form.patchValue` and the components' own
   array-building methods, so template structure is invisible to them — and the form model they patch
   into is the one the contract specs freeze.
3. The `pdfmake` builders read no translation keys, so the i18n work could not reach a PDF.

The smoke specs still render every fixture end-to-end at every phase, so a builder that stopped working
fails loudly.

**The one place this nearly broke.** Composing the Cambridge exam-row `score` field through
`app-input-text` would have changed the control's value from `85` to `"85"` — fact 1 held, but the *value*
would not have. That was caught before it landed and fixed at the wrapper (see §4), not worked around at
the call site.

**The one place it did break, and was overruled.** `S-05b` was planned around a bright-line rule: only two
kinds of edit to a `*-report.component.ts`, `imports` and option-list getters, with any third kind forcing
the capture. The year-end form needed a third kind — five `mat-table` plumbing members, listed in fact 1 —
and the capture was still not run. The narrower ground was that all five are PDF-inert: they feed the
template, the builder reads `form.value`, and that file's diff stops short of `generatePDF` entirely.

That is a weaker argument than the one it replaced. The first rested on a rule you can check with `git
diff`; this one rests on reading what the added code does. **Do not treat it as precedent.** For the next
slice the line is: if an edit reaches `form.value`, changes what any control holds, or touches a document
definition, run the capture procedure — regardless of how the edit is categorised.
