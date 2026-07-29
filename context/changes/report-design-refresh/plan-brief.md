# Report Design Refresh — Plan Brief

> Full plan: `context/changes/report-design-refresh/plan.md`
> Published contract this change extends: `docs/design-language.md`
> Roadmap slice: `S-05b` in `context/foundation/roadmap.md`

## What & Why

The semester/trimester, year-end, and Cambridge forms still carry an earlier visual iteration while the
Teddy Eddie report carries the current one. `S-05a` wrote that language down as a contract; this change
makes the three older forms **compose** it — shared section titles, card surfaces, and form-control
components — rather than merely imitate its colours. Every later slice (`S-01` gates these forms, `S-02`
writes templates into one, `S-04` adds a picker) builds on top of them, so restyling first means that
surface is built once against the final language instead of rebuilt.

## Starting Point

1,973 lines of template across three forms: `<h2 class="subtitle">` headings with no card surface,
Bootstrap grid columns, and raw `mat-form-field` children in the default `fill` appearance. Teddy Eddie
uses `app-form-wrapper` + `app-section-title` around `app-input-text` / `app-select` / `app-date`, all
`appearance="outline"`. The shared components cannot express seven things those three forms need
(multiple select, flat string lists, sex-dependent option values, textareas, date hints, click-to-open
dates, a disabled submit) — the roadmap recorded this as an open unknown, and the answer turned out to be
"not as they stand".

## Desired End State

A teacher opening any of the three tabs sees the same section-title bars, white elevated cards, outlined
controls, and table styling as the Teddy Eddie tab. The forms are built from the components
`docs/design-language.md` §4 names. Every generated PDF is unchanged, every form control keeps its name
and value — enforced by a spec rather than by discipline. The Teddy Eddie tab is untouched.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Adoption depth | Full composition | Half-adopting would leave `S-01`/`S-02`/`S-04` extending hand-rolled markup that still has to be replaced later. | Plan |
| Shared-component gap | Extend the shared layer | Four additive inputs plus one new component, each defaulting to today's behaviour, so nothing silently changes. | Plan |
| Bootstrap grid | Replaced with flex | Matches the reference mechanism; a new `form-row` / `form-col` pattern keeps it from being hand-rolled three times. | Plan |
| Cambridge's 11 exam blocks | Extracted to `app-exam-term-rows` | ~600 of 1,040 lines collapse, and the composition is written once instead of eleven times. | Plan |
| `::ng-deep .mat-mdc-row` in semestr/year | **Kept** | Verified to be the only source of the Teddy Eddie tables' 38px rows; removing it would change the reference tab, which takes no delta. | Plan |
| Form-control height | Unchanged (36px global) | Adopting the wrappers already aligns the three forms, because the visible gap was `fill` vs `outline`, not pixels. | Plan |
| `mat-error` subscript area | Stays visible outside tables | All three forms have required fields; hiding validation messages is a usability regression, not a restyle. | Plan |
| Form model | Frozen, guarded by spec | Converts the PDF-fidelity argument from an assertion into something Karma checks on every run. | Plan |
| Card boundary | One per section; tables get a bare title | Literally what `docs/design-language.md` §4 prescribes; mixed sections split in two. | Plan |
| Heading i18n keys | Normalized to semantic keys | `app-section-title` turns every heading into a key, and one of them (`"Poziom biegłości"`) is missing from both bundles today. | Plan |
| PDF capture procedure | Not run, with a checkable argument | `*-report.component.ts` edits are bounded to the `imports` array and option-list getters, verified per phase. | Plan |

## Scope

**In scope:** the three older report forms (templates, stylesheets, bounded `.ts` edits); four additive
extensions to the shared form components plus a new `app-textarea`; a `form-row` layout pattern; an
`app-exam-term-rows` component for Cambridge; form-model guard specs; heading i18n normalization;
`docs/design-language.md` and `src/CLAUDE.md` repair.

**Out of scope:** the Teddy Eddie report and its tables; all four `pdfmake` builders and their assets; any
form-control rename, addition, removal, or value change; the three root-level `::ng-deep` leaks; control
heights; stylelint or visual-regression tooling; the sign-in gate (`S-01`).

## Architecture / Approach

```
patterns/  ──── card-surface · section-tile · data-table-cells · form-row (new)
    │
shared/components/form/  ──── app-form-wrapper · app-input-text · app-select+ · app-date+
                              app-textarea (new) · app-button+          (+ = extended)
    │
    ├── semestr-report        (Phase 2)
    ├── year-report           (Phase 2)
    └── cambridge-report      (Phases 3–4)
            └── app-exam-term-rows (new, ×11 call sites)
```

Guard specs land first and defend the form model for the rest of the plan. Each form is then converted as
its own commit, so a regression is attributable to one tab and revertible on its own.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Enabling layer | Guard specs, four shared-component extensions, `app-textarea`, `form-row` pattern | Extensions have no consumers yet, so their design is only validated in Phase 2 |
| 2. Semester + year-end forms | Both smaller forms composed, plus year-end's two hand-rolled div-tables brought into the token layer | Sex-dependent option values must produce identical control values; a wrong conversion pattern gets applied twice |
| 3. Cambridge extraction | `app-exam-term-rows`, ~600 lines removed, **no visual change** | `ControlContainer` view-providers plus `formArrayName` is a known-tricky Angular pattern |
| 4. Cambridge restyle | Third form composed, exam rows styled once | Largest template; eleven `@if` chains gate which sections appear |
| 5. Contract repair | `design-language.md`, `src/CLAUDE.md`, fixture prose, key retirement | Documents must stop asserting the `::ng-deep` cleanup this plan declines |

Phase 2 lands the two forms as **separate commits**, semester first, each with its own visual check — so
a regression is still bisectable to one tab even though they share a phase.

**Prerequisites:** `S-05a` (`report-design-language`) — `impl_reviewed`. Headed Chrome and a `pl-PL`
locale only if the PDF capture procedure has to be run after all.
**Estimated effort:** ~6 sessions across 5 phases — materially larger than the roadmap's `S-05b` entry
anticipated.

## Open Risks & Assumptions

- **Scope exceeds the roadmap entry.** The roadmap describes `S-05b` as applying the language to three
  forms. This plan additionally migrates the layout mechanism, extends the shared component layer, and
  extracts a Cambridge component — roughly 2–3× the original size. Deliberate, and worth re-checking
  against the three-week after-hours budget.
- **Collision with `S-01`, which the roadmap said could run in parallel.** `S-01` needs
  `src/assets/i18n/*.json` and now also the shared form components this plan edits. The extensions are
  additive with behaviour-preserving defaults, so either order compiles — but the two changes should
  coordinate rather than assume independence.
- **`docs/design-language.md` §3 explicitly assigns the `::ng-deep` cleanup to this slice, and this plan
  declines it.** Phase 5 corrects the document; until it lands, the two disagree.
- **The PDF capture procedure is deliberately not run.** The argument rests on `*-report.component.ts`
  edits staying bounded to two kinds. If any phase needs a third, the assumption has broken and the
  procedure must run before that phase merges.
- **No automated visual check exists.** Every "looks the same" claim is a human looking at the running
  app, by recorded project preference.

## Success Criteria (Summary)

- A teacher cannot tell, from visual language alone, which of the four tabs is the reference one.
- Every report still downloads a PDF indistinguishable from today's, minimal and fully filled.
- The three form-model contract specs are green and unmodified after every phase.
