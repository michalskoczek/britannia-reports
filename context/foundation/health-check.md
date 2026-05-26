---
project: britannia-reports
checked_at: 2026-05-25T00:00:00Z
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
  high: 1
  moderate: 8
  low: 0
test_runner_detected: true
ci_provider: null
recommended_fixes: 4
---

# Health Check — britannia-reports

Operational audit of the Angular 19 codebase before agent-assisted work begins. This report complements `context/foundation/stack-assessment.md` (which evaluates the *stack choice* against the four agent-friendly quality gates); this file evaluates the *current project state* against operational health criteria — dependency hygiene, test infrastructure, CI/CD, and configuration completeness.

**Headline:** the project is now in healthy shape for agent collaboration. Since the previous health-check (2026-05-25 morning), the dependency advisory backlog has dropped from 84 findings (4 CRITICAL + 40 HIGH) to 9 (0 CRITICAL + 1 HIGH + 8 MODERATE), ESLint has been wired up with `angular-eslint`, and Prettier 3 has been pinned with a `.prettierrc.json`. The remaining advisories are all transitive dev-tooling issues; no runtime code is affected. The single open category-A item is an Angular CLI / Angular core version skew (`@angular/cli@21` driving a v19 codebase) worth normalizing before agent-led refactors start.

## Dependency Health

### Lockfile

Status: present (`package-lock.json`)
Package manager: npm

Dependency versions are pinned. Reproducible builds are possible; the agent can reason about exact dependency state.

### Security Audit

Tool: `npm audit --json`
Summary: 0 CRITICAL, 1 HIGH, 8 MODERATE, 0 LOW (9 total — down from 84)
Direct vs transitive: 2 direct (`@angular-devkit/build-angular`, `firebase-tools`), 7 transitive

**Runtime exposure: none.** Every remaining advisory lives in the dev-tooling tree (`webpack-dev-server`, `serialize-javascript`, `copy-webpack-plugin`, `gaxios`, `uuid`, `sockjs`, `universal-analytics`). Production bundles built by `ng build` do not include these modules.

#### HIGH finding

- **serialize-javascript** ≤7.0.4 — [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq): RCE via `RegExp.flags` and `Date.prototype.toISOString()` (CVSS 8.1). Transitive via `copy-webpack-plugin` → `@angular-devkit/build-angular`. `fixAvailable: false` — the fix lives upstream in the next Angular Devkit release, which requires bumping `@angular-devkit/build-angular` past v19 to clear. Risk: dev server only. Mitigation: do not run untrusted serialization input through `webpack-dev-server` (default state — nothing to do today).

#### MODERATE findings (all dev-tool transitive)

- **uuid** <11.1.1 — [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq): missing buffer bounds check in v3/v5/v6 (CVSS 7.5). Transitive via `firebase-tools` → `gaxios`, `sockjs`, `universal-analytics`. `fixAvailable` requires a major bump of `firebase-tools` (13 → 15). Affects dev CLI only.
- **webpack-dev-server** ≤5.2.3 — [GHSA-79cf-xcqc-c78w](https://github.com/advisories/GHSA-79cf-xcqc-c78w): cross-origin source-code exposure on non-HTTPS origins (CVSS 5.3). Resolves with the next Devkit release.
- **copy-webpack-plugin**, **gaxios**, **sockjs**, **universal-analytics** — transitive cascade of the above two.
- **firebase-tools** 13.6.1 — direct, MODERATE, fix available via `firebase-tools@15.x` (major bump).
- **@angular-devkit/build-angular** 19.2.26 — direct, MODERATE, no fix available within the 19.x line.

#### CRITICAL findings

None.

### Outdated Dependencies

Packages with major version gaps (`npm outdated --json`):

| Package | Current | Latest | Major gap |
|---|---|---|---|
| `@angular/*` (animations, cdk, common, compiler, core, forms, material, router, etc.) | 19.2.x | 21.2.14 | 2 |
| `@angular-devkit/build-angular` | 19.2.26 | 21.2.12 | 2 |
| `@ngx-translate/core` | 15.0.0 | 17.0.0 | 2 |
| `@ngx-translate/http-loader` | 8.0.0 | 17.0.0 | ~9 (realigned versioning) |
| `@types/jasmine` | 4.3.1 | 6.0.0 | 2 |
| `jasmine-core` | 4.5.0 | 6.2.0 | 2 |
| `firebase-tools` | 13.6.1 | 15.18.0 | 2 |
| `pdfmake` | 0.2.7 | 0.3.9 | 0.x rewrite — DO NOT bump silently (PDF-fidelity guardrail) |
| `typescript` | 5.8.2 | 6.0.3 | 1 |
| `zone.js` | 0.15.0 | 0.16.2 | 0.x bump |

Staying on Angular 19 is reasonable for the PRD's brownfield window. Plan the v20/v21 jump (control-flow syntax, signals stabilization, standalone-only default), the ngx-translate 15 → 17 migration, and the Jasmine 4 → 6 jump as explicit follow-up work after the brownfield change lands.

### Version skew (new finding)

`@angular/cli` is at **^21.2.12** while every other `@angular/*` package is at **^19.2.x**. The v21 CLI is driving a v19 codebase. `npm ls` flags `@angular/core@19.2.22` as "invalid" for multiple peer-deps that pin to `19.2.1`. The build still works today, but:

- CLI schematics (`ng generate component`, `ng generate service`) default to v21 idioms — standalone components, `@if`/`@for` control-flow syntax — which conflict with this project's NgModule + v19 conventions.
- Future `npm install` runs may surface increasingly noisy peer-dep warnings as the CLI drifts further from the framework.

Fix: either pin `@angular/cli` back to `~19.2.x` to match the framework, or bump the whole framework to 21. The first is the safer near-term move; the second is the explicit future work above.

## Test Suite

Test runner: Karma + Jasmine
Tests found: 3 spec files

```
src/app/shared/components/form/form-wrapper/form-wrapper.component.spec.ts
src/app/shared/components/form/input-text/input-text.component.spec.ts
src/app/teddy-eddie-report/teddy-eddie-form/teddy-eddie-form.component.spec.ts
```

Configuration: Angular CLI defaults (no `karma.conf.js` at root); test script `ng test` in `package.json`.
Framework: Jasmine `~4.5.0` via Karma `~6.4.0`; `@types/jasmine ~4.3.0`.
Test execution: not attempted in this run (would launch Karma + Chrome — `npm run test -- --watch=false --browsers=ChromeHeadless` is the headless invocation when needed).

**Coverage observation.** Three spec files in a codebase with four full report features (`cambridge-report`, `semestr-report`, `teddy-eddie-report`, `year-report`) plus `shared/`, `helper/`, `model/`, and `rating-scale/`. Two of the three look scaffold-generated. Effective test coverage is low — the agent has limited automated signal that its changes don't regress existing report behavior. This is not a Category A blocker (the runner works), but it is worth knowing during the brownfield change scope.

**Test-runner pin.** Stack-assess noted Karma is on the upstream deprecation path (Angular's modern guidance steers toward Jest / Web Test Runner / Vitest). For this brownfield change, do NOT introduce a new runner — pin to Jasmine + Karma. The pin belongs in the project conventions file that the agent onboarding lesson generates.

## CI/CD

Provider: not detected
Configuration: no `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `.circleci/`, or other CI config found at the project root.

| Stage      | Status | Notes                                                          |
|------------|--------|----------------------------------------------------------------|
| Lint       | ✗      | ESLint installed locally but no CI step runs `npm run lint`     |
| Test       | ✗      | runner exists locally only                                      |
| Build      | ✗      | `ng build` runs locally only                                    |
| Type check | ✗      | relies on `ng build`'s strict TypeScript compile                |
| Security   | ✗      | no Dependabot, CodeQL, or `npm audit` gate                      |

ℹ No CI/CD configuration detected. You'll set this up in the [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5) lesson. For now, a working local test runner plus the project's strict TypeScript compiler plus the new ESLint configuration give enough signal for agent collaboration.

## Configuration

### High severity

None. The previous report's high-severity ESLint gap has closed — see below.

### Medium severity

- **Angular CLI / framework version skew** — see *Dependency Health → Version skew* above. Medium severity because the build still works; the friction is in schematics defaulting to v21 idioms that don't match the v19 codebase.

### Low severity

- **`.env.example` / `.env.template`** — not present. Acceptable for now since no environment variables are documented in the codebase. Worth adding once the brownfield change introduces backend persistence and Firebase config keys (FR-005, FR-009 in the PRD).

### Present and healthy

- `package-lock.json` — versions pinned.
- `tsconfig.json` — `strict: true` plus `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`. Angular compiler options enforce `strictTemplates`, `strictInjectionParameters`, `strictInputAccessModifiers`. Strong type discipline at source.
- `eslint.config.js` — flat-config ESLint with `@eslint/js`, `typescript-eslint` (recommended + stylistic), `angular-eslint` (TS + template + accessibility configs), enforcing `app` prefix on component/directive selectors. **New since previous report.**
- `.prettierrc.json` — Prettier 3.8.3 pinned with `printWidth: 120`, `singleQuote: true`, `tabWidth: 2`, `trailingComma: "es5"`. **New since previous report.**
- `firebase.json` + `.firebaserc` — Firebase Hosting deploy target (`public: "dist/browser"`, SPA rewrite to `/index.html`).
- `angular.json` — workspace schema present.
- `.editorconfig` — editor-level formatting baseline.
- `.gitignore` — present.

## Stack Assessment Cross-Reference

Stack assessment: `context/foundation/stack-assessment.md` (assessed 2026-05-23)
Agent readiness (from stack-assess): **ready-with-compensation**

| Quality Gate Gap (from stack-assess)              | Health-Check Finding                                                                                                                | Status                                |
|---------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| Gap 1 — no project-level instruction file          | `CLAUDE.md` at root + `src/CLAUDE.md` both contain 10x toolkit content, not project conventions                                       | Open (deferred to M1L4)               |
| Gap 2 — no linter wired up                         | `eslint.config.js` present; `eslint`, `typescript-eslint`, `angular-eslint` installed; `npm run lint` wired in `package.json:10`     | **Resolved**                          |
| Gap 3 — no CI/CD pipeline                          | No `.github/workflows/` or other CI config detected                                                                                  | Open (deferred to M1L5)               |
| Gap 4 — test runner on deprecation path            | Karma + Jasmine confirmed; no pin documented yet                                                                                     | Open (deferred to M1L4)               |
| Gap 5 — Firebase tooling ambiguity                 | `firebase.json` + `.firebaserc` present; deploy target = Firebase Hosting (`dist/browser`)                                            | **Resolved**                          |

Two of the five stack-assess gaps have closed since 2026-05-23: ESLint is now wired up (Gap 2) and the Firebase deploy target is documented on disk (Gap 5). The remaining three gaps (project conventions, CI/CD, test-runner pin) are best addressed in the upcoming agent onboarding (M1L4) and infrastructure (M1L5) lessons. Health-check intentionally does NOT recommend generating a project-conventions block now, because the agent onboarding lesson walks through that with the right content.

## Recommended Fixes

### Fix before agent work (Category A)

#### 1. Resolve the Angular CLI / framework version skew

**Impact**: `@angular/cli@21` driving a v19 codebase means new schematics generate standalone components and `@if`/`@for` control-flow templates, which conflict with this project's NgModule + v19 conventions. The first agent-authored `ng generate component` would land code in a style that doesn't match anything else in `src/app/`.
**Severity**: medium
**Effort**: quick (< 5 min)
**Fix** (option A — recommended for the brownfield window):

```bash
npm install --save-dev @angular/cli@~19.2.26
npm install @angular/animations@~19.2.22 @angular/forms@~19.2.22 \
            @angular/platform-browser@~19.2.22 @angular/platform-browser-dynamic@~19.2.22 \
            @angular/router@~19.2.22
npx ng version  # confirm all @angular/* land on 19.2.x
```

The second `npm install` line is optional but addresses the noisy `npm ls` peer-dep "invalid" warnings (some `@angular/*` packages are still at 19.2.1 while core resolved to 19.2.22).

**Fix** (option B — defer to follow-up work): leave the CLI at v21 and plan an Angular 19 → 21 migration as explicit future work. Acceptable if no agent-led `ng generate` is expected during the brownfield change.

#### 2. Decide on the remaining advisories

**Impact**: the 1 HIGH (serialize-javascript) and 8 MODERATE advisories are all transitive in dev tooling — no runtime exposure. They cannot be cleared without a major-version bump of `@angular-devkit/build-angular` (to 20+) or `firebase-tools` (to 15.x). The risk profile is low; what matters is making the call explicitly rather than letting the audit output accumulate noise.
**Severity**: low (informational)
**Effort**: quick (< 5 min — the decision, not the fix)
**Fix**: choose one of:

- **Accept the risk.** Document in `context/foundation/lessons.md` (or wherever follow-up work is tracked) that the remaining advisories are dev-tooling-only and will clear with the Angular 19 → 21 / firebase-tools 13 → 15 migrations.
- **Bump firebase-tools alone** (`npm install firebase-tools@~15.x`). This clears the uuid/gaxios cascade in one step. Test `firebase deploy --only hosting:dry-run` (or whatever you use) to confirm no CLI behavior changed.

#### 3. Broaden test coverage before agent-led changes

**Impact**: with only three spec files in a codebase touching four report types plus shared components, the agent has limited automated signal that changes don't regress existing behavior. The PDF-fidelity guardrail in the PRD becomes harder to enforce without smoke tests.
**Severity**: medium
**Effort**: significant (> 1 hour — at minimum, add a smoke spec per report component verifying it instantiates and basic form bindings resolve)
**Fix**: not a single command. Approach: for each of the four `*-report/` feature folders, generate a basic component spec; assert that the component instantiates and that one critical form binding resolves. Defer deep behavioral tests to per-feature changes. (Note: this is the same recommendation as the previous health-check — still applicable.)

#### 4. PDF-fidelity smoke check (informational, not a fix)

**Impact**: this is a process recommendation, not a code change. Before the brownfield change merges anything that touches `pdfmake` or its inputs, generate before/after PDFs with identical inputs and diff them visually. The PRD's PDF-fidelity guardrail covers all four existing report types.
**Severity**: medium
**Effort**: moderate (15–30 min per affected report type per change)
**Fix**: document the procedure in the project conventions block during agent onboarding (M1L4). For now, just remember the rule.

### Addressed in upcoming lessons (Category B)

#### Missing project-level conventions in CLAUDE.md

**Lesson**: [Agent Onboarding: Agents.md, AI Rules i feedback loops (M1L4)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l4)
**What you'll do there**: build `CLAUDE.md` / `AGENTS.md` with project-specific conventions (folder organization, shared-vs-helper split, i18n key namespacing, PDF-fidelity guardrail, test-stack pin, naming rules now enforced by ESLint). Stack-assess already drafted ready-to-paste content for these — that draft will land here. The current root `CLAUDE.md` and `src/CLAUDE.md` are 10x toolkit content, not project conventions; M1L4 fills that gap.

#### Missing CI/CD pipeline

**Lesson**: [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)
**What you'll do there**: wire up a CI workflow (likely GitHub Actions, since the repo is on GitHub) that runs build + test + lint on push and PR, plus a first deploy of the walking skeleton to Firebase Hosting (`firebase.json` is already configured).

#### Missing deployment automation

**Lesson**: same as above (M1L5)
**What you'll do there**: connect the CI pipeline to Firebase Hosting via the Firebase GitHub Action (or `firebase deploy --token`), and gate production deploys on green tests. The deploy configuration on disk (`firebase.json`, `.firebaserc`) is the foundation; the automation around it ships in the infrastructure lesson.

## Summary

Health status: **healthy**

The project's bones are solid and the picture has improved markedly since the previous health-check. The 84-advisory backlog is gone — 9 remain, all transitive in dev tooling, none touching the runtime bundle. ESLint is wired up with `angular-eslint` (template + accessibility configs included), Prettier is pinned, Firebase Hosting deploy is configured. Two of the five stack-assess compensation gaps have closed without external action.

The remaining Category A items are small: pin `@angular/cli` back to v19 (or plan an explicit framework upgrade), decide explicitly what to do about the dev-tooling advisories, and broaden test coverage before agent-led refactors. The Category B items (project conventions, CI/CD, deploy automation) are by design upcoming-lesson work — not gaps to fix today.

Next step: pin `@angular/cli@~19.2.26`, then proceed to agent onboarding (M1L4). The project will be in good shape for the brownfield change.
