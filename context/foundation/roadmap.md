---
project: "Britannia Reports"
version: 1
status: draft
created: 2026-07-10
updated: 2026-07-29
prd_version: 1
main_goal: low-complexity
top_blocker: time
---

# Roadmap: Britannia Reports

> Derived from `context/foundation/prd.md` (v1) + auto-researched codebase baseline (2026-07-10).
> Supplementary inputs: `context/foundation/infrastructure.md`, `context/deployment/deploy-plan.md`, `context/foundation/stack-assessment.md`.
> Edit-in-place; archive when superseded.
> Items below are listed in dependency order. The "At a glance" table is the index.

## Vision recap

Britannia Reports is a live Angular SPA that lets language-school teachers fill a structured form and download a per-student report as PDF. It already removed the worst pain — nobody writes reports in MS Word anymore. But teachers still retype roughly 80% of the same phrasing across students and across classes, so the bottleneck moved from the PDF tool to the repetitive typing.

The change turns a stateless public tool into a stateful, signed-in product. The lever is **per-teacher templates**: a teacher invests once in writing the reusable phrasing for their cohort, and every subsequent report becomes only the per-student delta. Everything else this change introduces — Google sign-in, a student roster, a role scaffold for the director — exists to make templates possible, scoped, and safe. Two compounding capabilities (director oversight, admin-editable form content) are deliberately deferred so the MVP can prove the template lever inside a three-week after-hours budget.

## North star

**S-02: Teacher saves a trimester/semester report as a named template, applies it to a new report, and downloads the PDF** — this is the one slice whose success or failure decides whether the whole change was worth making.

> **North star**, here, means: the smallest flow that runs end-to-end — from the user's click to a finished PDF — and whose successful delivery would prove the product's central claim. That claim is the one sentence the PRD's Problem Statement stakes everything on: *"Templates per teacher are the real lever."* If a teacher can save phrasing once and re-apply it, the change pays for itself; if they can't, no amount of sign-in polish or roster management rescues it. So this slice is placed as early as its prerequisites allow, and everything else is sequenced around it.
>
> Note what the north star deliberately leaves out: picking a student from the roster (`FR-013`). The PRD itself rules that templates own the boilerplate fields and the student picker owns the student-identity fields, and that the two never write to the same field. Because those domains are disjoint, the template lever can be proven without a roster — which is exactly why the roster is a sibling slice rather than a prerequisite.

## At a glance

| ID   | Change ID                     | Outcome (user can …)                                                          | Prerequisites | PRD refs                                          | Status   |
| ---- | ----------------------------- | ----------------------------------------------------------------------------- | ------------- | ------------------------------------------------- | -------- |
| F-01 | `identity-and-data-platform`  | (foundation) an identity provider and a persistent store exist, and deny by default | —             | §Access Control Changes, FR-001, FR-002, OQ-3     | ready    |
| F-02 | `pdf-fidelity-baseline`       | (foundation) a repeatable before/after PDF comparison exists for all four report types | —             | §Success Criteria (Guardrails), FR-015, FR-016, FR-017 | ready    |
| S-05a | `report-design-language`     | (enabling) the visual language is extracted from the Teddy Eddie form into tokens, mixins, and shared patterns, and written down | F-01, F-02    | OQ-1                                              | merged (not deployed) |
| S-05b | `report-design-refresh`      | fill the semester, year-end, and Cambridge **forms** in that same visual language | S-05a         | OQ-1, FR-014, FR-015, FR-016, FR-017              | done (not deployed) |
| S-01 | `google-sign-in-gate`         | sign in with Google and reach the four existing report forms; unauthenticated visitors cannot | F-01, F-02    | FR-001, FR-002, FR-003, FR-004, FR-014, FR-015, FR-016, FR-017, FR-018 | done (not deployed) |
| S-02 | `trimester-report-templates`  | save a trimester/semester report as a named template, list, apply, and delete templates | S-01          | US-01, FR-009, FR-010, FR-011, FR-012, FR-014, FR-018 | proposed |
| S-03 | `student-roster`              | add, view, edit, and delete students on their own roster                       | S-01          | FR-005, FR-006, FR-007, FR-008, FR-018            | proposed |
| S-04 | `student-picker-in-report`    | pick a student from the roster when starting a trimester/semester report       | S-02, S-03    | US-01, FR-013, FR-014                             | proposed |

`OQ-N` refers to the numbered entries in the PRD's `## Open Questions`.

## Streams

Navigation aid — groups items that share a Prerequisites chain. Canonical ordering still lives in the dependency graph below; this table is the proposed reading order across parallel tracks.

| Stream | Theme                | Chain                        | Note                                                                                       |
| ------ | -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| A      | Access & storage     | `F-01` → `S-01`              | The gate everything else stands on. Nothing user-visible ships until `S-01` lands.          |
| B      | Regression barrier   | `F-02`                       | Joins Stream A at `S-01`; also guards `S-02`. Runs parallel with `F-01`.                    |
| C      | The template lever   | `S-02` → `S-04`              | Carries the north star. Under `main_goal: low-complexity` this chain gets priority on ties. |
| D      | Roster               | `S-03`                       | Parallel with `S-02`; joins Stream C at `S-04`.                                             |
| E      | Visual consistency   | `S-05a` → `S-05b`            | Runs first among slices. `S-05a` is the gate: once it merges, Stream A's `S-01` can run in parallel with `S-05b`. |

## Baseline

What's already in place in the codebase as of 2026-07-10 (auto-researched, user-confirmed).
Foundations below assume these are present and do NOT re-scaffold them.

- **Frontend:** present — Angular 20.3 standalone (`src/app/app.config.ts:25`), Angular Material 20 + Bootstrap 5, `ngx-translate@17` with PL/EN bundles under `src/assets/i18n/`. **Caveat: there is no router.** Navigation is `NgComponentOutlet` over a tab registry (`src/app/shared/static-data/tab-data.ts`); no `provideRouter`, no `Routes`, no guards anywhere. FR-004 asks for a redirect to a sign-in page, and today there is nothing to redirect into. Establishing that navigation surface is inside `S-01`, not a foundation — it is only needed the moment the first gated screen exists.
- **Backend / API:** absent — client-only SPA. `provideHttpClient()` (`app.config.ts:27`) serves the i18n loader, not a backend. No server, no serverless functions, no Cloud Functions directory.
- **Data:** absent — no `firebase` or `@angular/fire` dependency in `package.json`; no `firestore.rules`, no indexes file, no migrations. `firebase firestore:databases:list` returns `No databases found`.
- **Auth:** absent — no provider integration, no sign-in path, no session or token handling, no route-level guard.
- **Deploy / infra:** partial — Firebase Hosting is **live** at `https://britannia-reports.web.app`, deployed from the `dev` branch. `firebase.json` (public dir `dist/browser`, SPA rewrite) and `.firebaserc` (project `britannia-reports`) are on disk; `firebase-tools` 15.19.0 is a devDependency. No CI/CD — `.github/` does not exist.
- **Observability:** absent — no logging library, no error tracking, no analytics. The only diagnostic in the tree is `console.error(err)` at `src/main.ts:6`.

Two decisions already recorded upstream and treated as settled by this roadmap:

- `context/foundation/infrastructure.md` selects **Firebase (Hosting + Authentication + Firestore)** as the platform, and records **`eur3` (Europe multi-region)** as the Firestore location. This closes PRD Open Question #3 in substance, though the PRD text still lists it as open.
- `src/CLAUDE.md` already instructs "for new surfaces, prefer Material" — which resolves PRD Open Question #1 for everything this roadmap adds, without requiring a consolidation project.

## Foundations

### F-01: Identity and data platform

- **Outcome:** (foundation) a Google identity provider is enabled and a persistent store exists in the recorded region, wired into the app's global providers, with access rules that deny everything by default. No collections, no schemas, no queries — those arrive with the slices that need them.
- **Change ID:** `identity-and-data-platform`
- **PRD refs:** `## Access Control Changes`, FR-001, FR-002, Open Question #3
- **Unlocks:** `S-01` (sign-in gate has an identity provider to call and an allowlist to read), `S-02` and `S-03` (both need a store to persist into). Reduces PRD Open Question #3 from "no store committed" to "store exists and is locked to a region".
- **Prerequisites:** —
- **Parallel with:** F-02
- **Blockers:** —
- **Unknowns:** —
- **Risk:** The store's region is a **one-way door** — `infrastructure.md` records `eur3`, and changing it later means a new database plus a data migration, not a config edit. That irreversibility is the entire reason this is a foundation rather than the first step of `S-01`: it must be decided deliberately, once, before any slice writes a byte. Enabling the identity provider is a manual console step with no CLI equivalent, so it needs a human's hands before any agent can proceed. Scope discipline matters here: the temptation is to design the whole data model now. Resist it — every collection this MVP needs is introduced by the slice that first reads or writes it, and `S-01`, `S-02`, and `S-03` each still integrate this layer through real user capabilities.
- **Status:** ready

### F-02: PDF fidelity baseline

- **Outcome:** (foundation) a repeatable procedure exists for comparing a report's PDF before and after a change, with reference form inputs and reference PDFs captured for all four report types.
- **Change ID:** `pdf-fidelity-baseline`
- **PRD refs:** `## Success Criteria` → Guardrails ("PDF output fidelity preserved", "Three non-templated form types unchanged"), FR-015, FR-016, FR-017
- **Unlocks:** the verification path that `S-01` requires (gating touches all four forms) and that `S-02` requires (template apply writes into the trimester/semester form's state). Without it, the PRD's hardest guardrail is unfalsifiable — you cannot claim "visually equivalent" against nothing.
- **Prerequisites:** —
- **Parallel with:** F-01
- **Blockers:** —
- **Unknowns:** —
- **Risk:** Sequenced first because a regression barrier captured *after* the first change has already lost the thing it was supposed to protect. The scope trap is building a pixel-diff harness; under `main_goal: low-complexity` this is reference inputs plus committed reference PDFs and a written comparison procedure — `src/CLAUDE.md` already prescribes the manual before/after check, and this foundation just makes it reproducible rather than remembered.
- **Status:** ready

## Slices

> **S-05 was split into `S-05a` + `S-05b` on 2026-07-27.** The split exists to unblock parallelism: a conflict assessment of `S-05` against `S-01` found exactly one serious collision — the shared style tokens under `src/assets/styles/utils/`, which twelve component stylesheets already `@use`. `S-05` would reorganise them; `S-01` needs them to build its new sign-in surface. Landing the token/pattern layer as its own small change (`S-05a`) removes that collision, after which the bulk of the restyle (`S-05b`) and the sign-in gate touch disjoint files and can run at the same time.

### S-05a: Visual language extraction — **first slice to build**

- **Outcome:** (enabling) The visual language the Teddy Eddie form already embodies exists as a named, documented set of design tokens, mixins, and shared component patterns that any surface can `@use` — instead of living implicitly in one feature folder. No user-visible change.
- **Change ID:** `report-design-language`
- **PRD refs:** PRD Open Question #1 (visual-language consolidation, extended 2026-07-27)
- **Prerequisites:** F-01, F-02 — both `impl_reviewed` as of 2026-07-27, so this slice is unblocked today
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - The Teddy Eddie form is the reference design, but it was never written down as one — which parts are the intended language and which are incidental to that form is unrecorded. Deciding that boundary *is* this slice's work. — Owner: implementer. Block: no.
- **Risk:** This slice exists because of a contract, not a feature. `src/assets/styles/utils/` currently holds six flat colour variables and is `@use`d by twelve component stylesheets; `src/CLAUDE.md` already names Teddy Eddie the styling reference and the older three "not the reference". Extracting that into a stable, additive token set is what lets `S-05b` and `S-01` proceed without fighting over the same files. **The token names it publishes are a contract** — once `S-01` compiles against them, renaming one is a breaking change, so prefer additive extension afterwards. Keep it genuinely small: this is extraction and naming, not a design system. If it grows past the shared style layer and the shared form/UI components, it has absorbed `S-05b`'s work and the split has stopped paying for itself.
- **Outcome (2026-07-28):** delivered in three phases plus an epilogue (`675444a`, `b677cd4`, `f34ffd1`, `36c2c9b`) and merged into `10xdevs-m2l5`. The published contract is `src/assets/styles/utils/` (six token files behind `index.scss`) plus `src/assets/styles/patterns/` (composite mixins, forwarded through `mixins.scss` so existing `@use` paths keep resolving), documented in `docs/design-language.md`. The split paid off exactly as predicted: `S-01` and `S-05b` then ran concurrently and collided on only four files, all resolved mechanically at merge time on 2026-07-29.
- **Status:** merged into `10xdevs-m2l5`, not deployed

### S-05b: UI improvements — apply the language to the three forms

- **Outcome:** A teacher filling the semester, year-end, or Cambridge **form** sees the same visual language the Teddy Eddie form already uses — colours, component styling, table styling — instead of the older design those three forms still carry. The generated PDFs are visually identical to today's: this slice changes the forms used to produce PDFs, never the PDFs themselves.
- **Change ID:** `report-design-refresh`
- **PRD refs:** PRD Open Question #1 (visual-language consolidation, extended 2026-07-27); FR-014, FR-015, FR-016 (each names the `S-05` on-screen refresh as a licensed delta); FR-017 (the reference design — takes no delta)
- **Prerequisites:** S-05a
- **Parallel with:** S-01
- **Blockers:** —
- **Unknowns:**
  - Whether the three forms can adopt the shared form components without touching their component classes is unproven; the answer decides how close this slice gets to the form-model boundary below. — Owner: implementer. Block: no.
- **Risk:** The bulk of the work — 2,079 lines of template across the three forms, carrying Bootstrap grid markup with Material form fields dropped into it. **Sequenced early among slices deliberately:** every later slice adds surface to these same forms (`S-01` gates them, `S-02` writes templates into the trimester/semester form, `S-04` adds a picker to it), so restyling first means that surface is built once against the final visual language rather than rebuilt.
  The hard boundary is the PDF: FR-015–FR-017 were amended on 2026-07-27 to make "unchanged" an explicitly *visual* guardrail, and this slice is carved out of the **on-screen half only**. If the refresh appears to require pdfmake changes, that is a PRD question, not an implementation call.
  **The subtle hazard is `F-02`, and it does not announce itself.** The fidelity fixtures never drive the DOM — they call the component's own API (`form.patchValue` plus the array-building methods) — so template changes cannot break the check. But the fixtures *encode template facts in prose*: `semestr-report.fixture.ts` records that `class` holds a plain string because the template binds `[value]="classItem.value"`, and that all fourteen `FormArray`s stay empty because the template binds no `formArrayName`. Change either and the fixture describes a state the UI no longer produces — the reference PDF still matches, the check still passes, and it is now wrong. `F-02` stays as it is; keeping the form model and control names frozen is what makes that true.
- **Outcome (2026-07-29):** delivered in five phases plus an epilogue on `feature/report-design-refresh` (`e1e2433` → `5d44b8e`, review triage in `993eba7`), merged into `10xdevs-m2l5` on 2026-07-29. The Cambridge template went 1059 → 289 lines; all three forms now compose the shared wrappers with zero raw `mat-form-field` outside table cells. The "can the three forms adopt the shared components without touching their component classes" unknown resolved to **no** — see the deviation below. Form-model contract specs (`semestr-`, `year-`, `cambridge-report.component.spec.ts`) now freeze each report's control names and `FormArray`s, which is what makes "the restyle did not move a control" machine-checked.
- **Deviation carried forward (2026-07-29):** the two hand-rolled year-end tables were converted to `mat-table`, which the plan explicitly forbade, and that forced a **third** kind of edit into `year-report.component.ts` (~92 lines: column lists, a `detailRows` descriptor carrying form-control names, `getPathRowGroup`, `trackByIndex`). The plan's own stop-condition said the PDF-fidelity capture must run before such a phase merges. **It was not run**, by recorded triage decision — the records were corrected instead of the code. No `pdfmake` document-definition line changed and the smoke specs render every fixture, so nothing is known-broken, but the year-end PDF is the one report whose fidelity is now asserted rather than verified. See `## Open Roadmap Questions` #7.
- **Status:** done — archived 2026-07-29, **not deployed**

### S-01: Google sign-in gate

- **Outcome:** A teacher signs in with a Google account and reaches the four existing report forms; a visitor who is not signed in lands on a sign-in screen and cannot reach any form.
- **Change ID:** `google-sign-in-gate`
- **PRD refs:** FR-001, FR-002, FR-003, FR-004, FR-014 (sign-in gating portion), FR-015, FR-016, FR-017, FR-018
- **Prerequisites:** F-01, F-02 (hard); `S-05a` (soft — see below)
- **Parallel with:** S-05b, once `S-05a` has merged
- **Blockers:** —
- **Unknowns:** both resolved during implementation (2026-07-28).
  - ~~Navigation layer~~ → a minimal Angular Router: two routes (`/sign-in`, guarded shell), `@angular/router` was already an unused dependency. The tab registry stays the composition mechanism inside the shell; there is no route per report type.
  - ~~Shape of the FR-003 seed~~ → a Firestore collection `allowedUsers`, document id = the lowercased Google address, one `role` field (`teacher` | `director`), read-only to the account it names and writable by nobody. Keyed on email rather than UID because a UID does not exist before first sign-in, which would make advance seeding impossible. Procedure: `docs/teacher-allowlist-runbook.md`.
- **Parallelism with Stream E** (assessed 2026-07-27): the two slices work on different layers and can run concurrently. `S-01` works *above* the report components — `AppComponent` mounts them through `NgComponentOutlet` against `TabData.tabs`, so the gate can sit in the shell without editing a single report template. `S-05b` works *inside* three of those templates. `S-05a` is a soft prerequisite rather than a hard one: `S-01` builds a new sign-in surface that must `@use` the shared style tokens, and starting before `S-05a` publishes them means either a merge-time build break or a sign-in screen in the old visual language — the exact rework the Stream E ordering exists to avoid. Remaining contested files after `S-05a` lands, all minor: `src/assets/i18n/{en,pl}.json` (both slices append keys) and `src/app/shared/components/UI/header/` (`S-01` wants sign-out there). Coordinate those two; everything else is disjoint.
- **Risk:** This is the slice that carries the change's only deliberate regression — the public URL stops working for anyone not on file. It also touches all four report forms, which is precisely where the PDF fidelity guardrail bites, hence `F-02` as a prerequisite rather than an afterthought. Sequenced first among slices because both the north star and the roster need an identity to scope "their own" data against; there is no cheaper ordering. The three preserved form types (`FR-015`–`FR-017`) must come out of this slice behaviourally untouched — gating wraps them, it does not enter them. One cost the entry above understates: `src/CLAUDE.md` records that the first change adding a real collection must stand up the Firebase emulator suite and a rules-testing harness first. `FR-003`'s teacher allowlist is that collection, so this slice owns that work and is larger than it looks — which is also what makes the parallel window for `S-05b` comfortable.
- **Outcome (2026-07-28):** delivered in five phases on `feature/google-sign-in-gate` (`ca0458e`, `b29afa0`, `8f5940f`, `3efa55c`, + epilogue). **Two deliberate deviations, both carried forward:**
  - **The emulator suite and rules-testing harness were NOT built.** The slice shipped one conditional rule without them, on the argument that `allowedUsers` is read-only to every caller and holds no student data. That argument does not extend to `S-02` or `S-03`, which now inherit the work as a hard prerequisite. See `## Open Roadmap Questions` #5.
  - **Nothing was deployed.** No hosting deploy, not even a preview channel — the public-URL regression still waits on Open Roadmap Question #2. App Check enforcement was left off and is now unowned; attach it to that first deploy.
- **What it cost that the plan did not predict:** three defects reached a running browser through a fully green test suite — a broken SDK call (`setPersistence` with a value from `@angular/fire`'s wildcard re-export), a guard reading stale session state after sign-in, and a sign-out that never left the shell. All three lived in the seam between the app and Firebase, which is exactly the seam unit-test fakes replace. Treat "the suite is green" as saying nothing about the Firebase layer.
- **Merged (2026-07-29):** landed on `10xdevs-m2l5` after `S-05b`, as Stream E's ordering intended. The four contested files predicted above resolved exactly as predicted and mechanically: both i18n bundles (append-only, key parity re-verified at 267/267), `button.component.ts` (both slices added an identical `disabled` input; `S-05b`'s `variant` is the superset), and `docs/design-language.md` (three sections where each slice retired the other's "no consumer" markers). Combined gates on the merge commit: lint clean, **50/50** specs, both production and development builds type-check, five pre-existing SCSS budget warnings and no new ones.
- **Status:** done — archived 2026-07-29, **not deployed**

### S-02: Trimester/semester report templates — **north star**

- **Outcome:** A teacher saves a filled-out trimester/semester report as a named template, sees a list of their own templates, applies one to a new report (with a confirmation prompt before overwriting non-empty fields), deletes templates they no longer want, and downloads the resulting PDF.
- **Change ID:** `trimester-report-templates`
- **PRD refs:** US-01, FR-009, FR-010, FR-011, FR-012, FR-014, FR-018
- **Prerequisites:** S-01
- **Parallel with:** S-03
- **Blockers:** —
- **Unknowns:**
  - An empty template must apply as a no-op (US-01 acceptance criteria), but "empty" is undefined for fields that carry defaults rather than blanks. — Owner: implementer. Block: no.
- **Risk:** The load-bearing risk is the template-apply merge policy in FR-011, and the PRD's own Socratic round flagged it: *"the wrong choice will frustrate users in week one."* Apply overwrites every template-controlled field, prompts before clobbering non-empty ones, and never touches the student-identity fields. Getting the field-domain boundary wrong here quietly breaks `S-04` later, when the student picker starts writing to the other half of the same form. Delete is folded in rather than split off because the PRD's Non-Goals already removed template editing — save, list, apply, delete is the entire surface, and splitting it would leave a one-FR leftover slice. Sequenced immediately after `S-01` because it is the north star and nothing but identity blocks it.
- **Status:** proposed

### S-03: Student roster

- **Outcome:** A teacher adds a student with a name and a free-text class label, views a list of their own students, edits a student's information, and deletes a student.
- **Change ID:** `student-roster`
- **PRD refs:** FR-005, FR-006, FR-007, FR-008, FR-018
- **Prerequisites:** S-01
- **Parallel with:** S-02
- **Blockers:** —
- **Unknowns:**
  - PRD Open Question #2 — the GDPR baseline for minors' data (export on request, deletion on request, retention windows, consent language) was never pinned. This slice is the first time student data is persisted anywhere. — Owner: school director. Block: no. *Rationale for `no`:* the PRD scopes resolution to "before any non-Britannia user touches the system", and Britannia is the only tenant in MVP; FR-008 (delete a student) covers the deletion path in the meantime. This does not make the question go away — see `## Open Roadmap Questions`.
- **Risk:** The cheapest slice in the roadmap and the one most likely to grow. The PRD's Non-Goals cut a class entity down to a free-text label and cut student records down to a name — both cuts exist because the shaping session identified second-level CRUD as MVP-too-big. Sequenced parallel with the north star, not before it: under `main_goal: low-complexity`, a roster with nobody to write reports for proves nothing, and if the schedule runs out, `S-02` shipping without `S-03` is a coherent product while the reverse is not.
- **Status:** proposed

### S-04: Student picker in the trimester/semester report

- **Outcome:** A teacher picks a student from their roster when starting a trimester/semester report, and the student-identity fields pre-fill from the picked student — completing the full flow described in US-01 and in the PRD's primary success criterion.
- **Change ID:** `student-picker-in-report`
- **PRD refs:** US-01, FR-013, FR-014
- **Prerequisites:** S-02, S-03
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:** —
- **Risk:** This is where the two pre-fill mechanisms meet, and the PRD's Socratic round called it out: two mechanisms writing into one form risk order-dependent confusion. The resolution baked into FR-013 is a disjoint-domain rule — the picker owns student-identity fields, the template owns boilerplate, neither writes the other's — and it must hold regardless of whether the teacher picks the student first or applies the template first, because the PRD explicitly declines to enforce an order. Sequenced last because it is the only slice that requires both the roster and the templates to exist, and because it is the smallest of the four: by the time it runs, the field-domain boundary was already drawn in `S-02`.
- **Status:** proposed

## Backlog Handoff

| Roadmap ID | Change ID                    | Suggested issue title                                                | Ready for `/10x-plan` | Notes                                                          |
| ---------- | ---------------------------- | -------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------- |
| F-01       | `identity-and-data-platform` | Enable Google auth provider and create the Firestore store in `eur3`  | yes                   | Run `/10x-plan identity-and-data-platform`. One-way region choice. |
| F-02       | `pdf-fidelity-baseline`      | Capture reference PDFs and a before/after comparison procedure        | yes                   | Parallel with F-01. Run `/10x-plan pdf-fidelity-baseline`.     |
| S-05a      | `report-design-language`     | Extract the Teddy Eddie visual language into shared tokens, mixins, and patterns | done          | Merged 2026-07-28. Token and pattern names are now a contract — extend additively, do not rename. |
| S-05b      | `report-design-refresh`      | Align the semester, year-end, and Cambridge forms with the Teddy Eddie design | done                  | Merged 2026-07-29, **not deployed**. Year-end PDF fidelity asserted but not captured — Open Roadmap Question #7. |
| S-01       | `google-sign-in-gate`        | Gate the four report forms behind Google sign-in                      | done                  | Merged 2026-07-29, **not deployed**. Emulator harness deferred to S-02/S-03. |
| S-02       | `trimester-report-templates` | Save, list, apply, and delete trimester/semester templates            | yes                   | North star. S-01 landed. **Inherits the emulator suite + rules-testing harness as a hard prerequisite — build it before the first per-teacher rule.** Ownership keys on `request.auth.uid`, not the email the allowlist uses. |
| S-03       | `student-roster`             | Teacher-scoped student roster with add / view / edit / delete         | yes                   | S-01 landed. Parallel with S-02. Same inherited harness prerequisite, and the first slice to persist minors' data — see Open Roadmap Question #1. |
| S-04       | `student-picker-in-report`   | Pre-fill student-identity fields from the roster in the report form   | no                    | Needs S-02 and S-03.                                            |

## Open Roadmap Questions

1. **GDPR baseline for minors' data.** Student records — names of children — become persistent for the first time in `S-03`. Export on request, deletion on request, retention windows, and consent-flow language were never pinned. Owner: school director. Block: nothing in MVP (Britannia is the only tenant, and FR-008 provides a deletion path), but it gates any use beyond Britannia. Carried verbatim from PRD Open Question #2.
2. **Cutover communication to bookmarked-link users.** FR-004 removes public-URL access; the message telling existing visitors that they now need a seeded account does not exist. Owner: school director. Block: nothing before deploy; gates the deploy of `S-01`. Carried from PRD Open Question #4.
3. **Backend persistence platform (PRD Open Question #3) — effectively resolved, PRD not yet updated.** `infrastructure.md` selects Firebase and records `eur3` as the Firestore location. The PRD still lists this as open. Owner: implementer. Block: nothing — `F-01` proceeds on the `infrastructure.md` decision. Worth closing in the PRD so the two documents stop disagreeing.
4. **Visual-language consolidation (PRD Open Question #1) — now owned by `S-05a` + `S-05b`.** `src/CLAUDE.md` directs new surfaces to Angular Material, which covers new work. What it does not cover is the drift found during `F-01`/`F-02`: the semester, year-end, and Cambridge *forms* still carry an older design while the Teddy Eddie form carries the newest. `S-05a` names and extracts that language, `S-05b` applies it; generated PDFs are out of scope for both. Owner: implementer. Block: none.
5. **Firestore rules have no automated test, and the next slice inherits that.** `S-01` shipped the project's first conditional rule (`allowedUsers`) without the emulator suite or `@firebase/rules-unit-testing`, deliberately: that rule is read-only to every caller and holds no student data, so the cross-teacher leak in the pre-mortem has no surface in it. `S-02` and `S-03` store per-teacher data whose correctness *is* a field-name comparison in a rule, so the argument stops applying there. Owner: implementer. Block: **yes for `S-02`/`S-03`** — before their first per-teacher rule, not after. Setup cost (a JDK is still missing on the dev machine, plus a second Node-based test runner alongside Karma) is itemised in `infrastructure.md` → Getting Started step 4. Added 2026-07-28.
6. **App Check enforcement is unowned.** Registered in monitoring mode since F-01; `S-01` was expected to enable it and deliberately did not, since enforcement requires a deployed client and this slice deploys nothing. Owner: whoever runs the first hosting deploy of the gate. Block: nothing today — it protects nothing either. Added 2026-07-28.
7. **The year-end report's PDF fidelity is asserted, not verified.** `S-05b` converted its two hand-rolled tables to `mat-table` and put ~92 lines of table-descriptor code into `year-report.component.ts`, past the boundary its own plan set as the trigger for running the `F-02` capture — and the capture was skipped by recorded triage decision. Every other report either kept its component class untouched or has a captured reference. Owner: implementer. Block: **nothing today** (no `pdfmake` line changed, smoke specs render every fixture), but the next change touching `year-report.component.ts` should run `npm run test:capture` against `49f9fd9` first, so it inherits a real baseline instead of this argument. Also: `F-02`'s fixtures encode template facts in prose, and `S-05b` changed those templates — re-read `year-report.fixture.ts` before trusting it. Added 2026-07-29.

## Parked

- **Report history / PDF archive in the app.** Why parked: PRD §Non-Goals — keeps the data footprint minimal and makes template deletion (FR-012) provenance-safe.
- **Mobile or responsive layout.** Why parked: PRD §Non-Goals — teachers work at desktops; a mobile UI doubles the testing surface.
- **Template sharing between teachers.** Why parked: PRD §Non-Goals — shared-template governance is a v2-sized problem.
- **PDF format alternatives (Word, HTML, plain text).** Why parked: PRD §Non-Goals — a single-format pipeline keeps the fidelity guardrail tractable.
- **Google Drive save alongside PDF download.** Why parked: PRD §Non-Goals — an entire additional integration inside a three-week budget.
- **Admin-editable form fields.** Why parked: PRD §Non-Goals — form-schema editing is a small CMS.
- **Multi-tenant / multiple schools.** Why parked: PRD §Non-Goals — a different product.
- **Class entity and class-CRUD UI.** Why parked: PRD §Non-Goals — class stays a free-text label on a student (FR-005).
- **Template editing.** Why parked: PRD §Non-Goals — templates are write-once; delete and re-save.
- **Templates for year-end, Cambridge, and Teddy Eddie forms.** Why parked: PRD §Non-Goals — prove the template concept on the most-used form type first.
- **Admin invite UI (director provisions teachers without a developer).** Why parked: PRD §Non-Goals / FR-003 — the developer-seed tax is an accepted MVP scope cut.
- **Per-school canonical class taxonomy.** Why parked: `shape-notes.md` §Forward: technical-roadmap — v2 if real demand emerges.
- **CI/CD pipeline.** Why parked: identified as Gap 3 in `stack-assessment.md` and still open, but not implied by any PRD requirement. Under `main_goal: low-complexity` it is real work that ships nothing to a teacher. Reconsider the moment a second contributor touches the repo.
- **Observability (logging, error tracking, analytics).** Why parked: absent in baseline and not implied by any PRD requirement. The PRD's secondary success criterion is explicitly self-reported, not instrumented.

## Done

- **S-05b: A teacher filling the semester, year-end, or Cambridge form sees the same visual language the Teddy Eddie form already uses — colours, component styling, table styling — instead of the older design those three forms still carry. The generated PDFs are visually identical to today's.** — Archived 2026-07-29 → `context/archive/2026-07-28-report-design-refresh/`. Lesson: a plan's own stop-condition is only a guardrail if the phase that trips it stops — the year-end `mat-table` conversion tripped one and merged anyway (Open Roadmap Question #7).
- **S-01: A teacher signs in with a Google account and reaches the four existing report forms; a visitor who is not signed in lands on a sign-in screen and cannot reach any form.** — Archived 2026-07-29 → `context/archive/2026-07-28-google-sign-in-gate/`. Lesson: a green unit suite says nothing about the Firebase seam — three defects reached a running browser through it.
