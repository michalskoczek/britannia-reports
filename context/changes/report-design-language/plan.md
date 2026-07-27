# Report Design Language Extraction — Implementation Plan

## Overview

The Teddy Eddie report carries the app's newest visual language, but that language was never written
down. It lives implicitly in four component stylesheets, duplicated by copy-paste: the same elevation
shadow appears five times, the same `20px` card radius five times, and the two Teddy Eddie table
stylesheets are ~95% identical across ~110 lines each.

This change extracts the repeated values into named SCSS tokens, extracts the repeated blocks into
composite mixins, repoints the four stylesheets that duplicate them, and records the result — including
the boundary of what deliberately is *not* part of the language — in `docs/design-language.md`.

**No user-visible change.** This is roadmap slice `S-05a`, the enabling step that unblocks `S-05b`
(`report-design-refresh`) and `S-01` (`google-sign-in-gate`) to run in parallel without fighting over
`src/assets/styles/utils/`.

## Current State Analysis

### The token layer is thinner than it looks

`src/assets/styles/utils/` holds four partials barrelled through `index.scss`:

| File | Contents | Dead entries |
| --- | --- | --- |
| `_colors.scss:1-6` | 6 flat colour variables | `$britannia-red` (0 call sites) |
| `_typography.scss:1` | `$font` only | — |
| `_spacing.scss:1-5` | 5 distances | `$distance-32`, `$distance-40` (0 call sites) |
| `_breakpoints.scss:1-29` | 3 widths + 4 mixins | `breakpoint-desktop()`, `breakpoint-desktop-xxl()` (0 call sites) |
| `_reset.scss` | global reset, forwarded first | — |

`_breakpoints.scss:25-29` carries a copy-paste bug: `breakpoint-desktop-xxl()` tests `$desktop`, not
`$xxl-desktop`. It has zero call sites today, so the bug is latent — and it is exactly the kind of thing
`S-05b` would step on while adding responsive rules.

`src/assets/styles/mixins.scss` adds three mixins: `flex-center`, `default-button`, and `section-tile`
(the section-header bar).

### The actual visual language lives in three undocumented patterns

**1. Card surface** — white background, `border-radius: 0 0 20px 20px`, and the same three-line Material
elevation shadow, typed out verbatim in four places, plus a fifth with a full `20px` radius:

- `src/app/shared/components/form/form-wrapper/form-wrapper.component.scss:10-13`
- `src/app/teddy-eddie-report/tables/teddy-eddie-table/teddy-eddie-table.component.scss:9-12`
- `src/app/teddy-eddie-report/tables/cambridge-path-table/cambridge-path-table.component.scss:9-12`
- `src/assets/styles/mixins.scss:31-34` (inside `section-tile`, the top half of the same card)
- `src/app/shared/components/UI/tab-group/tab-group.component.scss:15-16` (full radius, app shell)

**2. Section title** — `mixins.scss:17-35`. It is the card's top half (`border-radius: 20px 20px 0 0`,
`$britannia-background` fill, `$britannia-blue` text) but it hardcodes `Montserrat, sans-serif` instead of
`ds.$font` (`mixins.scss:18`) and re-types the shadow rather than sharing it.

**3. Data table** — `teddy-eddie-table.component.scss` (106 lines) and `cambridge-path-table.component.scss`
(111 lines) are near-duplicates: header row filled `#eef0fa` (a colour that exists in neither
`_colors.scss` nor anywhere else), `$britannia-blue` 600/13px header cells, hairline cell borders,
Material form fields stripped of their notched outline inside cells, a disabled-text colour override, and
an italic empty-state row.

They diverge in three places, and the divergence is structural rather than cosmetic:

| | `teddy-eddie-table` | `cambridge-path-table` |
| --- | --- | --- |
| `.no-data-row` | nested under `.wrapper` (`:91`) | nested under `.cambridge-table` (`:101`) |
| `is-empty` | separate `.te-table.is-empty` rule (`:101`) | `&.is-empty` inside the table block (`:20`) |
| checkbox centring | absent | `.mat-mdc-checkbox` rule (`:95-98`) |

Different nesting means different selector specificity. A naive merge into one mixin would emit different
selectors than exist today — which is a silent visual risk, not a formatting detail.

### Only Teddy Eddie composes the shared surfaces

`app-form-wrapper` and `app-section-title` appear exclusively in
`src/app/teddy-eddie-report/teddy-eddie-report.component.html:4,11,24`. The other three report forms
hand-roll Bootstrap `.row` / `.col-*` with raw `mat-form-field` children and a local
`.subtitle { font: 600 22px/1 $font }`. So "the Teddy Eddie visual language" is, concretely, "the
components the Teddy Eddie report composes" — which is why the extraction target is well-defined.

### There is no automated guard for CSS

No stylelint. No visual-regression harness. `npm test` (Karma + Jasmine) smoke-covers PDF rendering and
asserts nothing about styles. The build fails on a missing SCSS member, and that is the only automated
signal this change gets for free.

### The PDF fidelity procedure does not apply here

`docs/pdf-fidelity-check.md` §1 lists its triggers: the four `pdfmake` builders, the base64 assets, the
Cambridge helper, and the `pdfmake` version. This change touches none of them, and pdfmake constructs its
documents from JavaScript objects — it never reads the DOM or a stylesheet. **Do not run
`npm run test:capture` for this change.** Its *format*, however, is the model for the document Phase 3
writes.

## Desired End State

`src/assets/styles/` publishes a named, documented contract:

- `utils/` holds tokens only — colours, typography, spacing, breakpoints, and two new partials for radius
  and elevation.
- `patterns/` holds composite mixins — card surface, data table, section title.
- `mixins.scss` forwards `patterns/` and keeps the two generic helpers, so **every existing consumer's
  `@use` path stays valid and unchanged**.
- Four stylesheets that previously duplicated those patterns now include them.
- `docs/design-language.md` describes each published token and mixin — what it is, when to use it, where
  it already runs — and names what was deliberately left out of the language.
- `src/CLAUDE.md` points at that document and no longer describes a file layout that has changed.

**Verification**: a human confirms the app looks unchanged on all four tabs — with the Teddy Eddie tables
populated, not empty — and `npm run build`, `npm run lint`, and the test suite are green.

### Key Discoveries

- The elevation shadow is duplicated five times; four are in scope, `tab-group.component.scss:15-16` is
  deliberately left alone (see "What We're NOT Doing").
- `#eef0fa` (`teddy-eddie-table.component.scss:22,26`, `cambridge-path-table.component.scss:28,32`) is a
  brand colour that never made it into `_colors.scss`.
- **Empty tables hide their own header rows** (`teddy-eddie-table.component.scss:101-105`). On a freshly
  loaded Teddy Eddie tab, both tables are empty, so *none* of the table styling this change touches is on
  screen. Inspecting the default state proves nothing — an age must be selected first.
- `$font` is `"Montserrat", sans-serif` (quoted); `section-tile` hardcodes `Montserrat, sans-serif`
  (unquoted). Substituting the token changes the compiled CSS text but not what any browser renders.
- `mixins.scss:1` imports `utils/index` only for `section-tile`; once that mixin moves, the import goes
  with it.

## What We're NOT Doing

- **Not repointing `tab-group.component.scss`.** It is the app shell, not the report layer, and it uses a
  full `20px` radius rather than the card's bottom-only radius. Its shadow copy stays; the document records
  it as a known outstanding duplicate for `S-01` to absorb when it builds the sign-in surface.
- **Not touching the three older report forms.** Restyling them is `S-05b`. Their local
  `.subtitle { font: 600 22px/1 $font }` is *not* extracted — it belongs to the design being replaced, so
  tokenizing it would enshrine it.
- **Not creating new Angular components.** No `app-card`, no `app-data-table`. The roadmap names that as
  the point where this slice absorbs `S-05b`'s work.
- **Not introducing CSS custom properties.** The contract is SCSS variables and mixins, matching what all
  14 existing stylesheets already do.
- **Not deleting unused tokens.** `$britannia-red`, `$distance-32`, `$distance-40` stay; `S-01` may well
  need the brand red for sign-in error states.
- **Not renaming `section-tile`** despite the odd name — it is an existing published member.
- **Not adding stylelint or a visual-regression harness.** Both are real gaps; neither is this slice.
- **Not touching any `*.component.ts`, `*.component.html`, `pdfmake` builder, or i18n bundle.**

## Implementation Approach

Three phases, ordered so the risky one sits in the middle with a proven-inert token layer behind it and a
documented contract in front of it.

Phase 1 is additive-only: it adds tokens nothing consumes yet, so it cannot change a pixel.

Phase 2 carries all the risk. It creates the pattern mixins and repoints four stylesheets. The governing
rule is **emit the same CSS**: where two consumers differ structurally, the mixin emits declarations and
the consumer keeps its own selector nesting, rather than the mixin normalizing selectors and silently
shifting specificity.

Phase 3 writes the contract down and repairs the documents the first two phases made stale.

## Critical Implementation Details

**Selector specificity is the failure mode, not values.** The two table stylesheets nest `.no-data-row`
and `is-empty` differently (see the table in Current State Analysis). A mixin that emits complete rules
for those two selectors will produce different specificity in at least one of the two consumers. Both
mixins introduced for the empty state must therefore emit **declarations only**, to be included inside
whatever selector the consumer already has.

**The visual check must be done with populated tables.** `.is-empty` hides header rows, so the default
Teddy Eddie tab renders none of the table styling this change rewrites. Select an age to populate the
English immersion and Cambridge path tables, and add at least one row to each, before judging whether
anything moved. Checking the default state proves nothing about the riskiest surface in the change.

## Phase 1: Token layer

### Overview

Add the tokens the pattern layer will consume. Nothing is repointed in this phase, so it is a no-op by
construction: every change here declares a variable or fixes a mixin with zero call sites, and none of
them emits a byte of CSS.

### Changes Required:

#### 1. New colour tokens

**File**: `src/assets/styles/utils/_colors.scss`

**Intent**: Give names to the four colour values the data-table pattern repeats and that no token covers
today.

**Contract**: Append `$britannia-light-blue` (`#eef0fa`, the table header fill), `$black-87`
(`rgba(0, 0, 0, 0.87)`, the disabled-cell text override), `$black-08` (`rgba(0, 0, 0, 0.08)`, header-cell
divider), and `$black-06` (`rgba(0, 0, 0, 0.06)`, body-cell divider). Existing variables are untouched —
this is append-only. Naming follows the literal convention chosen for this change: names describe the
value, not the role.

#### 2. Radius token

**File**: `src/assets/styles/utils/_radius.scss` (new)

**Intent**: Name the `20px` corner radius that the card, the section title, and the tab bar all use.

**Contract**: Declares `$radius-20: 20px`. Known cost of the literal naming convention: if `S-05b` changes
the radius, the name will misdescribe its value — recorded in Phase 3's document rather than pre-solved
here.

#### 3. Elevation token

**File**: `src/assets/styles/utils/_elevation.scss` (new)

**Intent**: Name the three-line Material elevation shadow that five stylesheets currently re-type.

**Contract**: Declares `$shadow-1` holding the exact comma-separated triple used today —
`0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)`.
The value must be byte-equivalent to the existing declarations; this token's whole purpose is that its
consumers compile to what they compile to today.

#### 4. Barrel the new partials

**File**: `src/assets/styles/utils/index.scss`

**Intent**: Make the two new partials reachable through the single `utils/index` entry point every
consumer already uses.

**Contract**: Add `@forward "radius";` and `@forward "elevation";`. `_reset.scss` must stay first — it
emits global CSS and its position determines cascade order.

#### 5. Breakpoint bug fix

**File**: `src/assets/styles/utils/_breakpoints.scss`

**Intent**: `breakpoint-desktop-xxl()` tests `$desktop` instead of `$xxl-desktop`, so it is an exact
duplicate of `breakpoint-desktop()`. Fix it before the token layer becomes the documented reference and
`S-05b` starts calling it.

**Contract**: Line 26's media query switches to `$xxl-desktop`. The mixin has zero call sites, so the fix
emits no CSS change anywhere.

### Success Criteria:

#### Automated Verification:

- Build succeeds: `npm run build`
- Linting passes: `npm run lint`
- Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- `src/assets/styles/utils/_radius.scss` and `_elevation.scss` exist and are reachable through
  `utils/index.scss`

#### Manual Verification:

- Human confirms the four report tabs look unchanged. Phase 1 is additive and emits no CSS, so any
  difference at all would mean the no-op reasoning is wrong and the phase must stop

**Implementation Note**: After completing this phase and all automated verification passes, pause here for
manual confirmation from the human that the manual testing was successful before proceeding to the next
phase.

---

## Phase 2: Pattern layer and repoint

### Overview

Create `src/assets/styles/patterns/` holding the three composite mixins, turn `mixins.scss` into a
forwarding barrel so no existing import path changes, and repoint the three component stylesheets that
duplicate the patterns. This phase carries the change's entire visual risk.

**Repoint one file at a time.** Changes #5, #6, and #7 land in that order, each followed by
`npm run build` and a targeted look at the surface it touches — the form wrapper's card edge for #5, the
English immersion table for #6, the Cambridge path table for #7 — and each committed separately. The
phase's governing risk is specificity drift, and a whole-page comparison run once at the end would report
a difference without saying which of the three caused it. Separate commits also make the revert one
command rather than a manual unwind.

### Changes Required:

#### 1. Card surface pattern

**File**: `src/assets/styles/patterns/_card.scss` (new)

**Intent**: Name the white elevated surface shared by the form wrapper and both tables.

**Contract**: Exports `@mixin card-surface($radius: 0 0 ds.$radius-20 ds.$radius-20)` emitting exactly
three declarations — `background-color`, `border-radius`, `box-shadow: ds.$shadow-1`. Layout declarations
that differ between consumers (`padding`, `margin`, `width`, `max-width`, `height`, `overflow`) stay in the
consumer and are **not** absorbed into the mixin.

#### 2. Data table pattern

**File**: `src/assets/styles/patterns/_data-table.scss` (new)

**Intent**: Collapse the ~90 lines of Material table overrides duplicated verbatim between the two Teddy
Eddie table stylesheets into one definition.

**Contract**: Exports two mixins.

`@mixin data-table-cells` emits the shared `::ng-deep` block: `.mat-mdc-header-row` and
`.mat-mdc-header-cell` (`$britannia-light-blue` fill, `$britannia-blue` 600/13px `$font`, `$black-08`
right divider dropped on `:last-of-type`), `.mat-mdc-row` (`$white`), `.mat-mdc-cell` (`8px 4px` padding,
`$black-06` right divider dropped on `:last-of-type`), `.cell-field` (hidden subscript wrapper,
transparent field wrapper with `0 8px` padding, transparent notched-outline segments), the disabled
form-field outline rule, and the `.mdc-text-field--disabled` text/`-webkit-text-fill-color` override to
`$black-87`.

`@mixin data-table-empty-cell` emits **declarations only** — `24px 16px` padding, centred text,
`$britannia-blue`, italic, `$white` background. It carries no selector of its own. The two consumers nest
their `.no-data-row .mat-cell` differently and must keep their own nesting; a mixin that emitted the
selector would change specificity in at least one of them.

The `.mat-mdc-checkbox` centring rule is specific to the Cambridge path table and stays there.

**Usage constraint — part of the published contract.** `data-table-cells` must be included inside a
selector that scopes it, never at the root of a stylesheet. Included under `.te-table` it compiles to
`.te-table[_ngcontent-x] .mat-mdc-cell`; included at root it compiles to a bare `.mat-mdc-cell` and
overrides every Material table in the app. This is not hypothetical — `semestr-report.component.scss:21`
and `year-report.component.scss:98` both declare root-level `::ng-deep .mat-mdc-row { height: 38px
!important }`, and that is what governs the Teddy Eddie tables' row height today, from two unrelated
components. `S-05b` rewrites exactly those two files, so the constraint must travel with the mixin into
Phase 3's document.

#### 3. Section title pattern

**File**: `src/assets/styles/patterns/_section-title.scss` (new)

**Intent**: Move `section-tile` out of the mixin grab-bag and make it consume the tokens it currently
hardcodes.

**Contract**: `section-tile` moves here under its existing name — renaming would break
`section-title.component.scss:4` and the name is already published. Three substitutions, each
value-preserving: `Montserrat, sans-serif` → `ds.$font`, the inline shadow triple → `ds.$shadow-1`,
`20px 20px 0 0` → `ds.$radius-20 ds.$radius-20 0 0`. Note that `$font` is quoted (`"Montserrat"`) where
the current literal is not — the compiled CSS text differs, what the browser renders does not.

#### 4. `mixins.scss` becomes a forwarding barrel

**File**: `src/assets/styles/mixins.scss`

**Intent**: Keep every existing `@use` path valid. Six stylesheets import this file today, under three
different aliasing styles (`as *`, `as mx`, `as mixins`); forwarding the pattern layer from here means none
of them changes.

**Contract**: The file becomes one `@forward` per pattern partial — card, data-table, section-title —
plus the two generic helpers `flex-center` and `default-button`, kept verbatim. There is deliberately **no
`patterns/index.scss` barrel**: `mixins.scss` already is the barrel, and a second one would only be
forwarded by the first. `section-tile` is no longer defined here but stays resolvable through the forward.
The `@use "../../assets/styles/utils/index" as ds` at line 1 is dropped — it existed only for
`section-tile`, and the remaining two mixins reference no tokens.

#### 5. Repoint the form wrapper

**File**: `src/app/shared/components/form/form-wrapper/form-wrapper.component.scss`

**Intent**: Replace the inline background/radius/shadow triple with the card mixin.

**Contract**: `.wrapper` includes `card-surface` and keeps its own `margin`, `padding: 16px`, `width`, and
`height: max-content`. Compiled output for this file must be equivalent to what it produces today.

#### 6. Repoint the Teddy Eddie table

**File**: `src/app/teddy-eddie-report/tables/teddy-eddie-table/teddy-eddie-table.component.scss`

**Intent**: Consume the card and data-table patterns instead of restating them.

**Contract**: `.wrapper` includes `card-surface`, keeping `margin`, `padding: 8px`, `width`, `max-width`,
and `overflow`. `.te-table` keeps its own `width: min-content`, `background`, and `overflow`, and includes
`data-table-cells`. The existing `.wrapper .no-data-row .mat-cell` nesting is preserved and its body
becomes `data-table-empty-cell`. `.te-table.is-empty` stays exactly where and as it is.

#### 7. Repoint the Cambridge path table

**File**: `src/app/teddy-eddie-report/tables/cambridge-path-table/cambridge-path-table.component.scss`

**Intent**: Same repoint, against this file's own nesting.

**Contract**: `.wrapper` includes `card-surface` with its existing layout declarations retained.
`.cambridge-table` includes `data-table-cells` and keeps its nested `&.is-empty` block, its
`.mat-mdc-checkbox` centring rule, and its `.no-data-row` nested one level deeper than the Teddy Eddie
file's — whose body becomes `data-table-empty-cell`.

### Success Criteria:

#### Automated Verification:

- Build succeeds: `npm run build`
- Linting passes: `npm run lint`
- Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`
- The elevation shadow triple no longer appears literally in any stylesheet outside
  `src/assets/styles/utils/_elevation.scss`, except `tab-group.component.scss` (deliberate) — verify by
  searching for `0px 2px 1px -1px`
- `#eef0fa` no longer appears literally outside `_colors.scss`
- Both table stylesheets are at least 40 lines shorter than before this phase

#### Manual Verification:

- **Check the Teddy Eddie tab with both tables populated** — select an age and add a row to the English
  immersion table and to the Cambridge path table. `.is-empty` hides header rows, so the default state
  shows none of the table styling this phase rewrites; looking at it proves nothing
- Human confirms no visible change in: table header fill colour; header text colour, weight, and size;
  cell padding and hairline dividers; in-cell form fields still borderless; disabled-cell text colour;
  empty-state row (padding, centring, italic, colour); card corner radius and shadow on the form wrapper
  and both tables; section-title bar (fill, text, border, radius, shadow)
- The three non-Teddy-Eddie tabs are unchanged — they share only the section title and card patterns
  indirectly, but a regression there would be the loudest possible signal that a selector shifted
- Empty-state behaviour still works: with no age selected, both tables hide their header rows
- Each of the three repoints was built, spot-checked, and committed separately, so a regression can be
  bisected to one file
- Reset-rule position in the compiled output verified for `section-title.component.scss` and
  `form-wrapper.component.scss` — the two stylesheets that reach `_reset.scss` only through `mixins.scss`,
  whose module load path this phase changes. Build before and after, and compare where the reset's rules
  land in each component's emitted styles. A cascade-order shift in a reset rule is the one regression
  class an eye check on the running app structurally cannot show.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for
manual confirmation from the human that the manual testing was successful before proceeding to the next
phase.

---

## Phase 3: Document the language and repair stale conventions

### Overview

Write down what was extracted, why, and — the part that makes this slice worth doing — what deliberately
is *not* part of the language. Then update the convention files the first two phases made inaccurate.

### Changes Required:

#### 1. The design-language document

**File**: `docs/design-language.md` (new)

**Intent**: Publish the contract. `S-05b` and `S-01` read this to know what to build against; without it
this change is a refactor, not an enabling slice.

**Contract**: Follows the shape of `docs/pdf-fidelity-check.md` — numbered sections, tables, concrete file
references. Covers:

- **What the language is and where it came from** — the Teddy Eddie report, named as the reference by
  `src/CLAUDE.md`, and the criterion used to draw the boundary: a value or block became part of the
  language only if it already had two or more consumers *and* `S-05b` or `S-01` will need it.
- **Published tokens** — one row per token: name, value, what it is for, and at least one real call site.
- **Published patterns** — one entry per mixin: what it emits, what it deliberately does not emit (layout
  declarations, selectors for the empty state), and how to include it. `data-table-cells` carries its
  scoping constraint as part of its entry: it must be included inside a selector, never at stylesheet
  root, because its `::ng-deep` block escapes component encapsulation otherwise. Cite
  `semestr-report.component.scss:21` as the live example of what that looks like when it goes wrong.
- **Composition** — the language is not only values. `app-form-wrapper` (section title plus card),
  `app-section-title`, `app-input-text`, `app-select`, `app-date`, and `app-button` are the components the
  Teddy Eddie report composes, and composing them the same way is how a new surface ends up in the same
  language. Each entry names the component, its inputs as used today, and its single existing call site in
  `teddy-eddie-report.component.html` / `teddy-eddie-form.component.html`. They have one consumer each, so
  they fail this change's two-consumer test as *tokens* — but `S-01` builds an entire new screen and needs
  this section more than it needs any variable. Documentation only: no component is created, changed, or
  moved.
- **What is deliberately not the language** — the three older forms' `.subtitle`, the fixed-position
  generate-button offsets, the `250px` signature textareas, and the tab bar's shadow copy, each with a
  one-line reason. This section is the point of the document.
- **Known costs** — literal token naming means `$radius-20` will misdescribe its value if `S-05b` changes
  the radius; `$britannia-red`, `$distance-32`, and `$distance-40` are published but have no consumer;
  `tab-group.component.scss` still holds a fifth copy of the shadow.
- **Stability rule** — these names are a contract `S-01` and `S-05b` compile against. Extend additively;
  a rename is a breaking change.
- **How to verify a style change is a visual no-op** — the procedure this change ran, written to be
  repeatable: populate the tables first because empty ones hide their header rows, check the listed
  properties by eye, and record the outcome under `## Progress` in the change's plan. Deliberately no
  screenshot baseline and no visual-regression harness — the check is a human looking at the running app,
  and the document should say so plainly rather than imply tooling that does not exist.

#### 2. Update the conventions file

**File**: `src/CLAUDE.md`

**Intent**: Line 73 enumerates the token files and names the Teddy Eddie stylesheet as the pattern to copy.
After Phase 1 that list is incomplete and after Phase 2 the pattern to copy is a mixin, not a file — the
document would contradict itself, which `context/foundation/lessons.md` records as a rule to avoid.

**Contract**: The design-tokens paragraph is rewritten to describe the `utils/` (tokens) and `patterns/`
(composite mixins) split, to state that `mixins.scss` forwards the pattern layer so existing import paths
still resolve, and to point at `docs/design-language.md` as the authority. The existing prohibition on
hardcoded hex colours, px font sizes, and breakpoint widths stays, extended to the shadow and radius now
that tokens exist for them. The sentence naming the three older report types as "not the reference" stays
accurate and is kept.

#### 3. Record the verification outcome

**File**: `context/changes/report-design-language/plan.md`

**Intent**: `docs/pdf-fidelity-check.md` §8 establishes the project's convention that an unrecorded check
did not happen. The same applies to this change's visual check.

**Contract**: Append a short `### Visual no-op check` note under `## Progress` — date, tabs compared,
baseline commit, verdict — and state explicitly that the PDF fidelity procedure was not applicable because
this change touches none of its §1 triggers.

### Success Criteria:

#### Automated Verification:

- `docs/design-language.md` exists
- Build succeeds: `npm run build`
- Linting passes: `npm run lint`
- Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`

#### Manual Verification:

- Every token and mixin the document lists resolves to a real member of `src/assets/styles/`, and every
  call site it cites exists
- The "not the language" section names at least the four deliberate exclusions
- `src/CLAUDE.md` no longer describes a file layout that has changed, and its pointer to
  `docs/design-language.md` resolves
- A reader who was not part of this change can tell, from the document alone, whether a new value belongs
  in the token layer
- The Composition section lists the six shared components with a call site that resolves, and
  `data-table-cells`'s entry carries its scoping constraint

---

## Testing Strategy

### Unit Tests:

No new specs. Component styles are not asserted anywhere in the suite, and adding style assertions to
Karma specs would be a new testing pattern — out of scope here, and weaker than the visual comparison.
The existing suite runs as a regression check that no stylesheet change broke component compilation.

### Integration Tests:

None. There is no integration layer this change can reach.

### Manual Testing Steps:

Verification is by eye, reported by the human running the app. No screenshots are captured or stored.

1. Run `npm start` and open the Teddy Eddie tab.
2. Select an age, then add a row to the English immersion table and a row to the Cambridge path table.
   Empty tables hide their header rows and would hide the very styling this change rewrites, so this step
   is what makes the check meaningful.
3. After each repoint in Phase 2, look at the surface that repoint touched, against the property list in
   Phase 2's manual criteria.
4. Clear the Teddy Eddie age selection and confirm both tables return to their empty state with header
   rows hidden.
5. Visit the other three tabs and confirm they are unchanged.

## Performance Considerations

Net negative CSS: roughly 100 duplicated lines collapse into one definition, so the emitted stylesheet
shrinks slightly. Mixin inclusion is a compile-time operation with no runtime cost. Nothing here affects
bundle structure or load behaviour.

## Migration Notes

None. No data, no persisted state, no API surface. The one compatibility concern is internal: every
existing `@use` path into `src/assets/styles/` keeps resolving, because `mixins.scss` forwards the new
pattern layer rather than moving members out of reach.

## References

- Roadmap slice `S-05a`: `context/foundation/roadmap.md`
- PRD Open Question #1 (extended 2026-07-27): `context/foundation/prd.md` → `## Constraints & Compatibility`
- Document format model: `docs/pdf-fidelity-check.md`
- Styling reference named by convention: `src/CLAUDE.md:73`
- The reference stylesheets: `src/app/teddy-eddie-report/tables/teddy-eddie-table/teddy-eddie-table.component.scss`,
  `src/app/teddy-eddie-report/tables/cambridge-path-table/cambridge-path-table.component.scss`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Token layer

#### Automated

- [x] 1.1 Build succeeds: `npm run build` — 7326ae0
- [x] 1.2 Linting passes: `npm run lint` — 7326ae0
- [x] 1.3 Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless` — 7326ae0
- [x] 1.4 `_radius.scss` and `_elevation.scss` exist and are reachable through `utils/index.scss` — 7326ae0

#### Manual

- [x] 1.5 Human confirms the four report tabs look unchanged — 7326ae0

### Phase 2: Pattern layer and repoint

#### Automated

- [x] 2.1 Build succeeds: `npm run build` — 675444a
- [x] 2.2 Linting passes: `npm run lint` — 675444a
- [x] 2.3 Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless` — 675444a
- [x] 2.4 Elevation shadow triple absent outside `_elevation.scss`, except `tab-group.component.scss` — 675444a
- [x] 2.5 `#eef0fa` absent outside `_colors.scss` — 675444a
- [x] 2.6 Both table stylesheets at least 40 lines shorter — 675444a

#### Manual

- [x] 2.7 Teddy Eddie tab checked with both tables populated, not in the default empty state — 675444a
- [x] 2.8 Human confirms no visible change across the listed properties — 675444a
- [x] 2.9 The three non-Teddy-Eddie tabs unchanged — 675444a
- [x] 2.10 Empty-state behaviour intact — no age selected hides both tables' header rows — 675444a
- [x] 2.11 Each of the three repoints built, spot-checked, and committed separately — 675444a
- [x] 2.12 Reset-rule position in compiled output verified for `section-title` and `form-wrapper` — 675444a

### Phase 3: Document the language and repair stale conventions

#### Automated

- [x] 3.1 `docs/design-language.md` exists
- [x] 3.2 Build succeeds: `npm run build`
- [x] 3.3 Linting passes: `npm run lint`
- [x] 3.4 Tests pass: `npm test -- --watch=false --browsers=ChromeHeadless`

#### Manual

- [x] 3.5 Every token, mixin, and call site the document cites exists
- [x] 3.6 The "not the language" section names the four deliberate exclusions
- [x] 3.7 `src/CLAUDE.md` consistent with the new layout and its pointer resolves
- [x] 3.8 Document is self-sufficient for a reader who was not part of this change
- [x] 3.9 Composition section complete with resolving call sites; `data-table-cells` scoping constraint recorded

### Visual no-op check

- **Date**: 2026-07-27
- **Tabs compared**: all four — semester/trimester, end-of-year, Cambridge, Teddy Eddie. Teddy Eddie
  checked with an age selected and a row added to both tables, so the header rows `.is-empty` normally
  hides were on screen.
- **Before**: working tree at `7326ae0` (Phase 1 close — token layer only, no stylesheet repointed).
- **Method**: human inspection of the running app, plus a compiled-CSS diff of both table stylesheets.
  The pre-change source was recovered with `git show`, compiled beside the current source, and the
  generated CSS diffed.
- **Verdict**: no visible differences. The compiled-CSS diff is three lines per table stylesheet — the
  three `card-surface` declarations moving to the head of the `.wrapper` rule, where no property
  collides, and `background-color: white` becoming `#ffffff`. Every selector and every other declaration
  is byte-identical, so the specificity drift this phase was sequenced around did not occur.
- **PDF fidelity procedure**: **not applicable.** `docs/pdf-fidelity-check.md` §1 lists its triggers —
  the `pdfmake` builders, the base64 assets, the Cambridge helper, and the `pdfmake` version. This change
  touches none of them, and pdfmake never reads the DOM or a stylesheet. `npm run test:capture` was
  deliberately not run.
