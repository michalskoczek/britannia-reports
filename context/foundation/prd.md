---
project: "Britannia Reports"
version: 1
status: draft
created: 2026-05-23
context_type: brownfield
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

# Britannia Reports — PRD

Brownfield change to an existing Angular web app: turn a stateless public PDF-form tool into a stateful multi-user product with accounts, a student database, reusable templates limited to one form type, and a role-shaped admin scaffold. Sections below describe the delta against the current system, not the full system.

## Current System Overview

**System purpose.** A web app that lets language-school teachers fill structured forms and download per-student end-of-period reports as PDF, replacing the prior workflow of writing each report by hand in MS Word.

**Key architecture.** Single-page Angular application served from a public URL. No backend persistence layer for app data (auth, students, templates) at present. PDFs are produced client-side from form input; nothing is retained between sessions.

**Tech stack.** Angular 19, Angular Material, ngx-translate (Polish / English i18n), Bootstrap, pdfmake (PDF generation), TypeScript throughout. `firebase-tools` is present in dev dependencies as deployment tooling.

**Current user base.** Teachers at Britannia language school — a single-tenant deployment. There are no accounts today: the app is accessible to anyone who has the URL.

**Core functionality today.**
- Four form types: end-of-trimester/semester, end-of-school-year, post-Cambridge-exam, and Teddy Eddie format.
- Basic form validation — only what is required for the PDF to render without console errors.
- Bilingual UI (Polish / English) via ngx-translate, switchable on every screen.
- One-shot PDF download per submitted form — no archive, no in-app retrieval, no server-side retention.

## Problem Statement & Motivation

**The specific gap.** Teachers at Britannia generate per-student reports several times a year — at the end of each trimester / semester / school year, after Cambridge exams, and for Teddy Eddie classes. The existing app removed the worst pain (no more writing reports in MS Word), but teachers still retype approximately 80% of the same phrasing across students and across classes. The bottleneck is no longer the PDF tool — it is the repetitive typing.

**Why now / the insight.** Templates per teacher are the real lever. They convert the tool from a one-shot form into a workflow: a teacher invests once in writing the reusable phrasing for their cohort, then each subsequent report consists only of the per-student delta. Two compounding pieces sit on top of templates — director-side oversight and configurable form content — that together remove the developer from the loop for both distribution and content changes; however, those are deliberately deferred (see `## Non-Goals`) so the MVP can prove the template lever in a tight delivery window.

**Current workaround and its cost.** Teachers re-enter boilerplate phrasing manually for every report; they can be a substantial fraction of every end-of-period reporting window. The director has no central view of completed reports — distribution today happens out-of-band (email, ad-hoc shared folders) and the director cannot see which reports have been produced. Any wording change to a form field requires a developer ticket and a redeploy, even when the change is purely cosmetic.

## User & Persona

**Primary persona — Teacher at Britannia language school.**

A teacher who generates per-student reports at the end of each reporting period. Existing user of the current system; their experience changes materially after this change. Before: anonymous, public URL, hand-fills the form, downloads a PDF, distributes manually. After: signs in with a Google account, picks a student from their own roster (or creates one), optionally applies a template that pre-fills the boilerplate, edits only the per-student delta, downloads the PDF.

**Secondary persona — School director (administrator).**

A new role introduced by this change. Before: not a user of the current app at all — oversight happens out-of-band. After: signs in with a Google account; the role infrastructure is scaffolded but the director's MVP-visible behavior is limited (see `## Access Control Changes` and `## Scope of Change`). The capabilities that would distinguish the director from a teacher in the day-to-day (admin invite UI, central report view, configurable form fields) are deferred — see `## Non-Goals`.

## Success Criteria

### Primary

- A teacher with a pre-seeded Google identity completes the end-to-end MVP flow without developer involvement after the one-time seed step: signs in, adds a student, creates a trimester/semester template, opens a new trimester/semester report, picks the student, applies the template, edits the per-student delta, and downloads the PDF.

### Secondary

- After the first end-of-period reporting cycle that uses templates, a teacher self-reports spending **less than 50% of the time** they previously spent on a typical trimester/semester report. This is a self-reported measure, not instrumented.

### Guardrails

- **PDF output fidelity preserved.** All four existing form types (trimester/semester, end-of-school-year, Cambridge, Teddy Eddie) continue to produce PDFs that a reader would consider visually equivalent to today's output. Templates layered onto the trimester/semester form must not subtly alter the rendered PDF for fields the template did not touch.
- **Bilingual UI preserved and extended.** Polish / English switching continues to work across the four existing form types and is extended (with translations shipped from day one) to every new surface: sign-in, student management, template management.
- **Three non-templated form types unchanged.** End-of-school-year, Cambridge, and Teddy Eddie forms behave exactly as today — fields, validation, layout, and PDF output. They are only gated behind sign-in; their internal behavior is untouched.

## User Stories

### US-01: Teacher applies a template to a trimester/semester report

- **Given** a signed-in teacher with at least one trimester/semester template saved and at least one student in their roster
- **When** they start a new trimester/semester report, pick the student from the roster, and apply the template
- **Then** the form is pre-filled with the template's content for the boilerplate fields and the student's identifying information for the student-identity fields, leaving only the per-student delta for the teacher to type before generating the PDF

**Before this change**, the same teacher would have opened the trimester/semester form on a public URL, typed every field including the boilerplate and student name from scratch, and downloaded the PDF. There was no roster, no template, and no account.

#### Acceptance Criteria

- Applying a template populates all template-controlled (boilerplate) fields. If any of those fields already contain content at the moment of apply, the teacher is shown a confirmation prompt before the overwrite.
- An empty template (saved with no fields filled) applies as a no-op.
- The pre-filled form remains fully editable — any field can be changed after the template is applied.
- The student picker populates student-identity fields (name, free-text class label). Template apply never writes to those fields; they are owned by the picker.
- Polish / English switching continues to function on the trimester/semester form after the template is applied.
- The generated PDF for a templated report is visually equivalent to a PDF produced by typing the same field values manually.

## Scope of Change

Each item below is tagged `[new]`, `[modified]`, `[preserved]`, or `[removed]`. FR-NNN identifiers are kept as load-bearing anchors so user stories, acceptance criteria, and downstream planning can refer to them precisely. Where the shaping session ran a Socratic challenge against an item, the resulting counter-argument and resolution are quoted underneath.

### Authentication & Identity

- [new] **FR-001** — Teacher can sign in with a Google identity. Priority: must-have.
  > Socrates: No counter-argument; stands as written.
- [new] **FR-002** — Director can sign in with a Google identity. Priority: must-have.
  > Socrates: Counter-argument considered: "Director has no MVP-specific capability worth gating; the only MVP-visible behavior is sign-in." Resolution: kept; the role infrastructure is scaffolded in MVP so v2 admin features land without a role-system retrofit.
- [new] **FR-003** — Developer seeds teacher Google account identifiers into the backing store; there is no in-app invite UI in MVP. Priority: must-have.
  > Socrates: Counter-argument considered: "Every onboarding requires a developer; that's a dev-time tax for v1." Resolution: kept; MVP tax accepted as a deliberate scope cut; admin invite UI is an explicit v2 follow-up.
- [new] **FR-004** — Unauthenticated visitor is redirected to a sign-in page and cannot reach any form. Priority: must-have.
  > Socrates: Counter-argument considered: "No fallback if the identity provider is down — today's public URL has zero auth dependency." Resolution: kept; the integrity gains from gating (per-teacher state, template scoping, director oversight) outweigh the new dependency on the identity provider's availability.

### Student management

- [new] **FR-005** — Teacher can add a student with minimal information: name and a free-text class label. Priority: must-have.
  > Socrates: No counter-argument; stands as written. "Class" is a free-text field on student, not a separate entity (see `## Non-Goals`).
- [new] **FR-006** — Teacher can view a list of their own students. Priority: must-have.
  > Socrates: No counter-argument; stands as written.
- [new] **FR-007** — Teacher can edit a student's information. Priority: must-have.
  > Socrates: No counter-argument; stands as written.
- [new] **FR-008** — Teacher can delete a student. Priority: must-have.
  > Socrates: No counter-argument; stands as written.

### Templates (trimester/semester form only in MVP)

- [new] **FR-009** — Teacher can save a filled-out trimester/semester form as a named template. Priority: must-have.
  > Socrates: No counter-argument; stands as written.
- [new] **FR-010** — Teacher can list their own templates. Priority: must-have.
  > Socrates: No counter-argument; stands as written.
- [new] **FR-011** — Teacher can apply a template to a new trimester/semester report; the form pre-fills from the template's content. Apply replaces all non-student template-controlled fields; if any of those fields are non-empty at the moment of apply, the teacher is shown a confirmation prompt ("Replace existing content from template?") before the overwrite. Student-identity fields (name, free-text class label) are never touched by template apply — those come from the student picker (FR-013). Priority: must-have.
  > Socrates: Counter-argument considered: "Apply-after-edit conflict policy is non-trivial and the wrong choice will frustrate users in week one." Resolution: revised; explicit conflict policy now baked into the FR — overwrite with confirmation when fields are non-empty, student-identity fields out of template domain.
- [new] **FR-012** — Teacher can delete a template. Priority: must-have.
  > Socrates: Counter-argument considered: "Templates may have been used by historical reports — deletion loses provenance." Resolution: kept; no report history is stored (see `## Non-Goals`), so template deletion is provenance-safe.

### Report generation

- [new] **FR-013** — Teacher can pick a student from their roster when starting a trimester/semester report; the student-identity fields (name, free-text class label) pre-fill from the picked student. The picker owns student-identity fields; templates (FR-011) own boilerplate fields — disjoint domains. Usual flow is picker-first then template, but the order is not enforced. Priority: must-have.
  > Socrates: Counter-argument considered: "Picker overlaps with template-apply — two pre-fill mechanisms hitting the same form risk order-dependent confusion." Resolution: revised; explicit disjoint-domain rule now baked into the FR — picker → student fields, template → boilerplate, no field overlap.
- [modified] **FR-014** — Teacher can fill a trimester/semester report and download it as PDF. Was: any visitor on the public URL could do this. Now: sign-in-gated, with an optional student picker (FR-013) and optional template apply (FR-011) layered on top of the existing form-fill-then-PDF path. Priority: must-have.
  > Socrates: No counter-argument; stands as written.
- [preserved] **FR-015** — Teacher can fill an end-of-school-year report and download it as PDF. The form's fields, validation, layout, and PDF output are untouched; the only delta is sign-in gating. Priority: must-have.
  > Socrates: No counter-argument; preservation as defensive FR is correct.
- [preserved] **FR-016** — Teacher can fill a Cambridge exam report and download it as PDF. Same delta as FR-015. Priority: must-have.
  > Socrates: No counter-argument; preservation as defensive FR is correct.
- [preserved] **FR-017** — Teacher can fill a Teddy Eddie report and download it as PDF. Same delta as FR-015. Priority: must-have.
  > Socrates: No counter-argument; preservation as defensive FR is correct.

### Internationalization

- [preserved] **FR-018** — Any user can switch the UI between Polish and English on every screen — existing and new. Existing screens keep their current Polish / English coverage; new screens (sign-in, student management, template management) ship with Polish / English translations from day one. Priority: must-have.
  > Socrates: No counter-argument; stands as written.

### Removed capabilities

- [removed] **Unauthenticated public-URL access.** Anyone with the current URL but no Google account on file with the application can no longer use the app. Rationale: required by FR-004 (sign-in gating); the regression is deliberate and is the only behavior the MVP removes from existing users. Communication to existing bookmarked-link users is unresolved — see `## Open Questions`.

## Constraints & Compatibility

The change must respect the following pieces of the current system. These are preservation requirements for anything not explicitly modified in `## Scope of Change`. This section names existing technical surfaces by their proper names, consistent with the brownfield schema's requirement to make preservation explicit.

### Preserved technical surfaces

- **PDF generation pipeline (pdfmake).** Same library, same code path for form-to-PDF rendering. The only acceptable change to the trimester/semester form's PDF code path is whatever is required by FR-014's `modified` tag — sign-in gating, optional template apply, and optional student-picker prefill landing into existing form state. The PDF library itself is not swapped.
- **Internationalization mechanism (ngx-translate).** Translation infrastructure stays. New surfaces add new translation keys to the existing ngx-translate setup. No alternative i18n library is introduced; no translation keys are removed or renamed for existing surfaces.
- **Deployment URL.** The change must not require moving the app to a different URL. Anyone with the current bookmarked URL must, after the change, land on the new sign-in screen at the same address.

### Visual-language convention (not formally preserved)

The current app uses Angular Material together with Bootstrap as its visual-language stack. This combination is NOT explicitly locked as a preservation requirement, leaving room for the implementation to consolidate (for example, move entirely to Material or replace Bootstrap) during the change if doing so reduces cost. See `## Open Questions` for the resolution path.

### Data migration

**None.** The existing system has no backend persistence — forms are filled and PDFs generated client-side per session, with no records retained between sessions. New persistence introduced by this change (users, students, templates) is greenfield-within-brownfield: there is no historical data to backfill or migrate, no rollback plan needed for prior data.

### Backward compatibility for existing users

The four existing form types continue to produce visually-equivalent PDFs for the same form inputs. There is no documented external consumer (no public API contract, no external integration) that this change must preserve.

The one deliberate regression is the removal of unauthenticated public-URL access, captured in `## Scope of Change` (Removed capabilities) and FR-004.

## Business Logic Changes

**No domain logic change. This is an infrastructure / technical change with UX additions.**

The existing system is a structured form-to-PDF tool that records the teacher's input and lays it out — it does not classify, score, recommend, prioritize, or otherwise decide anything about the user's data. This change preserves that property: the application remains a recorder and renderer, with sign-in, persistence, and template-merge mechanics added around it.

Two mechanical (non-domain) interaction policies introduced by this change are documented within the FRs that own them, not as separate domain logic:

- **Template-apply field merge** (FR-011) — applying a template overwrites all non-student template-controlled fields; if any of those fields are non-empty at the moment of apply, the teacher is prompted to confirm before the overwrite. Student-identity fields are never touched by template apply.
- **Picker / template field-domain disjoint** (FR-013) — student-identity fields are populated by the student picker; boilerplate fields are populated by the template. The two never write to the same field.

These are syntactic interaction policies for the pre-fill mechanism, not domain decisions about the user's data.

## Access Control Changes

**Current model.** No authentication. The app is served at a public URL; anyone with the URL can open any form and produce a PDF. There are no user identities, no role separation, and no enforced permission boundaries.

**Planned change.** A two-role authenticated model.

- **Credential.** Sign-in uses a Google identity. The same identity is intended to underpin Google Drive distribution in a later release, but Google Drive distribution itself is out of scope for MVP (see `## Non-Goals`).
- **Provisioning.** For the MVP only, teacher identities are added by the developer to the backing store (FR-003). There is no in-app invite UI; the director's gatekeeping behavior is deferred. This is a deliberate scope cut documented in both `## Non-Goals` and FR-003's Socratic resolution.
- **Roles.**
  - **Teacher** — creates reports, manages their own students and templates, downloads PDFs.
  - **Director (administrator)** — every capability a teacher has, plus role anchor for v2 admin features (invite UI, central report access, configurable form content). The MVP-visible director-specific behavior is sign-in only; the role exists primarily to scaffold v2 capabilities without a future role-system retrofit.
- **Out of scope for the access model in MVP.** Class-level access boundaries (a teacher restricted to seeing only their own classes' students is a UX scoping choice, not an enforced security boundary), additional read-only roles, and multi-tenant separation across schools.

**Backward-compatibility note.** The current public URL becomes a sign-in landing page. Any visitor who is not on file as either a teacher or the director cannot use the app. This is a deliberate access regression for the unauthenticated path; preserving public access would defeat templates, per-teacher student rosters, and director oversight.

## Non-Goals

The MVP explicitly does NOT do the following. Each item has a one-line rationale so the decision is preserved if the question recurs.

### From the original idea-notes

- **No report history / no PDF archive in the application.** Reports are generate-and-go; generated PDFs are not stored server-side or available for later in-app retrieval. Rationale: keeps the data footprint minimal, makes template deletion provenance-safe (FR-012), and avoids a v2-sized retention / access-control surface.
- **No mobile or responsive layout.** Desktop browsers only. Rationale: teachers do this work at school computers or home desktops; a separate mobile UI doubles the testing surface for marginal benefit.
- **No template sharing between teachers.** Templates are strictly per-teacher. Rationale: shared-template governance (ownership, edit rights, version drift) is a v2-sized problem; the MVP unlock is per-teacher reuse, not cross-teacher reuse.
- **No PDF format alternatives.** PDF only — no Word, plain-text, or HTML output. Rationale: a single-format pipeline keeps the PDF fidelity guardrail tractable and matches the existing system's only output format.

### From scope cuts during shaping

- **No Google Drive save in MVP.** Deferred to a later release. The end-of-MVP flow ends at PDF download; the teacher distributes the file manually. Rationale: removes an entire additional identity-provider scope and a Drive integration from the 3-week delivery budget.
- **No admin-editable form fields in MVP.** Form labels, options, and field defaults stay developer-managed. The director's administrator role exists but its only MVP-visible behavior is sign-in. Rationale: form-schema editing is itself a small CMS — out of scope for the 3-week budget.
- **No multi-tenant / multiple schools.** Britannia school only. Rationale: locked as primary persona scope in shaping; multi-tenant is a different product.
- **No class entity and no class-CRUD UI.** Class is a free-text label on a student (FR-005). Rationale: the shaping Socratic round identified a second-level CRUD surface as too heavy for MVP; a per-school canonical class taxonomy can land in v2 if real demand emerges.
- **No template editing.** Templates are write-once; to change a template, the teacher deletes it and saves a new one. Rationale: the shaping Socratic round identified three management surfaces for one entity (save / edit / delete) as over-complex for MVP.
- **No templates for forms other than trimester/semester.** Year-end, Cambridge, and Teddy Eddie forms remain template-free in MVP. Rationale: cuts template UI work by approximately three-quarters and lets MVP prove the template concept on the most-used form type before generalizing.
- **No over-detailed student or teacher records.** Minimal personal data only — students have a name and a free-text class label; teachers have a Google identity and a display name. Rationale: from the original idea-notes; aligns with EU minor-data minimization principles.

## Open Questions

Numbered list. Each entry names what's unknown, who needs to resolve it, and the latest acceptable resolution date (or stage).

1. **Visual-language consolidation (Angular Material vs Bootstrap).** The current app uses both. The change is allowed to consolidate but is not required to. Owner: implementer. Resolution latest: at the start of implementation planning (downstream of `/10x-stack-assess`).
2. **GDPR / EU minor data baseline.** Student data privacy is captured as a non-functional requirement (`## Constraints & Compatibility` and the privacy guardrail), but specific GDPR safeguards — data export on request, data deletion on request, retention windows, consent-flow language — were not pinned during shaping. Owner: user (school director). Resolution latest: before any non-Britannia user touches the system.
3. **Backend persistence platform.** No specific store is committed by this PRD; the choice is intentionally deferred to the downstream stack-assessment step. Owner: implementer during `/10x-stack-assess`. Resolution latest: before FR-005 / FR-009 implementation begins.
4. **Cutover communication to existing bookmarked-link users.** FR-004 removes public-URL access; the script for telling existing visitors who have the URL bookmarked that they need a seeded account is not specified. Owner: school director. Resolution latest: at deploy time.
