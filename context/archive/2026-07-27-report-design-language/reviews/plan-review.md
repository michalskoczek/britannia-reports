<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Report Design Language Extraction

- **Plan**: `context/changes/report-design-language/plan.md`
- **Mode**: Deep
- **Date**: 2026-07-27
- **Verdict**: REVISE → SOUND after triage
- **Findings**: 0 critical, 4 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | WARNING |
| Lean Execution | PASS (1 observation) |
| Architectural Fitness | WARNING |
| Blind Spots | WARNING |
| Plan Completeness | WARNING |

## Grounding

10/10 paths ✓, 5/5 symbols ✓ (`section-tile`, `$britannia-blue`, `#eef0fa`, `breakpoint-desktop-xxl`,
`.is-empty`), brief↔plan ✓, Progress↔Phase ✓ (3/3 phases paired, 25/25 criteria mapped, no checkboxes
outside `## Progress`). `docs/reference/contract-surfaces.md` does not exist — surface check skipped.

## Findings

### F1 — Published `data-table-cells` mixin leaks globally if misused

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architectural Fitness
- **Location**: Phase 2 → Changes #2 (`patterns/_data-table.scss`)
- **Detail**: The mixin emits a `::ng-deep` block. Included inside a scoping selector it compiles to
  `.te-table[_ngcontent-x] .mat-mdc-cell`; included at stylesheet root it compiles to a bare
  `.mat-mdc-cell` and overrides every Material table in the app. The failure mode already exists in the
  repo: `semestr-report.component.scss:21` and `year-report.component.scss:98` declare root-level
  `::ng-deep .mat-mdc-row { height: 38px !important }`, which currently governs the Teddy Eddie tables'
  row height from two unrelated components. The plan publishes this mixin as a contract for `S-05b` — the
  slice whose job is rewriting exactly those leaking files — and never states the constraint.
- **Fix**: State the constraint in the Contract for `_data-table.scss` and carry it into the Phase 3
  document as a usage rule alongside the mixin entry.
- **Decision**: FIXED — constraint added to Phase 2 Change #2 with the `semestr-report.component.scss:21`
  evidence, and to the Phase 3 document contract; new Progress item 3.9.

### F2 — Document omits the composition layer that S-01 needs most

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: End-State Alignment
- **Location**: Phase 3 → Changes #1 (`docs/design-language.md`)
- **Detail**: The plan's own Current State Analysis concludes that "the Teddy Eddie visual language is,
  concretely, the components the Teddy Eddie report composes," then scopes the document to tokens and
  mixins only. `S-01` builds a new sign-in screen and needs "wrap in `app-form-wrapper`, use
  `app-input-text` / `app-select` / `app-date`, use `app-button`" more than it needs any variable. Those
  components have one consumer each (`teddy-eddie-report.component.html:4,11,24`), so they fail the
  two-consumer test and drop out of the contract silently. A developer could use every token correctly and
  still build a screen that looks nothing like Teddy Eddie.
- **Fix A ⭐ Recommended**: Add a "Composition" section to the document.
  - Strength: Pure documentation of components that already exist — zero code, zero risk; closes the gap
    between the plan's analysis and its deliverable.
  - Tradeoff: Slightly widens Phase 3.
  - Confidence: HIGH — components and their single call site verified in the templates.
  - Blind spot: Whether `S-01`'s screen actually fits `app-form-wrapper` is unproven; the section
    documents, it doesn't promise.
- **Fix B**: Leave the document scoped and let `S-01` discover the components.
  - Strength: Keeps the slice at its narrowest reading.
  - Tradeoff: Reintroduces the exact problem the slice exists to fix.
  - Confidence: MEDIUM.
  - Blind spot: None significant.
- **Decision**: FIXED via Fix A — Composition bullet added to the Phase 3 document contract, with an
  explicit "documentation only, no component created or changed" boundary; covered by Progress item 3.9.

### F3 — Phase 2 repoints three files with no way to localize a regression

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 → Changes #5, #6, #7
- **Detail**: Three stylesheets repointed and verified once, at the end, by whole-page screenshot
  comparison. The plan names specificity drift as the phase's governing risk, but a detected difference
  gives three candidate causes, no bisect story, and a full re-capture per attempt. No rollback guidance
  for Phase 2 at all.
- **Fix**: Sequence the repoints with a build and a targeted check after each, committing between them.
- **Decision**: FIXED — sequencing paragraph added to the Phase 2 Overview; new Progress item 2.11.

### F4 — Phase 3 writes a non-conforming heading into the parsed Progress section

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 → Changes #3
- **Detail**: The contract instructs appending a `### Visual no-op check` heading under `## Progress`,
  which is machine-parsed by `/10x-implement` and whose contract expects `### Phase N: <name>` siblings
  only. It follows `docs/pdf-fidelity-check.md` §8, but that precedent doesn't make the parser tolerant.
- **Fix**: Record the verification under its own `## Verification Record` H2 above `## Progress`.
- **Decision**: SKIPPED — user chose to keep the `F-02` convention as-is.

### F5 — Screenshot comparison cannot see the module-load-order change

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 → Change #4 (`mixins.scss` becomes a barrel)
- **Detail**: `utils/index.scss` forwards `_reset.scss`, which emits real CSS. Today `mixins.scss:1` pulls
  it in directly; after the change it arrives transitively through `patterns/_section-title.scss`. Sass
  emits module CSS in dependency order, so the reset's position can shift in the two stylesheets that
  reach it only via `mixins.scss` (`section-title.component.scss`, `form-wrapper.component.scss`). A
  cascade-order change in a reset rule is exactly what a screenshot of a populated form will not show.
- **Fix**: Add a before/after check of the reset's position in those two components' compiled styles to
  Phase 2's manual criteria.
- **Decision**: FIXED — added as a Phase 2 manual criterion; new Progress item 2.12.

### F6 — `patterns/index.scss` barrel and a three-declaration `_card.scss`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 2 → Changes #1, #4
- **Detail**: Four new files where two carry the weight. `_data-table.scss` (~90 lines) earns its own
  file; `_card.scss` holds three declarations, and `patterns/index.scss` exists only to be forwarded by
  `mixins.scss`, which is itself already a barrel. The roadmap names growth past "extraction and naming"
  as this slice's specific failure mode.
- **Fix**: Drop `patterns/index.scss`; forward the three partials directly from `mixins.scss`.
- **Decision**: FIXED — barrel change removed, remaining changes renumbered #4–#7, and `mixins.scss`'s
  contract now states the no-second-barrel decision explicitly.

## Triage summary

| Outcome | Findings |
|---------|----------|
| Fixed | F1, F2 (Fix A), F3, F5, F6 (5) |
| Skipped | F4 (1) |

**Verdict after fixes: SOUND.** The two MEDIUM-impact findings — the `::ng-deep` scoping contract and the
missing composition layer — are both closed in the plan text. F4 is a documented, accepted parser risk
following an established project convention.
