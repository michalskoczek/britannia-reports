---
project: "Britannia Reports"
context_type: brownfield
created: 2026-05-23
updated: 2026-05-23
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: "change category"
      decision: "significant feature bundle — auth + student DB + templates + GDrive + admin panel shipped together"
    - topic: "insight"
      decision: "templates are the real lever — teachers reuse ~80% of phrasing across students/classes; repetitive typing is the bottleneck, not the PDF tool"
    - topic: "primary persona scope"
      decision: "teachers at one specific school (Britannia); director is secondary admin"
    - topic: "credential"
      decision: "Google sign-in — same consent flow as Google Drive save, lowest friction"
    - topic: "provisioning"
      decision: "director invites teachers by email; teacher self-completes signup"
    - topic: "roles"
      decision: "flat two-role model — teacher and director; no class-level access boundary in MVP"
    - topic: "MVP scope cuts"
      decision: "templates limited to trimester/semester only; no admin-invite UI (teachers seeded manually); GDrive save deferred to v2; admin-editable form fields deferred to v2; student CRUD stays in MVP"
    - topic: "delivery timeline"
      decision: "~3 weeks of after-hours work; soft-gate passes without acknowledgment"
    - topic: "FR-009-original dropped (classes-CRUD)"
      decision: "class collapses to a free-text field on student; no class entity, no class-CRUD UI; per-school class taxonomy deferred to v2"
    - topic: "FR-014-original dropped (template edit)"
      decision: "templates write-once in MVP; to change a template, delete + re-save; v2 can add edit if real demand emerges"
    - topic: "template-apply conflict policy (now FR-011)"
      decision: "apply overwrites all non-student template-controlled fields; confirm dialog if any of those fields are non-empty before applying"
    - topic: "picker / template interaction (now FR-013)"
      decision: "picker owns student fields, template owns boilerplate — disjoint field domains; usual flow picker-first then template but not enforced"
    - topic: "business-logic delta"
      decision: "infrastructure-only — no new domain rule; the app remains a structured form-to-PDF tool, with auth + persistence + template merge added around it"
    - topic: "preserved infrastructure"
      decision: "pdfmake pipeline; ngx-translate i18n mechanism; public-URL deployment surface (URL stays, becomes sign-in landing); no existing data to migrate (app had no backend persistence today)"
  frs_drafted: 18
  quality_check_status: accepted
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  delivery_weeks: 3
  hard_deadline: null
  after_hours_only: true
---

# Britannia Reports — Shape Notes

Brownfield change to an existing Angular web app. Goal: turn a stateless public PDF-form tool into a stateful multi-user product with accounts, a student database, reusable templates, Google Drive distribution, and director-side configuration of form content.

## Current System

**System purpose** — a web app that lets language-school teachers fill structured forms and download per-student end-of-period reports as PDF, replacing the prior workflow of writing each report by hand in MS Word.

**Key architecture** — Single-page Angular application served from a public URL. No backend persistence layer for app data (auth, students, templates) at present. PDF is produced client-side from form input.

**Tech stack** — Angular 19, Angular Material, ngx-translate (PL/EN i18n), Bootstrap, pdfmake (PDF generation), firebase-tools (deployment tooling already in dev dependencies). TypeScript throughout.

**Current user base** — Teachers at Britannia language school. Single-tenant. No accounts today: the app is accessible to anyone who has the link.

**Core functionality today**
- Four form types: end-of-trimester/semester, end-of-school-year, post-Cambridge-exam, Teddy Eddie format.
- Basic form validation (only what's required to render the PDF without console errors).
- Bilingual UI (Polish / English) via ngx-translate.
- One-shot PDF download per submitted form.

## Vision & Problem Statement

**The change.** Adding accounts (teacher login + director-as-admin), a student database (add/remove students, organize by class), reusable templates that pre-fill repeatable form content, optional Google Drive save alongside the existing PDF download, and an admin panel that lets the director modify form elements without a developer.

**Why now / the insight.** The current app removed the worst pain (no more typing reports in Word), but teachers still retype ~80% of the same phrasing across students and across classes. The bottleneck is no longer the PDF tool; it's the repetitive typing. Templates per-teacher are the real lever — they convert the tool into a workflow. The director-facing pieces (oversight via GDrive, configurable form fields) compound this by removing the developer from the loop for both distribution and content changes.

**Cost of the status quo today.** Teachers spend a significant chunk of every end-of-period window re-entering the same boilerplate. The director has no central view of completed reports — distribution happens out-of-band (email, shared folders set up ad-hoc). Any wording change to a form field requires a developer ticket and a redeploy.

## User & Persona

**Primary persona — Teacher at Britannia language school.**
- Generates per-student reports at the end of each trimester/semester/year, after Cambridge exams, and for Teddy Eddie format classes.
- Pain today: re-typing repeatable phrasing per student; no place to keep a roster of their own students; PDF is the only artifact they get out.
- After this change: logs in, picks a student from their roster (or creates one), applies a template, fills only the per-student delta, and downloads the PDF AND/OR saves it to Google Drive in one step.

**Secondary persona — School director (administrator).**
- Needs to oversee that reports are produced and accessible.
- Today: no central oversight; reports are scattered.
- After this change: has an admin account that can (a) access reports via Google Drive, (b) configure form elements (labels, options, defaults) without involving a developer.

## Access Control Changes

**Current model.** No auth. The app is served at a public URL; anyone with the link can open any form and produce a PDF. There are no user identities and no role separation.

**Planned change.** Two-role authenticated model.

- **Sign-in credential** — Google sign-in (OAuth). The same Google identity covers both login and Google Drive save consent, so a teacher who saves a report to Drive uses one consent flow, not two.
- **Provisioning** — Director invites teachers by email from the admin panel. Teacher receives an invite, signs in with the matching Google account, and the account is activated. No open self-signup; director gatekeeps access.
- **Roles** —
  - **Teacher** — creates reports, manages their own students and templates, saves PDFs locally and/or to their Google Drive.
  - **Director (admin)** — everything a teacher can do, plus: manage teachers (invite, deactivate), edit form elements (labels, options, defaults — see Phase 6), and access reports via Google Drive (shared via the director's Drive view, not a separate in-app gallery).
- **Out of scope for the access model in MVP** — class-level access boundaries (a teacher seeing only their own classes' students is a UX/scoping choice, not an enforced security boundary), additional read-only roles, multi-tenant separation across schools.

**Backward-compatibility note.** The current public URL becomes a sign-in page. Anyone with the old link who is not invited cannot use the app. This is a deliberate access regression for the unauthenticated path — preserving public access would defeat templates, per-teacher student rosters, and director oversight.

## Success Criteria

### Primary

- A teacher with a seeded Google account can complete the end-to-end MVP flow: sign in, add a student, create a trimester/semester template, open a new trimester/semester report, pick the student, apply the template, edit the per-student delta, and download a PDF — without developer involvement after the seed step.

### Secondary

- After the first end-of-period reporting cycle that uses templates, a teacher self-reports spending **less than 50% of the time** they previously spent on a typical trimester/semester report. (Self-reported measure, not instrumented.)

### Guardrails

- **PDF output fidelity preserved** — all four existing form types (trimester/semester, end-of-school-year, Cambridge, Teddy Eddie) continue to produce visually-equivalent PDFs to today. Templates layered onto trimester/semester must not subtly alter pdfmake output for fields the template did not touch.
- **Bilingual UI preserved** — Polish / English switching via ngx-translate continues to work across the four existing form types and is extended (with translations) to all new surfaces: sign-in, student management, template management.
- **Three non-templated form types unchanged** — end-of-school-year, Cambridge, and Teddy Eddie forms behave exactly as today (fields, validation, layout). They are only gated behind sign-in; their internal behavior is untouched.

## User Stories

### US-01: Teacher applies a template to a trimester/semester report

- **Given** a signed-in teacher with at least one trimester/semester template saved and at least one student in their roster
- **When** they start a new trimester/semester report, pick the student, and apply the template
- **Then** the form is pre-filled with the template's content for the boilerplate fields and the student's identifying info for the student fields, leaving only the per-student delta for the teacher to edit before generating the PDF

#### Acceptance Criteria
- Applying a template overwrites only template-controlled fields; manually-edited fields entered before template-apply are preserved (or the teacher is warned before overwrite).
- Empty template (saved with no fields filled) is allowed and applies as a no-op.
- The pre-filled form remains fully editable — the teacher can change any field after applying the template.
- Bilingual UI (PL/EN) switching works on the trimester/semester form after template apply.
- The generated PDF for a templated report is visually equivalent to a PDF for the same fields entered manually (guardrail).

## Scope of Change

The FRs below capture the change in detail. Each carries a `Change:` tag (`new` | `modified` | `preserved`) so `/10x-prd` can route them into the brownfield `## Scope of Change` section format. Each FR carries a `> Socrates:` blockquote recording the strongest counter-argument considered and how it was resolved.

### Authentication & Identity

- FR-001: Teacher can sign in with Google. Priority: must-have. Change: new
  > Socrates: No counter-argument; stands as written.
- FR-002: Director can sign in with Google. Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "Director has no MVP-specific capability worth gating; the only MVP-visible behavior is sign-in." Resolution: kept; the role infrastructure is scaffolded in MVP so v2 admin / GDrive features land without a role-system retrofit.
- FR-003: Developer can seed teacher Google account emails into the backend (no admin invite UI in MVP). Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "Every onboarding requires a developer; that's a dev-time tax for v1." Resolution: kept; MVP tax accepted as deliberate scope cut; admin invite UI is an explicit v2 follow-up.
- FR-004: Unauthenticated visitor is redirected to a sign-in page and cannot access any form. Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "No fallback if Google sign-in is down — today's public URL has zero auth dependency." Resolution: kept; the integrity gains from gating (per-teacher state, template scoping, director oversight) outweigh the new dependency on Google OAuth availability.

### Student management

- FR-005: Teacher can add a student with minimal info (name + a free-text class label). Priority: must-have. Change: new
  > Socrates: No counter-argument; stands as written. Note: "class" is a free-text field on student, not a separate entity — see the cut record at the bottom of this section.
- FR-006: Teacher can view a list of their own students. Priority: must-have. Change: new
  > Socrates: No counter-argument; stands as written.
- FR-007: Teacher can edit a student's info. Priority: must-have. Change: new
  > Socrates: No counter-argument; stands as written.
- FR-008: Teacher can delete a student. Priority: must-have. Change: new
  > Socrates: No counter-argument; stands as written.

### Templates (trimester/semester form only in MVP)

- FR-009: Teacher can save a filled-out trimester/semester form as a named template. Priority: must-have. Change: new
  > Socrates: No counter-argument; stands as written.
- FR-010: Teacher can list their own templates. Priority: must-have. Change: new
  > Socrates: No counter-argument; stands as written.
- FR-011: Teacher can apply a template to a new trimester/semester report; the form pre-fills from template content. Apply overwrites all non-student template-controlled fields; if any of those fields are non-empty before apply, the teacher is shown a confirm dialog ("Replace existing content from template?") before the overwrite. Student-identity fields (name, class) are NEVER touched by template apply — those come from the student picker (FR-013). Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "Apply-after-edit conflict policy is non-trivial and the wrong choice will frustrate users in week one." Resolution: revised; explicit conflict policy now baked into the FR — overwrite-with-confirm-if-non-empty, student fields out of template domain.
- FR-012: Teacher can delete a template. Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "Templates may have been used by historical reports — deletion loses provenance." Resolution: kept; no report history is stored (explicit non-goal: see `## Non-Goals` in Phase 6), so template deletion is provenance-safe.

### Report generation

- FR-013: Teacher can pick a student from their roster when starting a trimester/semester report; student-identity fields (name, free-text class) pre-fill from the picked student. The picker owns student-identity fields; templates (FR-011) own boilerplate fields — disjoint domains. Usual flow is picker-first then template, but the order is not enforced. Priority: must-have. Change: new
  > Socrates: Counter-argument considered: "Picker overlaps with template-apply — two pre-fill mechanisms hitting the same form risk order-dependent confusion." Resolution: revised; explicit disjoint-domain rule now baked into the FR — picker → student fields, template → boilerplate, no field overlap.
- FR-014: Teacher can fill a trimester/semester report and download it as PDF. Priority: must-have. Change: modified
  > Socrates: No counter-argument; stands as written. Modified tag covers: now sign-in-gated, with optional student picker (FR-013) and optional template apply (FR-011) layered on top of the existing form-fill-then-PDF path.
- FR-015: Teacher can fill an end-of-school-year report and download it as PDF. Priority: must-have. Change: preserved
  > Socrates: No counter-argument; preservation as defensive FR is correct. The form's fields, validation, and PDF output are untouched; the only delta is sign-in gating.
- FR-016: Teacher can fill a Cambridge exam report and download it as PDF. Priority: must-have. Change: preserved
  > Socrates: No counter-argument; preservation as defensive FR is correct. Same delta as FR-015.
- FR-017: Teacher can fill a Teddy Eddie report and download it as PDF. Priority: must-have. Change: preserved
  > Socrates: No counter-argument; preservation as defensive FR is correct. Same delta as FR-015.

### Internationalization

- FR-018: User can switch UI language between Polish and English on every screen (existing + new). Priority: must-have. Change: preserved
  > Socrates: No counter-argument; stands as written. The "preserved" tag covers both: existing screens keep PL/EN; new screens (sign-in, students, templates) ship with PL/EN translations from day one — i18n is non-negotiable across all surfaces.

### FRs considered and cut during the Socrates round

These FRs were proposed during initial drafting and cut during the Socrates challenge. Recorded here so the decision context is preserved for future reference and so they are visibly NOT in MVP scope.

- **Original FR-009 — Teacher can create, rename, and delete classes as a separate entity** — DROPPED.
  > Counter-argument: "Classes as second-level CRUD = a parallel CRUD surface to students = too much for MVP." Resolution: class collapses to a free-text field on student (current FR-005); no class entity in the DB; no class-CRUD UI. Per-school class taxonomy (with shared canonical class names across teachers) can come in v2 if real demand emerges.
- **Original FR-014 — Teacher can edit an existing template** — DROPPED.
  > Counter-argument: "Save-as-template + delete + edit = three ways to manage one entity = over-complex for MVP." Resolution: templates are write-once in MVP. To change a template, the teacher deletes it and saves a new one. v2 can add in-place edit if real demand emerges.

## Business Logic Changes

**No domain logic change. This is an infrastructure/technical change with UX additions.**

The existing system is a structured-form-to-PDF tool that records the teacher's input and lays it out — it does not classify, score, recommend, prioritize, or otherwise decide anything about the user's data. This change preserves that property: the app remains a recorder/renderer with auth, persistence, and template-merge mechanics added around it.

Two mechanical (non-domain) rules introduced by this change are documented inside the FRs that own them, not as separate domain logic:

- **Template-apply field merge** (FR-011) — apply overwrites all non-student template-controlled fields; if any are non-empty, the teacher is prompted to confirm before overwrite. Student-identity fields are never touched by template apply.
- **Picker/template field-domain disjoint** (FR-013) — student-identity fields come from the student picker; boilerplate fields come from templates. The two never write to the same field.

These are interaction policies, not domain rules; they define the syntactic behavior of the pre-fill mechanism.

## Constraints & Compatibility

The change must respect the following pieces of the current system. These are preservation requirements for everything that is not explicitly modified in `## Scope of Change`.

### Preserved technical surfaces

- **PDF generation pipeline (pdfmake)** — same library, same code path for form-to-PDF rendering. The only acceptable change to the trimester/semester form's PDF code path is whatever is required by FR-014's `modified` tag (sign-in gating, optional template apply, optional student-picker prefill landing into existing form state). No swap to a different PDF library.
- **Internationalization mechanism (ngx-translate)** — translation infrastructure stays. New surfaces (sign-in, students, templates) add new translation keys to the existing ngx-translate setup. No new i18n library is introduced; no translation keys are removed or renamed for existing surfaces.
- **Deployment URL** — the change must not require moving the app to a different URL. Anyone with the current bookmarked URL must, after the change, land on the new sign-in screen at the same address.

### Visual-language convention (not formally preserved)

The current app uses Angular Material + Bootstrap as its visual-language stack. This was NOT explicitly locked as a preservation requirement, leaving room for the implementation to consolidate (e.g., move entirely to Material, or replace Bootstrap) if the team finds value in doing so during the change. See `## Open Questions` for the resolution path.

### Data migration

**None.** The existing system has no backend persistence — forms are filled and PDFs generated client-side per session, with no records retained between sessions. New persistence introduced by this change (users, students, templates) is greenfield-within-brownfield: there is no historical data to backfill or migrate.

### Backward compatibility for existing users

The four existing form types continue to produce visually-equivalent PDFs for the same form input. There is no API contract to preserve (the app is frontend-only today, with no documented external consumers).

The one deliberate regression: the unauthenticated public-URL access path is removed. See FR-004 and its Socrates resolution.

## Non-Functional Requirements

Each NFR is a property an outside observer can measure without inspecting the implementation. Mechanism and enforcement strategy are out of scope here — those are downstream choices.

- **Student data privacy** — a teacher cannot enumerate, read, or otherwise observe student records, templates, or report content belonging to another teacher. The director can observe all (consistent with the role design in `## Access Control Changes`). What "enumerate" rules out: no shared-by-default endpoints, no leaky list-pages, no IDs that can be incremented to walk other teachers' data.
- **PDF visual equivalence with the pre-change baseline** — a user comparing a PDF generated for a given form input before this change and a PDF generated for the same input after this change does not see meaningful visual differences in any of the four form types. "Meaningful" excludes purely metadata-level changes (e.g., generation timestamp, pdfmake version watermarks); it covers anything a reader of the report would notice.

## Non-Goals

Things this MVP explicitly does NOT do. Rationale on each so the line is preserved if the question comes back later.

### From the original idea-notes

- **No report history / no PDF archive in the system.** Reports are generate-and-go; the app does not store generated PDFs server-side or for later in-app retrieval. Rationale: keeps data footprint minimal, makes template-deletion provenance-safe (FR-012), and avoids a v2-sized retention/access-control surface.
- **No mobile or responsive layout.** Desktop browsers only. Rationale: teachers do this work at school computers or home desktops; a separate mobile UI doubles testing surface for marginal benefit.
- **No template sharing between teachers.** Templates are strictly per-teacher. Rationale: shared-template governance (who owns it, who edits it, version drift) is a v2-sized problem; the MVP unlock is per-teacher reuse, not cross-teacher reuse.
- **No PDF format alternatives.** PDF only — no DOCX export, no plain-text dump, no email-as-HTML. Rationale: a single-format pipeline keeps the pdfmake fidelity guardrail tractable and matches the existing system's only output format.

### From scope cuts during this shaping session

- **No GDrive save in MVP.** Deferred to v2. The end-of-MVP flow ends at PDF download; the teacher distributes manually. Rationale: cuts an entire OAuth scope expansion + Google Drive Files API integration from the 3-week MVP budget.
- **No admin-editable form fields in MVP.** Form labels, options, and field defaults stay developer-managed. The director's admin role exists but its only behavior in MVP is sign-in (and being the role anchor for v2 admin capabilities). Rationale: form-schema editing is itself a small CMS — out of scope for the 3-week MVP.
- **No multi-tenant / multiple schools.** Britannia school only. Rationale: locked as primary persona scope; multi-tenant is a different product.
- **No class entity / no class-CRUD UI.** Class is a free-text label on student. Rationale: Socrates round identified second-level CRUD as MVP-too-big; per-school canonical class taxonomy is a v2 item if real demand emerges.
- **No template editing.** Templates are write-once; to change one, delete and re-save. Rationale: Socrates round identified three management surfaces (save / edit / delete) for one entity as over-complex for MVP.
- **No templates for forms other than trimester/semester.** Year-end, Cambridge, and Teddy Eddie remain template-free. Rationale: cuts template UI work by ~75% and lets MVP prove the template concept on the most-used form type before generalizing.
- **No over-detailed student or teacher records.** Minimal personal data only (student: name + free-text class; teacher: Google identity + display name). Rationale: from the original idea-notes; aligns with GDPR-minor data minimization principle.

## Forward: tech-stack

Stack-shaped decisions that surfaced during shaping but are NOT part of the PRD. Captured here so the downstream `10x-stack-assess` step can pick them up. These are notes, not commitments.

- **OAuth provider** — Google sign-in is the chosen credential surface (FR-001, FR-002). The implementation needs an OAuth provider that can validate Google identity tokens; Firebase Auth is already implied by `firebase-tools` being in dev dependencies, but the choice between Firebase Auth, a hand-rolled OAuth verifier, or another auth provider (Auth0, Supabase Auth) is open.
- **Backend persistence** — the change requires a backend store for users, students, and templates. Today the app has none. Firebase (Firestore / Firebase Auth / Firebase Hosting) is the implied candidate given `firebase-tools` is already in the project, but the choice is not locked. Alternatives include any serverless DB, a small Node/Express + Postgres backend, or a Supabase / Pocketbase BaaS.
- **Visual-language consolidation** — the app currently uses Angular Material + Bootstrap. The MVP is allowed to consolidate (e.g., go Material-only) if doing so reduces cost. Not formally preserved (see `## Constraints & Compatibility`). Pick whichever stays cheapest; both are acceptable for the PDF-fidelity guardrail since pdfmake is independent of the UI library.

## Forward: technical-roadmap

v2 / post-MVP items deferred from this shaping session. Captured so the downstream planning step has a backlog to pick from.

- Admin invite UI (so director provisions teachers without a developer)
- GDrive save alongside PDF download
- Admin-editable form fields (form-schema CMS for the director)
- Template editing (in-place update of saved templates)
- Templates for the other three form types (year-end, Cambridge, Teddy Eddie)
- Per-school canonical class taxonomy (shared class names across teachers)

## Open Questions

Routed from this shaping session for resolution during PRD review, stack selection, or implementation planning.

1. **Visual-language consolidation (Material vs Bootstrap)** — current app uses both; this change is allowed to consolidate but is not required to. Owner: implementer. Resolution latest: at the start of implementation planning.
2. **GDPR / EU minor data baseline** — student data privacy is captured as an NFR but the specific GDPR safeguards (data export, data deletion on request, retention windows, consent flow language) were not pinned. Owner: user / school director. Resolution latest: before any non-Britannia user touches the system.
3. **Backend persistence platform** — no specific store is committed (see `## Forward: tech-stack`). Owner: implementer during stack-assess. Resolution latest: before FR-005 / FR-009 implementation begins.
4. **Direct cutover communication** — FR-004 removes public-URL access; the script for telling existing bookmarked-link users that they need to sign in is not specified. Owner: director. Resolution latest: at deploy time.

## Quality cross-check

Run on 2026-05-23. All six brownfield gate elements present; no gaps surfaced.

- Access Control: present (`## Access Control Changes`).
- Business Logic: present (`## Business Logic Changes` declares infrastructure-only — valid for brownfield).
- Project artifacts: present (this file, with full frontmatter checkpoint).
- Timeline-cost ack: present (delivery_weeks = 3 ≤ 3; no acknowledgment block required).
- Non-Goals: present (`## Non-Goals`, 11 entries).
- Preserved behavior: present (`## Constraints & Compatibility` names pdfmake, ngx-translate, deployment URL; `## Success Criteria > Guardrails` names four form types and PL/EN i18n).

Result: `quality_check_status: accepted`. No warnings to mirror into `/10x-prd`'s Open Questions.
