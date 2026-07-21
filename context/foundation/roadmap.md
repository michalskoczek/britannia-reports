---
project: "Britannia Reports"
version: 1
status: draft
created: 2026-07-10
updated: 2026-07-10
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
| S-01 | `google-sign-in-gate`         | sign in with Google and reach the four existing report forms; unauthenticated visitors cannot | F-01, F-02    | FR-001, FR-002, FR-003, FR-004, FR-014, FR-015, FR-016, FR-017, FR-018 | proposed |
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

### S-01: Google sign-in gate

- **Outcome:** A teacher signs in with a Google account and reaches the four existing report forms; a visitor who is not signed in lands on a sign-in screen and cannot reach any form.
- **Change ID:** `google-sign-in-gate`
- **PRD refs:** FR-001, FR-002, FR-003, FR-004, FR-014 (sign-in gating portion), FR-015, FR-016, FR-017, FR-018
- **Prerequisites:** F-01, F-02
- **Parallel with:** —
- **Blockers:** —
- **Unknowns:**
  - The app has no navigation layer at all — the sign-in gate needs either a real navigation surface or a shell-level conditional above the tab registry. Which one is cheaper here is not something the PRD can answer. — Owner: implementer. Block: no.
  - FR-003 says the developer seeds teacher Google identifiers into the backing store, but the shape of that seed (a document per teacher? a static allowlist? who runs it?) is unspecified. — Owner: implementer. Block: no.
- **Risk:** This is the slice that carries the change's only deliberate regression — the public URL stops working for anyone not on file. It also touches all four report forms, which is precisely where the PDF fidelity guardrail bites, hence `F-02` as a prerequisite rather than an afterthought. Sequenced first among slices because both the north star and the roster need an identity to scope "their own" data against; there is no cheaper ordering. The three preserved form types (`FR-015`–`FR-017`) must come out of this slice behaviourally untouched — gating wraps them, it does not enter them.
- **Status:** proposed

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
| S-01       | `google-sign-in-gate`        | Gate the four report forms behind Google sign-in                      | no                    | Needs F-01 and F-02.                                            |
| S-02       | `trimester-report-templates` | Save, list, apply, and delete trimester/semester templates            | no                    | North star. Needs S-01.                                         |
| S-03       | `student-roster`             | Teacher-scoped student roster with add / view / edit / delete         | no                    | Needs S-01. Parallel with S-02.                                 |
| S-04       | `student-picker-in-report`   | Pre-fill student-identity fields from the roster in the report form   | no                    | Needs S-02 and S-03.                                            |

## Open Roadmap Questions

1. **GDPR baseline for minors' data.** Student records — names of children — become persistent for the first time in `S-03`. Export on request, deletion on request, retention windows, and consent-flow language were never pinned. Owner: school director. Block: nothing in MVP (Britannia is the only tenant, and FR-008 provides a deletion path), but it gates any use beyond Britannia. Carried verbatim from PRD Open Question #2.
2. **Cutover communication to bookmarked-link users.** FR-004 removes public-URL access; the message telling existing visitors that they now need a seeded account does not exist. Owner: school director. Block: nothing before deploy; gates the deploy of `S-01`. Carried from PRD Open Question #4.
3. **Backend persistence platform (PRD Open Question #3) — effectively resolved, PRD not yet updated.** `infrastructure.md` selects Firebase and records `eur3` as the Firestore location. The PRD still lists this as open. Owner: implementer. Block: nothing — `F-01` proceeds on the `infrastructure.md` decision. Worth closing in the PRD so the two documents stop disagreeing.
4. **Visual-language consolidation (PRD Open Question #1) — effectively resolved for new work.** `src/CLAUDE.md` already directs new surfaces to Angular Material and leaves existing report layouts alone. No consolidation project is needed for anything in this roadmap. Owner: implementer. Block: none.

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

(Empty on first generation. `/10x-archive` appends here when a change whose `Change ID` matches a roadmap item is archived.)
