---
project: britannia-reports
checked_at: 2026-06-02T00:00:00Z
health_status: healthy
context_type: brownfield
language_family: js
stack_assessment_available: true
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - ci_cd
  - configuration
audit_findings:
  critical: 0
  high: 0
  moderate: 3
  low: 0
test_runner_detected: true
ci_provider: null
recommended_fixes: 2
---

# Health Check — britannia-reports

Operational audit of the codebase before the brownfield change kicks off. This report complements `context/foundation/stack-assessment.md` (which evaluates the *stack choice* against four agent-friendly quality gates); this file evaluates the *current project state* against operational health criteria — dependency hygiene, test infrastructure, CI/CD, and configuration completeness.

**Headline:** project is now in healthy shape for agent collaboration. The original audit (run earlier the same day, 2026-06-02) found a broken test suite and 12 lint errors against the current tree. Both have been resolved: the spec suite now passes 5/5 after wiring `TranslateModule.forRoot()` into TestBed via a small shared helper (`src/app/shared/testing/translate-testing.ts`), and `ng lint` is clean. `npm audit fix` was run; the only remaining advisories (3 MODERATE) are a transitive uuid/gaxios chain inside `firebase-tools` whose only resolution path is a two-major-version downgrade of the deploy CLI, which has been consciously deferred. Several stack-assessment gaps from 2026-05-23 have been closed since that document was written (project upgraded Angular 19→20.3, ESLint wired up with `angular-eslint`, Firebase Hosting configured, Prettier 3 pinned with `.prettierrc.json`).

## Dependency Health

### Lockfile

```
Status: present (package-lock.json)
Package manager: npm
```

### Security Audit

```
Tool: npm audit --json (followed by npm audit fix)
Summary: 0 CRITICAL, 0 HIGH, 3 MODERATE, 0 LOW (residual after fix)
Direct vs transitive: 1 direct (firebase-tools, devDependency), 2 transitive (gaxios → uuid)
```

#### MODERATE findings (residual, consciously deferred)

- **uuid** `<11.1.1` — [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq): missing buffer bounds check in v3/v5/v6 when `buf` is provided (CVSS 7.5). Reaches the tree only through `firebase-tools` → `gaxios` → `uuid` (devDependency chain).
- **gaxios** `6.4.0 – 6.7.1` — transitive carrier of the uuid advisory.
- **firebase-tools** `>=13.14.0` — direct devDependency, surfacing the chain above.

`npm audit fix` was run; npm's only proposed full fix is `npm audit fix --force`, which downgrades `firebase-tools` from 15.18.0 to 13.13.3 (`isSemVerMajor: true`). That downgrade would likely break Firebase Hosting deploy compatibility (the project's deploy story per `firebase.json` + `.firebaserc`), so the residual was accepted. No runtime / shipped-to-browser code is affected — the advisory is confined to the `firebase-tools` deploy CLI, which the agent only invokes during deploy from a developer machine. Revisit when `firebase-tools` ships a release with a patched gaxios/uuid in the 15.x or 16.x line.

### Outdated Dependencies

```
Packages with major version gaps: 6 (direct, 1+ major versions behind)
```

Most impactful:

- **@angular/core** (and the rest of the `@angular/*` set): `20.3.21` → `21.2.15` (1 major behind). The whole Angular core/CLI set moves together; treat as one upgrade unit.
- **@angular/cli** / **@angular/build**: `20.3.26` → `21.2.13` (1 major behind). Aligned with core; do not bump in isolation.
- **jasmine-core**: `4.5.0` → `6.2.0` (2 majors behind). `~4.5.0` carat keeps it pinned to a 2022-era line; current Karma + Jasmine ecosystem has moved on.
- **@types/jasmine**: `4.3.6` → `6.0.0` (2 majors behind). Aligned with `jasmine-core` line.
- **typescript**: `5.8.3` → `6.0.3` (1 major behind). Angular 20 supports TS 5.x; TS 6 upgrade lands with Angular 21.
- **eslint**: `9.39.4` → `10.4.1` (1 major behind). Pin matches `@eslint/js`; bump as one unit.

`zone.js` (0.15 → 0.16) and a handful of patch/minor lags exist but are not impactful.

## Test Suite

```
Test runner: Karma + Jasmine
Tests found: 5 spec files
Test execution: passing (5 of 5 pass)
```

```
Configuration: angular.json (Angular CLI defaults — no karma.conf.js at root)
Framework: jasmine-core ~4.5.0, karma ~6.4.0
Test helper: src/app/shared/testing/translate-testing.ts (shared TranslateModule.forRoot() import)
```

The previous run of this audit found all five specs failing with `NG0201: No provider found for _TranslateService` — a side-effect of the Angular 19→20 standalone-components migration not propagating `ngx-translate` providers into TestBed setups. Fix applied: a one-line shared helper `translateTestingImports = [TranslateModule.forRoot()]` was added at `src/app/shared/testing/translate-testing.ts` and spread into each spec's `imports`. `DateComponent` and `TeddyEddieFormComponent` also received `provideNoopAnimations()` + `provideNativeDateAdapter()` (Material datepicker prerequisites). `TeddyEddieFormComponent` additionally builds a minimal `FormGroup` and sets it via `componentRef.setInput('form', form)` to satisfy its required input. `SelectComponent` sets an empty `itemList` for the same reason.

The agent now has a fast feedback loop: `npx ng test --watch=false --browsers=ChromeHeadless` runs the suite in under 5 seconds, green.

## CI/CD

```
Provider: not detected
Configuration: not found
```

| Stage      | Status | Notes                                                                 |
|------------|--------|-----------------------------------------------------------------------|
| Lint       | ✗      | `ng lint` available locally (12 errors against current tree); not in CI |
| Test       | ✗      | `ng test` available locally (currently failing); not in CI             |
| Build      | ✗      | `ng build` available locally; not in CI                                |
| Type check | ✗      | Implicit in `ng build` / `ng test`; no standalone CI step              |
| Security   | ✗      | `npm audit` available locally; no automated PR/push scan               |

ℹ No CI/CD configuration detected. You'll set this up in the infrastructure and deployment lesson ([Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)). For now, the local toolchain is sufficient for agent collaboration — once the test suite is unbroken, the agent can run `ng test --watch=false --browsers=ChromeHeadless` and `ng lint` to verify changes.

## Configuration

### High severity

(none — every high-severity configuration file is present)

### Medium severity

- **AGENTS.md** — missing. Tools that follow the AGENTS.md convention (Cursor, Codex, Aider) won't find conventions documented elsewhere. Covered in the agent onboarding lesson; do not author by hand now.

### Low severity

- **`.env.example` / `.env.template`** — not present. The current Angular app does not appear to use runtime env vars (Firebase config is bundled into `src/environments/`), so the gap is mostly cosmetic. Add only if/when the brownfield change introduces secrets the developer needs to seed locally.

All other expected configuration is present: `.editorconfig`, `.prettierrc.json`, `.gitignore`, `eslint.config.js` (flat config with `angular-eslint` + `typescript-eslint`), `tsconfig.json` with `strict: true` plus four additional strictness flags and three Angular template-strictness flags, `firebase.json` + `.firebaserc` (Hosting target wired), root `CLAUDE.md` (redirects to `src/CLAUDE.md`) and a substantial `src/CLAUDE.md` covering PDF-fidelity guardrail, hybrid NgModule/standalone model, locale pinning, UI library mix, folder map, test stack pin, and styling baseline.

Note: an earlier run of this audit reported 12 lint errors against the source tree (unused imports, unused-expression bugs in shared form components, label-not-associated-with-control in two templates, a constructor injection that should use `inject()`, and one unused helper inside the semestr PDF builder). All twelve have been resolved by hand (the rules involved had no autofix). `ng lint` is currently clean.

## Stack Assessment Cross-Reference

```
Stack assessment: context/foundation/stack-assessment.md
Agent readiness (from stack-assess): ready-with-compensation
```

The stack assessment was written 2026-05-23 against Angular 19. Several of its identified gaps have since been closed by upstream work in the project; this health-check captures the current state.

| Quality Gate / Stack-Assess Gap                                         | Health-Check Finding                                                                          | Status       |
|-------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|--------------|
| Gap 1 — No project-level instruction file (`CLAUDE.md` / `AGENTS.md`)   | Root `CLAUDE.md` + comprehensive `src/CLAUDE.md` present (hard PDF guardrail, conventions)   | Mitigated    |
| Gap 2 — No linter wired up                                              | `eslint.config.js` with `angular-eslint` + `typescript-eslint`; `ng lint` works locally       | Mitigated    |
| Gap 3 — No CI/CD pipeline                                               | Still no `.github/workflows/`; deferred to infrastructure lesson                              | Reinforced   |
| Gap 4 — Test runner on the deprecation path (Karma + Jasmine)           | Stack still on Karma + Jasmine; `src/CLAUDE.md` pins the choice. Suite is currently *broken*. | Reinforced   |
| Gap 5 — Firebase tooling installed but unconfigured                     | `firebase.json` + `.firebaserc` now present; Hosting target points at `dist/browser`           | Mitigated    |
| (Beyond stack-assess) Prettier without `.prettierrc`                    | `.prettierrc.json` now present (printWidth 120, singleQuote, trailingComma es5)               | Mitigated    |
| (Beyond stack-assess) Framework version drift                           | Project moved Angular 19 → 20.3 since the assessment; CLI/core aligned at 20.3                | Updated      |

**Net change since the stack assessment:** four of five identified gaps have been addressed and the framework was upgraded a major version. The one regression introduced after the assessment is the spec-bootstrap failure surfaced in `## Test Suite` above — almost certainly a side-effect of the Angular 19→20 standalone-components migration touching `ngx-translate` providers.

## Recommended Fixes

### Completed in this session (2026-06-02)

- **Fix 1 — Repair the broken test suite.** Done. Added `src/app/shared/testing/translate-testing.ts` shared helper; updated all five specs to import it; `DateComponent` and `TeddyEddieFormComponent` got Material/forms providers and `setInput` calls; `SelectComponent` got an empty `itemList`. `ng test` now passes 5/5.
- **Fix 2 — Clear the `ng lint` baseline.** Done. Resolved all 12 errors by hand (none were autofixable). Specifics: removed unused `EventEmitter`/`Input`/`Output` imports from `button.component.ts`; converted four ternary-as-statement patterns (`tab-group`, `date`, `input-text`, `select`) into `if/else`; replaced the unused `getMarkValue` helper in `semestr-report.component.ts` and migrated its constructor `TranslateService` injection to `inject()`; replaced bare `<label>` tags with `<span>` + `aria-labelledby` on the matching `mat-radio-group` in `semestr-report.component.html` and `year-report.component.html`. `ng lint` is clean.
- **Fix 3 — Apply the dependency audit fix.** Partially done. `npm audit fix` ran (non-force); 3 MODERATE advisories remain because the only full resolution path is `npm audit fix --force`, which would downgrade `firebase-tools` 15.18.0 → 13.13.3 (two majors back, marked `isSemVerMajor: true`) and likely break the Firebase Hosting deploy story. Residual consciously accepted; see `## Security Audit` above.

### Fix before agent work (Category A — remaining)

### 1. (Optional now) Plan the Angular 20 → 21 major upgrade

**Impact**: The codebase trails the Angular release train by one major. Angular 21 introduces standalone-only patterns and updated control-flow syntax that the agent's training data increasingly reflects; staying on 20 means agent-suggested patterns may not match. This is *not urgent* — Angular 20 is a current LTS-grade release — but it should land before the next major Angular cuts (when 20 starts to fall out of training data freshness).
**Severity**: low
**Effort**: significant (multi-hour upgrade pass; do not bundle with the brownfield change)
**Fix**:

Open a dedicated branch and use `ng update @angular/core @angular/cli` to walk the upgrade. Check `src/CLAUDE.md`'s hybrid-NgModule note — Angular 21 may emit schematics that try to convert remaining NgModule-registered components to standalone. Keep that conversion separate from the upgrade itself.

### 2. (Optional now) Bump jasmine-core / @types/jasmine off the 4.5 line

**Impact**: Jasmine 4.5 is from 2022. Karma is in upstream maintenance mode, but Jasmine itself is still active and the 4 → 6 jump picks up modern matchers and TypeScript typing improvements. Modest agent-readiness gain; safe to defer until the test suite is unblocked.
**Severity**: low
**Effort**: moderate (review breaking changes between 4 and 6, run the suite, fix any breakages)
**Fix**:

Bump `jasmine-core` and `@types/jasmine` to `^6.0.0`, re-run the suite, and address any matcher/spy syntax changes.

### Addressed in upcoming lessons (Category B)

### No CI/CD pipeline

**Lesson**: [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)
**What you'll do there**: pick a deployment platform and lay down the first deploy plus a minimal CI workflow that runs build + test on push. For an Angular + Firebase Hosting setup this is typically a single GitHub Actions workflow checking out the code, running `npm ci`, `ng build`, `ng test --watch=false --browsers=ChromeHeadless`, and (on `master`) `firebase deploy --only hosting`.

### Missing AGENTS.md

**Lesson**: [Agent Onboarding: Agents.md, AI Rules i feedback loops (M1L4)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l4)
**What you'll do there**: generate an `AGENTS.md` that mirrors the structure of `src/CLAUDE.md` so non-Claude agents (Cursor, Codex, Aider) pick up the same conventions. Generating a stub now is premature — the onboarding lesson covers what content goes there and how to keep it in sync.

## Summary

```
Health status: healthy
```

Configuration, dependency hygiene, and documentation are in good shape. The three Category A items from the morning's first audit (broken test suite, dirty lint baseline, unfixed audit advisories) are all addressed: `ng test` passes 5/5, `ng lint` is clean, and `npm audit fix` ran (residual 3 MODERATE are confined to the `firebase-tools` deploy CLI and consciously deferred — see `## Security Audit`). The agent now has a working feedback loop (`ng test`, `ng lint`, `ng build`) to verify its own changes against. Production build (`ng build --configuration production`) succeeds with only the pre-existing CommonJS warnings for `moment` and `pdfmake`.

Next step: proceed to agent onboarding ([Agent Onboarding (M1L4)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l4)) to author `AGENTS.md` and set up CI in the infrastructure lesson ([M1L5](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)). The two remaining "(Optional now)" items above (Angular 20 → 21, Jasmine 4 → 6) are real but safe to defer until after the brownfield change has shipped its first PR.
