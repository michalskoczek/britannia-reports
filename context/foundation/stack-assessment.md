---
project: britannia-reports
assessed_at: 2026-05-23T00:00:00Z
agent_readiness: ready-with-compensation
context_type: brownfield
stack_components:
  language: TypeScript
  framework: Angular 19
  build_tool: Angular CLI
  test_runner: Jasmine + Karma
  package_manager: npm
  ci_provider: null
  deployment_target: null
gates_passed: 4
gates_failed: 0
---

# Stack Assessment — britannia-reports

This assessment evaluates the existing Angular 19 codebase against the four agent-friendly criteria and identifies what to add to instruction files before/during the brownfield change scoped in `context/foundation/prd.md`.

**Headline:** the stack itself passes all four quality gates. The friction is at the *project* level — no linter wired up, no CI/CD, no project-level CLAUDE.md / AGENTS.md. These don't downgrade the stack's score, but they limit how well the stack's friendliness translates to actual agent workflows. All three are addressable via the compensation entries in this document.

## Stack Components

**Language — TypeScript** (`tsconfig.json` at root).
The compiler is configured with `strict: true` plus four additional strictness flags (`noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`). Angular-specific compiler options layer on `strictTemplates: true`, `strictInjectionParameters: true`, and `strictInputAccessModifiers: true`. ES2022 target. Type discipline at the source level is strong.

**Framework — Angular 19** (`@angular/core ^19.2.1` in `package.json`).
NgModule-based application (the project predates standalone-components-only mode and uses `app.module.ts`). Routing via `@angular/router`. UI: `@angular/material ^19.2.2` + Bootstrap 5. i18n: `@ngx-translate/core ^15`. Forms via `@angular/forms`. Animations enabled. Feature folders per form type are visible under `src/app/` — `cambridge-report/`, `semestr-report/`, `teddy-eddie-report/`, `year-report/` — alongside `shared/`, `helper/`, `model/`, and `rating-scale/`.

**Build tool — Angular CLI** (`@angular-devkit/build-angular ^19.2.1`, `@angular/cli ~19.2.1`, `angular.json` at root).
The CLI is the canonical Angular build/scaffold tool. Available scripts: `ng serve` (dev server), `ng build` (production build), `ng build --watch --configuration development`, `ng test`.

**Test runner — Jasmine + Karma** (`jasmine-core ~4.5.0`, `karma ~6.4.0`, `karma-chrome-launcher`, `karma-coverage`, `karma-jasmine`, `karma-jasmine-html-reporter`).
Configured via Angular CLI defaults (no `karma.conf.js` at the project root). Spec files live next to their components: `app.component.spec.ts` is visible. Note: Karma is in maintenance mode upstream; Angular's modern guidance steers projects toward Jest, Web Test Runner, or Vitest. The setup as it exists is functional, but it's the historical default rather than the current recommendation.

**Package manager — npm** (`package-lock.json` at root). No `yarn.lock`, `pnpm-lock.yaml`, or `bun.lockb`.

**Formatter — Prettier 2.8.8** (in dev dependencies) without a `.prettierrc` at the project root. Prettier runs against its built-in defaults; there is no team-pinned style configuration.

**Linter — none configured.** No `.eslintrc*` or `eslint.config.*` at the project root. The standard Angular convention since version 12 is `ng add @angular-eslint/schematics`, but that package is not installed.

**CI/CD — not detected.** No `.github/workflows/`, no `.gitlab-ci.yml`, no `Jenkinsfile`. There is no automated check on pushes or pull requests today.

**Deployment — undetermined.** `firebase-tools 13.6.1` is in dev dependencies, but no `firebase.json` or `.firebaserc` exists at the project root. The tooling is installed but the configuration is absent — either deployed manually, configured elsewhere, or vestigial.

**Editorconfig — present** (`.editorconfig` at the project root).

**Project-level instruction files — none.** No `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`, or `.github/copilot-instructions.md` at the project root. The parent directory's `CLAUDE.md` describes the 10x toolkit chain, not this project's conventions.

## Quality Gate Assessment

| Component              | Typed | Convention | Training Data | Documented | Verdict |
|------------------------|-------|------------|---------------|------------|---------|
| Language (TypeScript)  |   ✓   |     —      |       —       |     —      |  pass   |
| Framework (Angular 19) |   —   |     ✓      |       ✓       |     ✓      |  pass   |
| Build tool (NG CLI)    |   —   |     ✓      |       ✓       |     ✓      |  pass   |
| Test runner (Karma+Jasmine) | — |   ✓      |       ✓       |     ~      | pass-with-note |

Legend: ✓ = pass, ✗ = fail, ~ = partial, — = not applicable

### Gate details

**Typed (Language: TypeScript).** Pass. `tsconfig.json:9` declares `"strict": true`; additional strictness flags on lines 10–13. Angular compiler options at lines 28–33 enforce `strictTemplates`, `strictInjectionParameters`, and `strictInputAccessModifiers`. An agent reading any file in `src/` can reason about input/output shapes from declared types alone, without running the program.

**Convention-based (Framework: Angular 19).** Pass. Angular's convention surface is one of the strongest in the JS ecosystem: NgModule registration, decorator-driven metadata, file naming pattern (`<feature>.component.{ts,html,scss,spec.ts}`), CLI scaffolding (`ng generate component`, `ng generate service`), `angular.json` workspace schema, and feature-folder layout. The project's `src/app/` follows this convention: each form type has its own folder; shared utilities live in `shared/`, `helper/`, and `model/`. An agent navigating the codebase can predict where new code goes.

**Popular in training data (Framework: Angular 19).** Pass. Angular is one of three mainstream JS web frameworks (React, Vue, Angular) — well-represented in LLM training corpora. Per-language-family caveat: within the JS family, Angular sits in the top tier alongside the others. Idioms (NgModule, dependency injection via constructor, observables via RxJS) are deeply represented.

**Well-documented (Framework: Angular 19).** Pass. Angular maintains versioned official documentation at angular.dev with per-version API reference, guides, and runnable examples. Version 19 is the current major; docs reflect current API.

**Convention-based (Build tool: Angular CLI).** Pass. `angular.json` is a strongly-typed workspace schema. Build configurations for `development` and `production` are conventionally located in `projects.<name>.architect.build.configurations`. The CLI's scaffolding commands enforce file-naming and folder-placement conventions automatically.

**Popular in training data (Build tool: Angular CLI).** Pass. Bundled with Angular itself; effectively the only mainstream Angular build tool.

**Well-documented (Build tool: Angular CLI).** Pass. Same official docs cover CLI commands per version.

**Convention-based (Test runner: Karma + Jasmine).** Pass. Karma + Jasmine has historically been the Angular default. Spec-file naming (`*.spec.ts` co-located with the file under test) is a strong convention. `ng test` runs the suite.

**Popular in training data (Test runner: Karma + Jasmine).** Pass within the JS family. Karma + Jasmine appears in many years of Angular tutorials, official samples, and Stack Overflow answers.

**Well-documented (Test runner: Karma + Jasmine).** Partial. Karma itself is in maintenance mode upstream (the project's own README announces deprecation). Angular's official guidance for new projects increasingly steers toward Jest or Web Test Runner. Docs for the existing setup remain accurate but the ecosystem is moving away. Score is `~` (pass with note) rather than ✗ — the setup is documented enough to support agent workflows today.

## Gaps & Compensation

The stack passes all four gates at the component level, but three project-level gaps will create unnecessary friction for the upcoming brownfield change. Each is addressable via the recommended instruction-file additions below.

### Gap 1 — No project-level instruction file

**What's missing.** No `CLAUDE.md` or `AGENTS.md` at the project root. The agent assisting on this change has no documented conventions to follow for: naming new feature folders, choosing between `@angular/material` and Bootstrap components, deciding where shared utilities live (`shared/` vs `helper/` is currently both — what's the difference?), or handling i18n strings.

**Why it matters for agent workflows.** Without an instruction file, the agent has to infer conventions from existing code each time, often inconsistently. The Angular framework's conventions cover the *shape* of files, but not the *project's specific choices* layered on top.

**Compensation.** Add a project-level `CLAUDE.md` (see Recommended Instruction File Additions below) covering: folder organization, shared-vs-helper distinction, i18n string conventions, component-vs-Bootstrap usage policy, and the PDF-fidelity guardrail constraint from the PRD.

### Gap 2 — No linter wired up

**What's missing.** No ESLint configuration at the project root. Angular's standard linting story is `ng add @angular-eslint/schematics`, but the package is not installed.

**Why it matters for agent workflows.** When the agent writes code, it has no automated way to detect violations of common rules (unused imports, accessibility violations in templates, RxJS subscription leaks, naming conventions). Each issue has to be caught by code review or by the developer running the dev server and noticing console warnings.

**Compensation.** Either (a) wire up `@angular-eslint/schematics` as a small task during the brownfield change so subsequent agent-authored code can be lint-checked, or (b) document in `CLAUDE.md` the specific rules the agent must self-enforce in lieu of automated linting (no `any` types except in clearly-bounded interop code, no template references to undefined properties, mandatory `OnDestroy` for components subscribing to observables). Option (a) is preferred; option (b) is the fallback.

### Gap 3 — No CI/CD pipeline

**What's missing.** No `.github/workflows/`, no other CI config. There is no automated check that runs on push or pull-request.

**Why it matters for agent workflows.** When the agent commits work, there is no third-party signal that the code builds, tests pass, or lint is clean. The developer has to remember to run `ng build` and `ng test` locally before merging. For a 3-week MVP touching auth, persistence, students, and templates, that's a friction point.

**Compensation.** Add a minimal GitHub Actions workflow (the project is on GitHub — `github.com/michalskoczek/britannia-reports` is visible via the recent-commits PR refs) that runs `ng build --configuration production` and `ng test --watch=false --browsers=ChromeHeadless` on push to `master` and on PRs. Even without lint, a build-and-test check catches the most common regressions. This is a one-file addition; see the recommended workflow stub below.

### Gap 4 — Test runner is on the deprecation path

**What's missing.** Nothing missing per se — Karma still works. But Angular's official guidance is steering away, and the agent's training data increasingly reflects Jest / Web Test Runner / Vitest patterns rather than fresh Karma examples.

**Why it matters for agent workflows.** Agent-written test code may default to patterns from newer ecosystems; the project's existing Karma config may not match. Minor friction, not blocking.

**Compensation.** Add a `CLAUDE.md` note pinning the project's test stack ("Tests use Jasmine API via Karma. Do not introduce Jest / Vitest patterns. Spec files live next to their components as `<name>.component.spec.ts`."). A migration to Web Test Runner or Jest is an explicit future-work item, not part of the current brownfield change (see PRD `## Non-Goals` for the v2 deferral pattern).

### Gap 5 — Firebase tooling installed but unconfigured

**What's missing.** `firebase-tools` is in `devDependencies`, but no `firebase.json` or `.firebaserc` is present at the project root. The agent assessing the deploy story sees a partial signal and cannot tell whether Firebase is the deploy target or a vestigial dep.

**Why it matters for agent workflows.** When the brownfield change adds backend persistence (FR-005, FR-009 in the PRD), the deploy and persistence platform choice will matter. The current state is ambiguous; the agent will either ask the developer (acceptable) or guess (not acceptable).

**Compensation.** This is partly resolved by PRD Open Question #3 (backend persistence platform). Add a `CLAUDE.md` note that explicitly documents the ambiguity ("`firebase-tools` is installed but not currently used for deployment in the workspace. Do not assume Firebase Hosting; ask the developer before adding `firebase.json` or invoking `firebase deploy`."). Resolution of the persistence-platform question downstream of `/10x-health-check` will pin this.

### Recommended Instruction File Additions

The following blocks are ready-to-paste content for a new `CLAUDE.md` at the project root. Add them under whatever overall structure the project prefers; the rule content itself is what matters.

```markdown
## Project conventions

### Folder organization

- `src/app/<feature>/` — feature folders per form type. Existing: `cambridge-report/`, `semestr-report/` (note: Polish spelling intentional), `teddy-eddie-report/`, `year-report/`. New features added during the brownfield change (e.g., `students/`, `templates/`, `auth/`) follow the same flat-feature-folder pattern.
- `src/app/shared/` — components, directives, pipes, and modules that ship reused UI surfaces (rating scales, dropdowns, common form controls).
- `src/app/helper/` — pure-TypeScript utility functions and stateless services. No Angular `@Injectable` decorators; no DOM dependencies.
- `src/app/model/` — TypeScript interfaces and types describing form payloads and entities. No runtime code.

### Component conventions

- Use NgModule registration for new features. The project predates Angular's standalone-components-only mode and consistency wins over partial migration in MVP.
- Component file naming: `<name>.component.{ts,html,scss,spec.ts}`. Co-locate spec files with components.
- For new UI surfaces (sign-in, student list, template list, template apply dialog), prefer Angular Material components over Bootstrap. The existing app uses both; Material is the forward direction (see PRD Open Question #1).
- Existing form types (trimester/semester, year-end, Cambridge, Teddy Eddie) retain their current UI library mix — do not refactor their visual stack during this brownfield change unless the PDF guardrail is at risk.

### Internationalization

- All user-facing strings on new surfaces (sign-in, student management, template management) MUST go through `ngx-translate`. Hardcoded English or Polish strings are a regression — the PRD's bilingual UI guardrail covers every new screen.
- Translation keys: namespace by feature (`auth.signin.button`, `students.list.empty`, `templates.apply.confirm`).
- Ship both Polish and English translations from day one — do not merge a feature with only one language wired up.

### State management

- Use `RxJS` observables and Angular services for cross-component state. Do not introduce NgRx, Akita, or other state-management libraries during this brownfield change — adding a state library is a v2 decision, not an MVP one.
- Component subscriptions must be cleaned up on `OnDestroy` (use `takeUntil`, `async` pipe, or `destroyRef` — pick one per file consistently).

### PDF fidelity (PRD guardrail)

- The four existing form types' PDF output (via `pdfmake`) must remain visually equivalent after this change. When adding sign-in gating or template-apply logic to the trimester/semester form, do not modify the `pdfmake` document definition or its inputs unless the change is explicitly required by FR-014.
- When in doubt, generate a PDF before and after your change with identical inputs and diff visually.

### Test stack pin

- Tests use the Jasmine assertion API via Karma. Do NOT introduce Jest, Vitest, or Web Test Runner patterns during this change. Spec files live next to their components as `<name>.component.spec.ts`.

### Build & deploy

- The project is built with Angular CLI: `ng build` (production), `ng serve` (dev). Do not introduce a new build tool.
- `firebase-tools` is installed in dev dependencies but Firebase Hosting is NOT currently configured (no `firebase.json` / `.firebaserc` at project root). Do not assume Firebase as the deploy target; ask before adding any deploy configuration.

### Linting (interim, until ESLint is wired up)

There is currently no automated linter. While that gap is open, self-enforce:

- No `any` types except in clearly-bounded interop code (e.g., third-party library shims). Prefer `unknown` + narrowing.
- All `Observable` subscriptions in components clean up on destroy.
- Template bindings refer only to properties declared on the component class — `noPropertyAccessFromIndexSignature` is enabled in `tsconfig.json:11`, so dynamic property access via `host['key']` is a compile error by design.
- Components and services follow Angular's `@Component` / `@Injectable` decorator metadata — no plain TypeScript classes acting as Angular constructs.
```

### Recommended CI workflow

If adding GitHub Actions during the brownfield change, the following minimal workflow file at `.github/workflows/ci.yml` covers build + test:

```yaml
name: CI
on:
  push:
    branches: [master, main]
  pull_request:

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx ng build --configuration production
      - run: npx ng test --watch=false --browsers=ChromeHeadless
```

This is a starting point, not a requirement of the PRD. If CI is added during the change, this is the minimum useful shape.

## Summary

**Overall readiness:** ready-with-compensation.

**Key strengths.**
- TypeScript with `strict: true` plus four additional strictness flags, including Angular's `strictTemplates`. The agent has strong type information at the source level.
- Angular 19's strong conventions cover folder layout, component structure, dependency injection, and CLI scaffolding. The agent has a known idiom set to follow.
- Mainstream framework in training data; well-documented per-version at angular.dev.
- Existing project structure already follows Angular conventions (feature folders per form type, shared/helper/model split, co-located specs).

**Key gaps to address before or during the brownfield change.**
1. **No project-level instruction file (`CLAUDE.md` / `AGENTS.md`).** Add one using the content blocks above. This is the single highest-leverage compensation.
2. **No linter.** Either install `@angular-eslint/schematics` as a small task during the change or self-enforce via the interim rules in the instruction file.
3. **No CI/CD pipeline.** A minimal GitHub Actions workflow (build + test) gives the agent third-party signal that committed work is safe.
4. **Test runner on the deprecation path.** Pin the Karma + Jasmine choice in the instruction file so agent-written tests don't default to newer ecosystems.
5. **Firebase tooling ambiguity.** Document the unconfigured state in the instruction file; the persistence-platform Open Question (PRD #3) will close this gap during `/10x-health-check`.

**Recommended next step.** Run `/10x-health-check` to audit dependency health, the test suite, and the resolved deploy story before the brownfield change kicks off in implementation.
