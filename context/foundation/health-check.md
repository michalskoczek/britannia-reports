---
project: britannia-reports
checked_at: 2026-07-10T00:00:00Z
supersedes: 2026-06-02 audit
health_status: healthy
context_type: brownfield
language_family: js
stack_assessment_available: true
checks_run:
  - lockfile
  - dependency_audit
  - outdated_deps
  - test_runner
  - lint
  - build
  - ci_cd
  - configuration
audit_findings:
  critical: 0
  high: 0
  moderate: 5
  low: 0
test_runner_detected: true
ci_provider: null
deployment_target: firebase-hosting
recommended_fixes: 3
---

# Health Check — britannia-reports

Operational audit of the current project state — dependency hygiene, test infrastructure, lint, build, CI/CD, configuration. Complements `context/foundation/stack-assessment.md`, which evaluates the *stack choice* rather than the *project state*.

Every claim below was re-run against the tree on 2026-07-10. Nothing is carried forward from the previous audit on faith.

**Headline:** healthy, after two fixes applied during this audit.

The 2026-06-02 audit reported `0 CRITICAL / 0 HIGH / 3 MODERATE` and asserted that "no runtime / shipped-to-browser code is affected". By 2026-07-10 that was no longer true: `npm audit` reported **24 vulnerabilities including 12 HIGH**, two of them in `dependencies` (not devDependencies) and therefore shipped to the browser — `@angular/core` (Client Hydration DOM Clobbering & Response-Cache Poisoning) and `@angular/common` (DoS via OOM in number formatting).

Both were fixable inside the existing semver range: the advisories covered `≤ 20.3.24` and the project was pinned at `^20.3.21`. `npm audit fix` (no `--force`) bumped the Angular set to `20.3.26`. **`package.json` was not modified — only `package-lock.json`.** `firebase-tools` was *not* downgraded; it moved forward, 15.19.0 → 15.23.0.

`npm audit fix` bumped only the three vulnerable Angular packages, leaving `forms`, `animations`, `platform-browser`, and `router` behind at 20.3.21 — exactly the isolated-walk that `src/CLAUDE.md` warns against. The whole set was then aligned to 20.3.26 with a scoped `npm update`.

Lint had also regressed since the last audit (see `## Lint`). It is clean again.

## Dependency Health

### Lockfile

```
Status: present (package-lock.json)
Package manager: npm
```

### Security Audit

```
Tool: npm audit (followed by npm audit fix, no --force)
Before: 0 critical, 12 high, 9 moderate, 3 low  (24 total)
After:  0 critical,  0 high, 5 moderate, 0 low  (5 total)
```

#### Resolved by this audit

| Package | Severity | Scope | Advisory |
|---|---|---|---|
| `@angular/core` | HIGH | **runtime** | Client Hydration DOM Clobbering & Response-Cache Poisoning |
| `@angular/common` | HIGH | **runtime** | DoS via OOM in number formatting |
| `@angular/compiler` | MODERATE | runtime | (same advisory train) |
| `vite`, `ws`, `undici`, `tmp`, `piscina`, `hono`, `form-data`, `engine.io`, `socket.io-adapter`, `esbuild`, `tar`, `@babel/core` | HIGH / MODERATE | dev + transitive | closed by in-range bumps of `@angular/build` and `firebase-tools` |

Honest scoping on the two runtime HIGHs: this app is a client-only SPA with no SSR and no hydration, so real exposure to the `@angular/core` hydration advisory was likely nil. That is an argument for rating the risk low — **not** for the previous audit's claim that runtime code was unaffected. The patch was free; there was no reason to carry the finding.

#### MODERATE findings (residual, consciously deferred)

All five are confined to the `firebase-tools` deploy CLI, a devDependency invoked only from a developer machine at deploy time. None reach the browser bundle.

- **`firebase-tools`** `>=13.14.0` — direct devDependency, surfaces the chain below.
- **`gaxios`** `6.4.0 – 6.7.1` — transitive carrier.
- **`uuid`** `<11.1.1` — [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq): missing buffer bounds check in v3/v5/v6 when `buf` is provided.
- **`@google-cloud/pubsub`** `>=5.1.0`, **`@opentelemetry/core`** `<2.8.0` — transitive.

`npm audit fix --force` would downgrade `firebase-tools` 15.23.0 → 14.23.0 (`isSemVerMajor: true`), a major step back for the tool that owns the deploy story. Residual accepted. Revisit when `firebase-tools` ships a patched `gaxios`/`uuid` in the 15.x or 16.x line.

### Outdated Dependencies

```
Angular set: aligned at 20.3.26 (core, common, compiler, forms, animations,
             platform-browser, platform-browser-dynamic, router)
Angular CLI / build: 20.3.32
```

Direct packages a major or more behind:

- **`@angular/*` core set**: `20.3.26` → `21.2.18` (1 major). Moves as one unit with the CLI. See Recommended Fix 1.
- **`@angular/cdk` / `@angular/material` / `material-moment-adapter`**: `20.2.14` → `22.0.4` (2 majors). Material trails its own release train here; couple the bump to the Angular major.
- **`jasmine-core`** `4.5.0` → `6.2.0`, **`@types/jasmine`** `4.3.6` → `6.0.0` (2 majors). The `~4.5.0` pin holds a 2022-era line.
- **`eslint`** `9.39.4` → `10.0.1`, **`@eslint/js`** aligned. Bump as one unit.
- **`angular-eslint`** `20.7.0` → `22.0.0`. Tracks the Angular major.
- **`@ngx-translate/core` / `http-loader`**: `17.0.0` → `18.0.0` (1 major).
- **`typescript`** `5.8.x` → `6.x`. Gated on Angular 21; do not bump alone.

## Lint

```
Command: npm run lint
Status: clean (exit 0)
```

**A regression slipped in between the two audits and nobody noticed for over a month.** The 2026-06-02 audit left `ng lint` clean. On 2026-07-10 it failed with 9 errors in `src/app/year-report/year-report.component.ts` (4× `prefer-const`, 4× `no-inferrable-types`, 1 dead `Validators` import), introduced by later `dev` commits. They were cleared in a dedicated change (the file is under the PDF-fidelity guardrail, so the fix carried a before/after PDF comparison).

This is the clearest possible argument for Recommended Fix 2. The gap that let a lint regression live for a month is not a missing rule — the rule was configured and passing. It is the absence of anything that *runs* the rule between commits.

## Test Suite

```
Test runner: Karma + Jasmine
Spec files: 5
Execution: 5 of 5 pass (npx ng test --watch=false --browsers=ChromeHeadless)
Runtime: under 5 seconds
```

```
Configuration: angular.json (Angular CLI defaults — no karma.conf.js at root)
Framework: jasmine-core ~4.5.0, karma ~6.4.0
Test helper: src/app/shared/testing/translate-testing.ts (shared TranslateModule.forRoot() import)
```

Specs cover four shared form components (`date`, `form-wrapper`, `input-text`, `select`) and `teddy-eddie-form`. The four report components — where the `pdfmake` document builders live and where the project's only hard guardrail applies — have **no specs at all**. PDF fidelity is currently protected by manual visual comparison, nothing else. See Recommended Fix 3.

## Build

```
Command: npm run build
Status: succeeds (exit 0)
Output: dist/browser  (angular.json outputPath.base = "dist"; the builder appends "browser")
```

Warnings are pre-existing and expected: CommonJS/AMD bailout notices for `moment` (used by `app.config.ts`) and `pdfmake` (used by the report components). They are not failures.

## CI/CD

```
Provider: not detected
Configuration: not found (.github/workflows absent)
```

| Stage      | Local | In CI | Notes |
|------------|-------|-------|-------|
| Lint       | ✓ clean | ✗ | `npm run lint` |
| Test       | ✓ 5/5 | ✗ | `npx ng test --watch=false --browsers=ChromeHeadless` |
| Build      | ✓ passes | ✗ | `npm run build` |
| Type check | ✓ | ✗ | implicit in build/test; no standalone step |
| Security   | ✓ | ✗ | `npm audit`; no automated scan |

Every gate passes locally and none of them runs automatically. The lint regression documented above is what that costs.

**Note for whoever wires this up:** deploys ship from **`dev`**, not `master`. A workflow triggered on `master` would never fire on the branch that actually reaches production. See `context/deployment/deploy-plan.md`.

## Configuration

### High severity

(none — every high-severity configuration file is present)

### Medium severity

- **`AGENTS.md`** — missing. Tools following the AGENTS.md convention (Cursor, Codex, Aider) won't pick up the conventions documented in `src/CLAUDE.md`.

### Low severity

- **`.env.example` / `.env.template`** — not present, and not needed. The app uses no runtime environment variables: there is **no `src/environments/` directory**, and no Firebase client config is bundled (`@angular/fire` is not installed). Add only if the brownfield change introduces secrets to seed locally. Note that Firebase's web config is not a secret in any case — it ships in the SPA bundle, and Firestore security rules are what protect the data.

All other expected configuration is present: `.editorconfig`, `.prettierrc.json`, `.gitignore` (now covering `/.firebase`, the deploy cache), `eslint.config.js` (flat config, `angular-eslint` + `typescript-eslint`), `tsconfig.json` with `strict: true` plus four additional strictness flags and three Angular template-strictness flags, `firebase.json` + `.firebaserc` (Hosting wired at `dist/browser`), root `CLAUDE.md` redirecting to a substantial `src/CLAUDE.md`.

`src/CLAUDE.md` documents the PDF-fidelity guardrail, the **standalone-only** architecture, locale pinning, the UI library mix, the folder map, the test-stack pin, and the styling baseline. (The 2026-06-02 audit described a "hybrid NgModule/standalone model" — that was wrong then and is wrong now. `grep -rl "@NgModule" src/app` returns nothing; the app bootstraps via `bootstrapApplication` with providers in `app.config.ts`.)

## Stack Assessment Cross-Reference

```
Stack assessment: context/foundation/stack-assessment.md (2026-05-23, Angular 19)
Agent readiness (from stack-assess): ready-with-compensation
```

| Stack-Assess Gap | Health-Check Finding (2026-07-10) | Status |
|---|---|---|
| Gap 1 — No project-level instruction file | Root `CLAUDE.md` + comprehensive `src/CLAUDE.md` | Closed |
| Gap 2 — No linter wired up | `eslint.config.js` present; `npm run lint` clean | Closed |
| Gap 3 — No CI/CD pipeline | Still absent. A lint regression went unnoticed for a month as a direct result. | **Reinforced** |
| Gap 4 — Test runner on the deprecation path | Still Karma + Jasmine; `src/CLAUDE.md` pins the choice. Suite is green. | Open, low priority |
| Gap 5 — Firebase tooling installed but unconfigured | `firebase.json` + `.firebaserc` present; Hosting **live** at https://britannia-reports.web.app | Closed |
| (Beyond stack-assess) Prettier without `.prettierrc` | `.prettierrc.json` present | Closed |
| (Beyond stack-assess) Framework drift | Angular 19 → 20.3.26; app migrated to standalone-only | Updated |

## Recommended Fixes

### Completed during this audit (2026-07-10)

- **Cleared the lint regression.** 9 errors in `year-report.component.ts`, fixed in a dedicated change with a before/after PDF comparison because the file falls under the PDF guardrail. `npm run lint` exits 0.
- **Closed 19 of 24 advisories, including all 12 HIGH.** `npm audit fix` (no `--force`), then a scoped `npm update` to realign the Angular set at 20.3.26. `package.json` untouched. Verified afterwards: lint clean, 5/5 specs, build succeeds, PDF output unchanged on a preview channel.

### 1. Plan the Angular 20 → 21 major upgrade

**Severity**: low · **Effort**: significant

The codebase trails the release train by one major (21.2.18 current), and `@angular/cdk`/`material` by two (22.0.4). Not urgent, but the gap widens each cycle and agent training data drifts toward newer idioms. Open a dedicated branch, run `ng update @angular/core @angular/cli`, keep the Material/CDK bump in the same unit, and do not bundle it with feature work. The app is already standalone-only, so Angular 21's standalone-only schematics have nothing to convert.

### 2. Wire up CI — the highest-leverage fix on this list

**Severity**: medium · **Effort**: small (one workflow file)

This is no longer a hypothetical. A lint regression lived on `dev` for over a month because nothing ran `npm run lint` between commits. A workflow running `npm ci`, `npm run lint`, `npx ng test --watch=false --browsers=ChromeHeadless`, and `npm run build` on push and PR would have caught it on the commit that introduced it.

Trigger it on **`dev`** (the deploy branch) as well as `master`. Do not add a `firebase deploy` step until the deploy story is settled — see `context/deployment/deploy-plan.md`, which keeps promotion to `live` behind a human gate.

### 3. Add specs for the four report components

**Severity**: medium · **Effort**: moderate

The project's one hard guardrail — PDF fidelity across Cambridge, semester/trimester, Teddy Eddie, and year-end — has **zero automated coverage**. All five existing specs test shared form components. Every PDF regression check today is a human generating two PDFs and comparing them by eye, which is exactly the kind of check that gets skipped under time pressure.

A cheap first step: snapshot-test each report's `pdfmake` document definition object (the plain JS structure passed to `pdfMake.createPdf`) rather than the rendered PDF bytes. That catches structural regressions without a rendering harness, and it is what the guardrail actually cares about.

### 4. Bump jasmine-core / @types/jasmine off the 4.5 line

**Severity**: low · **Effort**: moderate

Jasmine 4.5 is from 2022. Karma is in upstream maintenance mode but Jasmine itself is active; 4 → 6 picks up modern matchers and typing improvements. Safe to defer.

### Deferred by design

- **`AGENTS.md`** — mirror `src/CLAUDE.md` so non-Claude agents pick up the same conventions.

## Summary

```
Health status: healthy
```

Dependency hygiene, configuration, documentation, lint, tests, and build are all in good shape as of 2026-07-10 — two of those only after fixes applied during this audit. All 12 HIGH advisories are closed, including the two that reached the browser bundle; the 5 residual MODERATE are confined to the deploy CLI and consciously deferred.

The two real gaps are structural rather than incidental. **There is no CI**, and the cost of that is now measured rather than theoretical: a lint regression survived a month on the deploy branch. And **the project's only hard guardrail has no automated test behind it** — PDF fidelity rests entirely on someone remembering to look.

A note on this document's predecessor, because the failure mode is worth naming. The 2026-06-02 audit contradicted itself: its headline announced a repaired test suite and a clean lint baseline while its own CI/CD table still read "currently failing" and "12 errors against current tree", and its cross-reference table still called the suite "broken". The fixes had been applied and the prose updated in two places out of five. It also asserted a `src/environments/` directory and a "hybrid NgModule/standalone model" that never existed. A health check that is not re-run is not a health check — it is a claim with a date on it. Re-run the commands before trusting any line above.
