---
project: britannia-reports
checked_at: 2026-05-25T00:00:00Z
health_status: critical-issues
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
  critical: 4
  high: 40
  moderate: 29
  low: 11
test_runner_detected: true
ci_provider: null
recommended_fixes: 9
---

# Health Check — britannia-reports

Companion to `context/foundation/stack-assessment.md`. Stack-assess evaluated the *stack choice* against quality gates and verdicted `ready-with-compensation`. This report evaluates the *project state* against operational health criteria and verdicts `critical-issues` — the verdict is driven by the dependency-audit findings, not by the stack itself.

**Headline.** The Angular 19 codebase is fundamentally healthy: strict TypeScript, working test runner, modern Angular CLI. The friction is in the dependency tree. `npm audit` reports 4 CRITICAL and 40 HIGH advisories across 84 total findings. The 4 criticals are all transitive through `firebase-tools` (a dev-only tool that the project has installed but never wired up — see stack-assessment Gap 5). The HIGH-severity findings include three direct Angular packages with real XSS/XSRF advisories affecting shipped code. Combine that with an absent linter, a near-empty test suite, and a missing formatter config, and the project needs preparation before agent-assisted work runs at full speed.

## Dependency Health

### Lockfile

```
Status: present (package-lock.json)
Package manager: npm
```

### Security Audit

```
Tool: npm audit --json
Summary: 4 CRITICAL, 40 HIGH, 29 MODERATE, 11 LOW
Direct vs transitive: 6 advisories flagged on direct dependencies; the remaining 78 are transitive
```

#### CRITICAL findings

All four CRITICAL advisories sit on transitive dependencies pulled in by `firebase-tools` (a direct devDependency).

- **basic-ftp** ≤5.3.0 — GHSA-5rq4-664w-9x2c: Path traversal in `downloadToDir()` (CVSS 9.1). Plus three additional HIGH advisories on the same package (CRLF injection, DoS via unbounded memory, multiline-control-response buffering). Fix: bump `firebase-tools` to ≥15.18.0 (resolves the chain).
- **crypto-js** <4.2.0 — GHSA-xwcq-pm8m-c4vf: PBKDF2 implementation 1.3M times weaker than current standard (CVSS 9.1). Fix: bump `firebase-tools` to ≥15.18.0 (resolves the chain).
- **form-data** 4.0.0–4.0.3 — GHSA-fjxv-7rqg-78g4: Unsafe random function for choosing multipart boundary. Fix: bump `firebase-tools` to ≥15.18.0 (resolves the chain).
- **protobufjs** — GHSA-h755-8qp9-cq85 and GHSA-xq3m-2v4x-88gg: Prototype Pollution AND Arbitrary code execution (CVSS 9.8 each). Fix: bump `firebase-tools` to ≥15.18.0 (resolves the chain).

**Operational impact note.** All four criticals live in the dev toolchain — they do not reach the browser bundle. The project does not import `firebase-tools` (or its deps) from `src/`, and `firebase-tools` itself is installed but not currently configured for deploy (no `firebase.json` / `.firebaserc` per stack-assess Gap 5). The advisories matter for the build-time environment and for any future use of `firebase deploy`, not for the running web app. Still — the schema's bar for `critical-issues` is the presence of CRITICAL findings without qualification, and either upgrading or removing `firebase-tools` closes all four in one move.

#### HIGH findings on direct dependencies (in-bundle code)

These ship to users. Patches are available within the existing `^19.2.x` caret range and a single `npm update` resolves them.

- **@angular/common** 19.2.1 — GHSA-58c5-g7wp-6w37: XSRF Token Leakage via Protocol-Relative URLs in the Angular HTTP Client. Fix: `npm update @angular/common` (current `19.2.1` → wanted `19.2.22`; resolves at 19.2.16+).
- **@angular/compiler** 19.2.1 — GHSA-g93w-mfhg-p222 (CVSS 9.0): XSS in i18n attribute bindings. Also GHSA-v4hv-rgfq-gp49 (XSS via SVG animation/URL/MathML attributes) and GHSA-jrmj-c5cx-3cw6 (XSS via unsanitized SVG script attributes). Fix: `npm update @angular/compiler` (current `19.2.1` → wanted `19.2.22`).
- **@angular/core** 19.2.1 — GHSA-g93w-mfhg-p222 (CVSS 9.0) and GHSA-prjf-86w9-mfqv (i18n XSS, CVSS 6.1) and GHSA-jrmj-c5cx-3cw6 (unsanitized SVG script attributes). Fix: `npm update @angular/core` (current `19.2.1` → wanted `19.2.22`).

#### HIGH findings on direct devDependencies (build/tooling only)

- **@angular/cli** 19.2.1 — chain advisories via `@angular-devkit/core`, `@schematics/angular`, `pacote`. Fix: `npm update @angular/cli`.
- **firebase-tools** 13.6.1 — chain advisories via `@google-cloud/pubsub`, `tar`, `uuid`. Fix: `npm install firebase-tools@^15.18.0 --save-dev` (or remove if unused — see stack-assess Gap 5).
- **@angular-devkit/build-angular** 19.2.1 (MODERATE on the direct package, but pulls HIGH children). Fix: included in the `npm update @angular/cli` cycle.

#### MODERATE and LOW findings

29 MODERATE and 11 LOW advisories. The largest concentrations: `@angular-devkit/*` and `webpack`-chain transitive deps (build toolchain), and `firebase-tools` sub-deps (`brace-expansion`, `follow-redirects`, `js-yaml`, `ajv`, `@grpc/grpc-js`, `ip-address`, `@protobufjs/utf8`, `http-proxy-middleware`, etc.). Almost all of these resolve by the same two updates that fix the HIGHs: `npm update` for Angular tooling + `firebase-tools` upgrade.

### Outdated Dependencies

```
Packages with major version gaps: 7 (excluding Angular itself, which spans many packages)
```

Direct dependencies more than 1 major version behind latest:

- **firebase-tools**: 13.6.1 → 15.18.0 (2 major versions behind; the audit-resolution target).
- **@ngx-translate/http-loader**: 8.0.0 → 17.0.0 (9 major versions behind — large drift; verify ngx-translate v17 compatibility before bumping).
- **@ngx-translate/core**: 15.0.0 → 17.0.0 (2 major versions behind).
- **jasmine-core**: 4.5.0 → 6.2.0 (2 major versions behind).
- **@types/jasmine**: 4.3.1 → 6.0.0 (2 major versions behind).
- **prettier**: 2.8.8 → 3.8.3 (1 major version behind; Prettier 3 changes default trailing-comma and other formatting rules — bump deliberately, not casually).
- **typescript**: 5.8.2 → 6.0.3 (1 major version behind; TS 6 has stricter checks — Angular 19 may not officially support TS 6 yet, hold).
- **bootstrap**: 5.2.3 → 5.3.8 (minor only, but two minor versions behind; included for completeness).

Angular packages themselves (currently 19.2.1) are 2 majors behind the upstream `21.2.x` line. Upgrading is a deliberate framework move, not a routine update — out of scope for this health check; flagged for the implementer to weigh against the 3-week MVP budget.

## Test Suite

```
Test runner: Karma + Jasmine
Tests found: 1 spec file (src/app/app.component.spec.ts — the default Angular CLI scaffold spec)
Test execution: not attempted (Karma launches Chrome interactively on Windows; a non-interactive dry-run requires headless configuration that is not currently in `angular.json:86-104`)
```

```
Configuration: angular.json:86-104 (uses @angular-devkit/build-angular:karma builder)
Framework: jasmine-core 4.5.0, karma 6.4.2
```

⚠ **Test coverage is effectively zero for feature code.** The only spec file is the default `app.component.spec.ts` that ships with `ng new`. None of the existing feature folders (`cambridge-report/`, `semestr-report/`, `teddy-eddie-report/`, `year-report/`, `shared/`, `helper/`, `rating-scale/`) have any test coverage. The agent cannot verify behavior of any of the four PDF form types via the test suite. For the brownfield change in `prd.md` (FR-014 layered template-apply on the trimester/semester form, FR-013 student-picker integration), the agent will need to lean on manual visual diffing of PDFs and on careful code review rather than on a green test suite.

The Karma + Jasmine stack itself is detected and working — the gap is the absent coverage, not a broken runner. Per stack-assess Gap 4, Karma is in maintenance mode upstream but is fine for this MVP.

## CI/CD

```
Provider: not detected
Configuration: not found
```

| Stage      | Status | Notes                                      |
|------------|--------|--------------------------------------------|
| Lint       | ✗      | not configured (no linter installed either) |
| Test       | ✗      | not configured (Karma exists locally, no CI invocation) |
| Build      | ✗      | not configured                              |
| Type check | ✗      | not configured (`tsc` runs as part of `ng build`, but not separately gated) |
| Security   | ✗      | not configured (no `npm audit` gate, no Dependabot) |

ℹ No CI/CD configuration detected. You'll set this up in [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5). For now, a working local test runner plus a clean dependency tree is what matters for agent collaboration; CI is a Category B item.

## Configuration

### High severity

- **No ESLint configuration.** No `.eslintrc*` or `eslint.config.*` at the project root, no `@angular-eslint/schematics` installed. The agent has no automated way to catch unused imports, RxJS subscription leaks, accessibility issues in templates, or naming-convention violations. Per stack-assess Gap 2: this is the second-highest-leverage compensation after the security advisories. Fix: `ng add @angular-eslint/schematics` from the project root.

### Medium severity

- **No Prettier configuration.** `prettier` 2.8.8 is in devDependencies but no `.prettierrc` (or `.prettierrc.json` / `prettier.config.js`) exists at the project root. Prettier runs against built-in defaults — your team's style is implicit, not pinned. Agent-authored code will format with whatever defaults the agent picks. Fix: add a `.prettierrc` with the project's preferred settings (at minimum, `printWidth`, `singleQuote`, `trailingComma` — see Angular community conventions).

### Low severity

- **No `.env.example` / `.env.template`.** Currently the build doesn't depend on environment variables (no `process.env` references in `src/`), so this is informational. When backend persistence lands (PRD FR-005, FR-009), environment-variable documentation will matter — add an `.env.example` at that point.

The expected core files are present: `.editorconfig` ✓, `.gitignore` ✓, `tsconfig.json` with full `strict: true` plus 4 additional strictness flags ✓, `angular.json` ✓.

## Stack Assessment Cross-Reference

```
Stack assessment: context/foundation/stack-assessment.md
Agent readiness (from stack-assess): ready-with-compensation
```

| Quality Gate Gap                                | Health-Check Finding                                                                  | Status     |
|-------------------------------------------------|---------------------------------------------------------------------------------------|------------|
| Gap 1 — No project-level CLAUDE.md / AGENTS.md  | Project-conventions CLAUDE.md not present (the existing `CLAUDE.md` is the 10xDevs lesson router, not project conventions). To be created in the agent onboarding lesson (M1L4). | Acknowledged (Category B) |
| Gap 2 — No linter wired up                      | Confirmed: no `.eslintrc*` / `eslint.config.*`, no `@angular-eslint/schematics`        | Reinforced |
| Gap 3 — No CI/CD pipeline                       | Confirmed: no `.github/workflows/`, no other CI config                                | Reinforced (Category B) |
| Gap 4 — Test runner on deprecation path (Karma) | Karma + Jasmine detected and working; only the default scaffold spec exists           | Reinforced |
| Gap 5 — Firebase tooling installed but unconfigured | Confirmed: no `firebase.json`/`.firebaserc`. AND: `firebase-tools` is the source of all 4 CRITICAL audit findings + many HIGHs. This gap is now load-bearing for security, not just deploy ambiguity. | Reinforced (significantly) |

The stack-assess verdict was `ready-with-compensation`. With operational findings added, the immediate fix list is the four direct security advisories plus a `firebase-tools` decision (upgrade vs remove). The stack-assess recommended-instruction-file blocks remain on the agent-onboarding lesson's plate.

## Recommended Fixes

### Fix before agent work (Category A)

#### 1. Patch the three direct Angular packages with HIGH advisories

**Impact**: `@angular/common`, `@angular/compiler`, and `@angular/core` ship in the browser bundle. The XSRF Token Leakage (GHSA-58c5-g7wp-6w37) and i18n XSS (GHSA-g93w-mfhg-p222, CVSS 9.0) are real-user risks for the deployed app, especially given the PRD's planned move from anonymous public access to authenticated multi-user state. Patches are within your existing `^19.2.x` caret range — no major-version surgery.
**Severity**: high
**Effort**: quick (< 5 min)
**Fix**:

```bash
npm update @angular/common @angular/compiler @angular/core @angular/animations @angular/cdk @angular/forms @angular/material @angular/material-moment-adapter @angular/platform-browser @angular/platform-browser-dynamic @angular/router @angular/compiler-cli
npm audit
```

After the update, verify the three GHSA advisories above no longer appear in `npm audit --json`. The patch range is `19.2.16+` for common, `19.2.20+` for compiler, `19.2.20+` for core; the `wanted` column in `npm outdated` was `19.2.22` for all three — pulling that closes all three advisories at once.

#### 2. Resolve the firebase-tools chain (4 CRITICALs + many HIGHs)

**Impact**: `firebase-tools` 13.6.1 transitively brings in `basic-ftp`, `crypto-js`, `form-data`, and `protobufjs` with CRITICAL advisories (CVSS 9.1, 9.1, "critical", 9.8). The dev toolchain is the runtime environment for `npm install`, `ng build`, and any developer machine — these matter at build time, even if they do not ship to the browser. Per stack-assess Gap 5, `firebase-tools` is installed but not configured for deploy. PRD Open Question #3 (backend persistence platform) is the upstream decision point.
**Severity**: critical (4 advisories)
**Effort**: moderate (15–30 min, including resolving PRD Open Question #3)
**Fix**: choose one of:

- **Option A — Remove if vestigial** (recommended if PRD Open Question #3 resolves to a non-Firebase platform):

  ```bash
  npm uninstall firebase-tools
  npm audit
  ```

  This is the cleanest path. If you later decide on Firebase Hosting, re-install at the latest version.

- **Option B — Upgrade to a non-vulnerable version** (if you commit to Firebase as the deploy/persistence platform now):

  ```bash
  npm install firebase-tools@^15.18.0 --save-dev
  npm audit
  ```

  Note: 13.x → 15.x is a major-version bump per `npm outdated`; review the firebase-tools changelog for CLI command changes and any breaking changes that might affect future deploy scripts.

Both options close all 4 CRITICAL findings and the majority of the MODERATE/LOW transitive findings.

#### 3. Wire up ESLint via `@angular-eslint`

**Impact**: Without a linter, the agent has no automated check for unused imports, RxJS subscription leaks (relevant for `OnDestroy` patterns the stack-assess CLAUDE.md draft calls out), template-binding errors, naming-convention violations, or accessibility issues in templates. This directly compounds with stack-assess Gap 2 — the gap is unchanged in this check; the operational evidence now matches.
**Severity**: high
**Effort**: moderate (15–30 min, including running `ng add` and reviewing the schematic's defaults)
**Fix**:

```bash
ng add @angular-eslint/schematics
```

Follow the prompts. The schematic installs `@angular-eslint/builder`, `@angular-eslint/eslint-plugin`, `@angular-eslint/eslint-plugin-template`, `@angular-eslint/template-parser`, and `eslint`, adds `eslint.config.js` (or `.eslintrc.json` on older versions), and registers a `lint` target in `angular.json`. Run `ng lint` once after install to see the initial baseline of warnings against the existing codebase, then decide whether to auto-fix or address incrementally.

#### 4. Patch `@angular/cli` and `@angular-devkit/build-angular`

**Impact**: HIGH advisories in the build toolchain. While these do not reach the browser bundle, they affect anyone who runs `ng build` or `ng serve` — that is every developer and the agent. Cleaning the toolchain reduces the audit noise so future audits stay focused on real issues.
**Severity**: high
**Effort**: quick (< 5 min)
**Fix**:

```bash
npm update @angular/cli @angular-devkit/build-angular
npm audit
```

This is typically bundled with fix #1 above (all Angular workspace packages move together).

#### 5. Add a `.prettierrc` formatter configuration

**Impact**: Prettier 2.8.8 is installed but unconfigured — formatting is implicit, not pinned. Agent-authored code formats with whatever defaults the agent picks; team-authored code formats with whatever editor Prettier extension defaults the developer's IDE picks. They will not match. With ESLint going in (fix #3), the formatter pin matters even more.
**Severity**: medium
**Effort**: quick (< 5 min)
**Fix**: create `.prettierrc` at the project root with a small starter config (adjust to taste):

```json
{
  "printWidth": 120,
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

Then run `npx prettier --write .` once to apply consistently across the existing tree, and commit the result as a separate commit (large diff, but one-shot).

#### 6. Decide on Prettier 3 vs 2 (deliberately, not via routine update)

**Impact**: Prettier 3 changes the default for `trailingComma` from `"es5"` to `"all"` and adjusts several other defaults. A casual upgrade reformats the entire codebase silently. Pinning to 2.8.8 is fine; upgrading is fine; the wrong outcome is a mystery diff in the first agent PR.
**Severity**: medium
**Effort**: quick decision (< 5 min)
**Fix**: either keep `prettier@^2.8.8` (do nothing) or `npm install prettier@^3.8.3 --save-dev` + `npx prettier --write .` and commit the reformatting in a single dedicated commit before any agent work starts.

#### 7. Add at least one smoke spec per feature folder

**Impact**: The agent will modify trimester/semester form code (FR-014), add a student picker (FR-013), and add a template-apply flow (FR-011). With only `app.component.spec.ts` to lean on, regressions in the four existing form types (FR-015 / FR-016 / FR-017 preservation) are caught visually or not at all. Even one "component instantiates without error and renders its title" spec per feature folder dramatically improves the agent's ability to verify its own work.
**Severity**: high
**Effort**: significant (> 1 hour to write per-feature smoke specs across all four form types, `shared/`, `helper/`, and `rating-scale/`)
**Fix**: for each feature folder, add a `<feature>.component.spec.ts` next to the component. Start with the generated boilerplate from `ng generate component <feature> --dry-run` to see the canonical spec shape, then extend with at least:
- one "should create" assertion (component instantiates)
- one "should render <key element>" assertion using `fixture.nativeElement.querySelector(...)`
- if the component generates a PDF, one "should call pdfmake.createPdf" spec using a Jasmine spy

Treat this as a parallel task during the first week of the brownfield change, not as a precondition.

#### 8. Patch the remaining outdated dependencies within their current major

**Impact**: Most direct dependencies are at their pinned floor (current matches the caret-floor); the `wanted` column shows in-range patches available across the board. Running `npm update` once now keeps the agent's first PR diff focused on intended changes rather than incidental dependency upgrades.
**Severity**: medium
**Effort**: quick (< 5 min)
**Fix**:

```bash
npm update
npm audit
```

This covers `bootstrap` 5.2.3 → 5.3.8, `rxjs` 7.8.1 → 7.8.2, `zone.js` 0.15.0 → 0.15.1, `karma-coverage` 2.2.0 → 2.2.1, `karma` 6.4.2 → 6.4.4, and the moment 2.29.4 → 2.30.1 sweep. None are major-version bumps. The Angular bump in fix #1 also lands as part of this; run as a single transaction.

#### 9. Hold on the major-version-behind dev deps

**Impact**: `typescript` 5.8 → 6, `jasmine-core` 4 → 6, `@types/jasmine` 4 → 6, `@ngx-translate/*` to v17. These touch language semantics, test API, and i18n behavior respectively. Each one merits its own evaluation against Angular 19's compatibility matrix.
**Severity**: low
**Effort**: holding decision — significant if pursued
**Fix**: do NOT bump any of these as part of the brownfield-change kickoff. Evaluate per-package later when the MVP is stable, or fold into a future Angular 21 upgrade pass.

### Addressed in upcoming lessons (Category B)

#### CI/CD pipeline

**Lesson**: [Sprint Zero z Agentem: infrastruktura, walking skeleton i pierwszy deploy (M1L5)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l5)
**What you'll do there**: set up a minimal GitHub Actions workflow that runs `npm ci`, `ng build --configuration production`, `ng lint`, and `ng test --watch=false --browsers=ChromeHeadless` on push to `master` and on PRs. Stack-assess proposed a starter workflow stub — that block lands in M1L5, not now.

#### Project-conventions CLAUDE.md / AGENTS.md

**Lesson**: [Agent Onboarding: Agents.md, AI Rules i feedback loops (M1L4)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l4)
**What you'll do there**: build the project-conventions instruction file using the recommended blocks from `context/foundation/stack-assessment.md` (folder organization, component conventions, i18n rules, state management, PDF fidelity guardrail, test stack pin, build & deploy, interim lint self-enforcement). Generating a stub now would be premature — the lesson walks through the right structure and content.

#### Firebase deploy story / backend persistence platform

**Lesson**: implementation phase, driven by PRD Open Question #3
**What you'll do there**: pick a backend persistence platform (Firebase, Supabase, or other) and lock the deploy target. The audit-resolution choice (fix #2 above) is the operational consequence of this decision — Option A (remove firebase-tools) if you go non-Firebase, Option B (upgrade) if Firebase wins.

## Summary

Health status: **critical-issues**

The Angular 19 stack and its conventions are solid — the strict TypeScript configuration, the working Karma+Jasmine setup, and the consistent feature-folder structure all support agent workflows well. The verdict is driven by the dependency tree: 4 CRITICAL and 40 HIGH `npm audit` advisories, of which the load-bearing ones are three direct Angular packages with real XSS/XSRF issues (in-bundle) and the `firebase-tools` chain pulling all 4 CRITICALs (dev-tooling, but still). The Category A fix list is dominated by two cheap moves (patch Angular, decide on `firebase-tools`) and one moderate move (wire up ESLint); the rest is housekeeping. None of the Category B gaps — no CI, no project-conventions instruction file, no committed deploy story — penalize this verdict; those land in the upcoming lessons.

Next step: address fixes #1, #2, and #3 (the security advisories and the linter) before the brownfield change kicks off, then proceed to [Agent Onboarding: Agents.md, AI Rules i feedback loops (M1L4)](https://platforma.przeprogramowani.pl/external/10xdevs-3/m1-l4) where the project-conventions instruction file is authored using the recommended blocks from `context/foundation/stack-assessment.md`.
