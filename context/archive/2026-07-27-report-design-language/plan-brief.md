# Report Design Language Extraction — Plan Brief

> Full plan: `context/changes/report-design-language/plan.md`

## What & Why

The Teddy Eddie report carries the app's newest visual language, but nobody ever wrote it down — it lives
implicitly in four stylesheets, spread by copy-paste. This change extracts it into named SCSS tokens and
mixins and documents it, so `S-05b` (restyle the three older forms) and `S-01` (sign-in gate) can both
build against a stable contract instead of colliding in `src/assets/styles/utils/`. No user-visible change.

## Starting Point

`src/assets/styles/utils/` holds six flat colours, one font variable, five spacings, and three
breakpoints — and that is all the "design system" there is. The real language sits in duplicated blocks:
the same Material elevation shadow appears in five stylesheets, the same `20px` card radius in five, and
the two Teddy Eddie table stylesheets are ~95% identical across ~110 lines each. `#eef0fa`, the table
header fill, is a brand colour that never became a token. `_breakpoints.scss:25-29` carries a latent
copy-paste bug: `breakpoint-desktop-xxl()` tests `$desktop`.

## Desired End State

`src/assets/styles/` publishes a contract: `utils/` for tokens, a new `patterns/` for composite mixins
(card surface, data table, section title), with `mixins.scss` forwarding the pattern layer so **no
existing import path changes**. Four stylesheets that duplicated those patterns now include them, ~100
lines lighter. `docs/design-language.md` records every published member, where it already runs, how the
Teddy Eddie report composes the shared components, and — the part that makes this an enabling slice rather
than a refactor — what deliberately is *not* part of the language.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Extraction depth | Style layer **and** repoint the sheets that duplicate it | Every mixin gets ≥2 consumers immediately — that is the proof the abstraction is real, not guessed | Plan |
| Language boundary | "Two consumers" test: repeated ≥2× **and** needed by `S-05b`/`S-01` | Falsifiable per token; naturally blocks the design-system sprawl the roadmap warns about | Plan |
| Contract form | SCSS variables + mixins | What all 14 existing stylesheets already do; a wrong name fails the build instead of leaking to production | Plan |
| Token naming | Literal / appearance-based (`$britannia-light-blue`, `$shadow-1`, `$radius-20`) | One consistent convention across the directory | Plan |
| Dead code | Fix the breakpoint bug, keep unused tokens | The bug will bite `S-05b`; `$britannia-red` may be needed for sign-in error states | Plan |
| Repoint scope | `form-wrapper`, both Teddy Eddie tables, `section-tile` | Exactly where the duplication is literal; `tab-group` is app shell, left for `S-01` | Plan |
| Documentation | `docs/design-language.md` + `src/CLAUDE.md` pointer | Mirrors what worked for `F-02` — agent reads the rule, human reads the document | Plan |
| No-op proof | Human checks the running app by eye and reports | No visual-regression harness exists and building one is bigger than this slice; screenshot baselines were dropped as overhead that nobody would maintain | Plan |

## Scope

**In scope:** four new/extended token partials; a new `patterns/` directory with three composite mixins;
repointing three component stylesheets plus `mixins.scss`; the breakpoint bug fix;
`docs/design-language.md`; the `src/CLAUDE.md` update.

**Out of scope:** `tab-group.component.scss` (app shell, its shadow copy stays); the three older report
forms and their `.subtitle` (that is `S-05b`, and the style belongs to the design being replaced); new
Angular components; CSS custom properties; deleting unused tokens; renaming `section-tile`; stylelint or a
visual-regression harness; any `.ts`, `.html`, `pdfmake` builder, or i18n file.

## Architecture / Approach

Two layers under `src/assets/styles/`: `utils/` publishes tokens (values), `patterns/` publishes composite
mixins (blocks). `mixins.scss` becomes `@forward "patterns/index"` plus its two generic helpers, which is
what keeps all six existing consumers compiling against unchanged paths. The governing rule while
repointing is **emit the same CSS**: where two consumers differ structurally, the mixin emits declarations
and the consumer keeps its own selector nesting.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Token layer | Additive tokens (`$britannia-light-blue`, `$black-*`, `$radius-20`, `$shadow-1`) and the breakpoint fix | None material — every change declares a variable or fixes a zero-call-site mixin, so the phase emits no CSS |
| 2. Patterns + repoint | `patterns/{_card,_data-table,_section-title}.scss`, forwarding `mixins.scss`, three stylesheets repointed | Specificity drift: the two table stylesheets nest `.no-data-row` and `is-empty` differently, so a mixin that emits selectors changes what one of them matches |
| 3. Document | `docs/design-language.md`, `src/CLAUDE.md` update, recorded verification | `src/CLAUDE.md:73` enumerates the token files — leaving it stale would make it contradict itself, which `lessons.md` names as a rule |

**Prerequisites:** `F-01` and `F-02` are `impl_reviewed`, so this slice is unblocked. Needs a local dev
run (`npm start`) and a human to eyeball the result. No Firebase access, no new dependency.
**Estimated effort:** ~1–2 sessions across 3 phases; the bulk is Phase 2's careful repoint.

## Open Risks & Assumptions

- **No automated guard for CSS.** No stylelint, no visual-regression harness, no screenshot baseline, and
  `npm test` asserts nothing about styles. A missing SCSS member fails the build; everything else rests on
  a human looking at the running app — and that check is only meaningful with the Teddy Eddie tables
  populated, since `.is-empty` hides the header rows the change rewrites.
- **Literal naming has a known cost.** `$radius-20` couples name to value — if `S-05b` changes the radius,
  the name misdescribes it. Accepted deliberately; recorded in the document.
- **`$font` is quoted, `section-tile`'s hardcoded literal is not.** Substituting the token changes the
  compiled CSS text without changing what any browser renders — expect a textual diff there.
- **The token names become a contract** the moment `S-01` compiles against them. After this change,
  extend additively; a rename is a breaking change.
- **`data-table-cells` must be included inside a scoping selector.** Its `::ng-deep` block escapes
  component encapsulation at stylesheet root and would override every Material table in the app —
  `semestr-report.component.scss:21` already does this by accident today. The constraint ships with the
  mixin's documentation entry.
- **PDF fidelity is not at risk and its procedure does not apply.** `docs/pdf-fidelity-check.md` §1 lists
  its triggers and this change hits none of them; pdfmake builds documents from JavaScript objects and
  never reads a stylesheet. Do not run `npm run test:capture` for this change.

## Success Criteria (Summary)

- All four report tabs look unchanged to a human checking the running app — including populated Teddy
  Eddie tables and the empty-state behaviour.
- No stylesheet outside `src/assets/styles/` restates the elevation shadow or `#eef0fa`, except the one
  deliberate `tab-group` exception; both table stylesheets shrink by at least 40 lines.
- A developer starting `S-05b` or `S-01` can read `docs/design-language.md` alone and know which token or
  mixin to use, and which values were deliberately left out of the language.
