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
| `$britannia-dark` | `#2d3845` | Raised button fill | `button.component.scss:7` |
| `$britannia-background` | `#d6dcf5` | Section-title bar fill | `patterns/_section-title.scss:13` |
| `$britannia-light-blue` | `#eef0fa` | Data-table header row fill | `patterns/_data-table.scss:15` |
| `$white` | `#ffffff` | Card and table-row surfaces | `patterns/_card.scss:7` |
| `$black-87` | `rgba(0, 0, 0, 0.87)` | Disabled-cell text, kept legible | `patterns/_data-table.scss:77` |
| `$black-08` | `rgba(0, 0, 0, 0.08)` | Header-cell divider | `patterns/_data-table.scss:24` |
| `$black-06` | `rgba(0, 0, 0, 0.06)` | Body-cell divider | `patterns/_data-table.scss:37` |
| `$britannia-red` | `#d4162f` | Sign-in denial and error messages | `sign-in.component.scss` |

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
| `$distance-32` | `32px` | `sign-in.component.scss` (card padding) |
| `$distance-40` | `40px` | `sign-in.component.scss` (card top margin), `app.component.scss` (boot indicator) |

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
| `$tablet` / `breakpoint-max-tablet()` | `768px` | `button.component.scss:16`, `teddy-eddie-form.component.scss:15` |
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
> This is not a hypothetical. `semestr-report.component.scss:21` declares
> `::ng-deep .mat-mdc-row { height: 38px !important }` at root, and `year-report.component.scss:98`
> repeats it. That is why the Teddy Eddie tables get their row height from two components a reader would
> never think to look at. If you are working on `S-05b`, those two lines are yours to clean up — do not
> reproduce the pattern.

Consumers: `teddy-eddie-table.component.scss:16`, `cambridge-path-table.component.scss:22`.

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

Each had exactly one consumer when this was written, so none passed the two-consumer test as a *token* —
they are listed here because a new screen needs them more than it needs any variable. `S-01` bore that
out: the sign-in screen it added is built from `app-button` and the published tokens, and needed no new
pattern.

| Component | Inputs as used today | Call site |
| --- | --- | --- |
| `app-form-wrapper` | `[sectionTitle]`, content projected | `teddy-eddie-report.component.html:4` |
| `app-section-title` | `[sectionTitle]` (translate key) | `teddy-eddie-report.component.html:11`, `:24` |
| `app-input-text` | `formControlName`, `[label]`, `[required]`, `[errorMessage]` | `teddy-eddie-form.component.html:2` |
| `app-select` | the above plus `[itemList]` | `teddy-eddie-form.component.html:9` |
| `app-date` | `formControlName`, `[label]`, `[required]`, `[errorMessage]` | `teddy-eddie-form.component.html:17` |
| `app-button` | `[translateKey]`, `[icon]`, `[disabled]`, `(clicked)`, label projected | `teddy-eddie-report.component.html:38`, `sign-in.component.html`, `header.component.html` |

Two things worth copying from `teddy-eddie-report.component.html`:

- `app-form-wrapper` already renders `app-section-title` above its card. Use the wrapper for a titled form
  section; use `app-section-title` alone when the content below it is not a form (both tables do this).
- Form fields go through `app-input-text` / `app-select` / `app-date`, never a raw `mat-form-field`. The
  wrappers carry the `appearance="outline"` choice, the translate pipe on labels, and the error-state
  plumbing. The three older report forms drop raw `mat-form-field` into Bootstrap columns — that is the
  design being replaced, not a model.

## 5. What is deliberately not the language

These repeat in the codebase but were **not** extracted. Each entry exists so the question does not get
re-litigated every time someone notices the duplication.

| Not extracted | Where it repeats | Why not |
| --- | --- | --- |
| `.subtitle { font: 600 22px/1 $font }` | `semestr-report.component.scss:3`, `cambridge-report.component.scss:3`, `year-report.component.scss:4`; `rating-scale.component.scss:3` uses `600 20px/24px` | It belongs to the older design that `S-05b` replaces with `section-tile`. Tokenizing it would enshrine what is being removed — and the four sites do not even agree on a value. |
| Fixed generate-button offsets | `app.component.scss:6`, `teddy-eddie-report.component.scss:8`, `semestr-report.component.scss:7`, `year-report.component.scss:8` use `bottom: 30px`; `cambridge-report.component.scss:8` uses `bottom: 10px` | Repeated by coincidence, not by intent, and already inconsistent. A token would freeze the inconsistency and imply a decision nobody made. |
| `height: 250px !important` on signature textareas | `semestr-report.component.scss:13`, `cambridge-report.component.scss:13`, `year-report.component.scss:94` | Same shape of accident. Also `!important` — a token would dress up a workaround as a design decision. |
| ~~The tab bar's copy of the elevation shadow~~ — **absorbed by `S-01`, 2026-07-28** | `tab-group.component.scss` | It now uses `ds.$shadow-1`. Verified a visual no-op by the §7.4 CSS diff, which came back empty. The full `20px` radius stays as it was — that is app shell, not the card's bottom-only radius, and it is still not part of the language. |

## 6. Known costs

Recorded rather than hidden, so nobody rediscovers them as surprises.

- **Literal naming couples names to values.** `$radius-20` says what it is, not what it is for. If
  `S-05b` changes the corner radius to something else, the name will misdescribe its own value. This was a
  deliberate choice for consistency with `$distance-8` and friends; the alternative was a semantic layer
  alongside the existing brand names.
- ~~**Three tokens have no consumer**~~ — **all three found one in `S-01`, 2026-07-28.** `$britannia-red`
  is the sign-in screen's denial message, exactly the use this section speculated about; `$distance-32`
  and `$distance-40` are its padding and top margin. Keeping names in a layer meant to be a stable
  contract, rather than deleting them for want of a call site, paid off within one slice.
- ~~**`tab-group.component.scss` still holds a fifth copy of the elevation shadow**~~ — absorbed, see §5.
- **Nothing enforces any of this.** There is no stylelint config and no visual-regression harness. The
  build fails on a missing SCSS member and that is the whole automated safety net.

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
