# Trimester/Semester Report Templates — Plan Brief

> Full plan: `context/changes/trimester-report-templates/plan.md`

## What & Why

Roadmap slice **S-02**, the north star. Teachers already stopped writing reports in MS Word, but they
still retype roughly 80% of the same phrasing across students and across classes — the bottleneck
moved from the PDF tool to the repetitive typing. This slice lets a teacher save the reusable half of
a trimester/semester report as a named template, apply it to a new report, and download the PDF. If
that works, the change pays for itself; if it does not, no amount of sign-in polish rescues it.

## Starting Point

`S-01` landed the gate: `src/app/auth/` holds one `SessionService` plus two thin Firebase gateways,
and Firestore has exactly one collection — a read-only allowlist. There is **no emulator suite** and
no rules-testing harness; `src/CLAUDE.md` says to treat anything run locally as writing to
production. `SessionState` carries `email` and `role` but **not** `uid`, which is what a per-teacher
rule must compare against. The trimester/semester form has 48 controls whose exact names are frozen
by a spec, three visibility booleans that live outside the form, and a hard PDF-fidelity guardrail
with committed reference PDFs.

## Desired End State

A signed-in teacher sees a **Templates** panel above the trimester/semester form: a list of their own
templates, a name field with Save, Apply, and Delete. Apply fills the ten cohort-level fields, first
showing a dialog that names exactly which non-empty fields will be overwritten or cleared, and never
touches student-identity or per-student assessment fields. Templates live at
`users/{uid}/reportTemplates/{templateId}`; `npm run test:rules` proves the rule against the
emulator; `npm start` no longer writes to production.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Template field domain | Ten cohort-level controls only | A template that pre-filled a grade would let one overlooked select send a parent another student's mark. | Plan |
| Storage shape | `users/{uid}/reportTemplates/{id}` | Ownership keyed on the path structurally cannot exhibit the `teacherUid`/`teacherId` failure that is the project's top risk. | Plan |
| Emulator scope | App-side emulator wiring, plus a standalone `npm run test:rules` | Closes both open risks without integrating a second runner into `npm test` or CI. | Plan |
| Rules proof | `node --test` + `firebase emulators:exec`, one `.mjs` file outside `src/` | Machine-checks the three scenarios with no new test runner and no config fights. | Plan |
| Panel location | `app-template-panel` inside the semestr form | Apply acts on the form already open; switching tabs or routes would destroy the filled form. | Plan |
| Panel state | Its own form; `SemestrReportComponent.form` gains zero controls | Keeps the frozen contract spec and the PDF-fidelity fixtures honest. | Plan |
| Empty template / apply | All keys stored, apply writes all incl. `null`, emptiness compared to a defaults constant | Satisfies FR-011's determinism and US-01's no-op at once. | Plan (resolves roadmap unknown) |
| Schema evolution | `schemaVersion: 1` + code-side `TEMPLATE_DOMAIN`; missing key ⇒ default | `S-04` can widen the domain without invalidating saved templates. | Plan |
| Confirmation prompt | First `MatDialog` in the app, reusable by `S-03` | Material is the convention for new surfaces and the content must translate (FR-018). | Plan |
| Template names | Required, unique per teacher (case-insensitive), `nameKey` is the document id | Makes uniqueness and PRD's write-once non-goal one rules-enforced invariant. | Plan |
| Errors | `MatSnackBar` for operations, inline for a list that failed to load | A snackbar cannot explain a list that is not there. | Plan |
| Deploy | Live deploy + App Check enforcement as the last phase, **without** waiting for the cutover message | User's decision, taken with the regression in view. | Plan |
| Cut order | Phase 6 (deploy) is what falls first if time runs out | Everything before it is a complete, merged, verified change. | Plan |

## Scope

**In scope:** the emulator suite and rules harness; the first per-teacher Firestore rule; `uid` on the
session state; the template domain constant and its partition assertion; gateway + service; the panel,
dialog, snackbar and PL/EN strings; wiring into the trimester/semester form; the PDF-fidelity check;
documentation sync; deploy plus App Check enforcement.

**Out of scope:** template editing (PRD non-goal, now rules-enforced); templates for the other three
forms; the student roster and picker (`S-03`, `S-04`); template sharing; report history; per-student
assessment fields in the template domain; CI integration for the rules script; migrating `npm test`
off Karma; any change to the `pdfmake` document definition.

## Architecture / Approach

```
TemplatePanelComponent ──► TemplatesService ──► TemplatesGateway ──► Firestore
   (own small form)         (all decisions)      (all SDK calls)     users/{uid}/reportTemplates
        │
        │  apply(payload)                       rule: request.auth.uid == uid
        ▼                                             update: denied
SemestrReportComponent
   collectDomain() / applyDomain()  ──► form.patchValue over TEMPLATE_DOMAIN only
                                    ──► derive isCheckedBook / isCheckedOwnTitle
```

The gateway/service split repeats the seam `S-01` established in `src/app/auth/`, for the same
reason: the decisions are testable with fakes. `TEMPLATE_DOMAIN` is the single source of truth for the
field boundary, and a spec asserts that the four field sets partition all 48 controls exactly — so
`S-04`'s disjoint-domain assumption is machine-checked, not documented.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Emulator, harness, rule | Local emulators, `npm run test:rules`, the per-teacher rule | JDK install; a fresh emulator needs an allowlist seed or sign-in breaks locally |
| 2. Session `uid` + data layer | `uid` on the session, domain constant, gateway, service | Three spec literals stop type-checking; fakes are more obliging than Firebase |
| 3. Panel, dialog, snackbar, i18n | The whole surface, unit-tested, not yet mounted | First dialog pattern in the repo; PL/EN key parity |
| 4. Wire into the report | Save/list/apply/delete working end-to-end | Visibility booleans outside the form; moment-vs-native date adapter; PDF fidelity |
| 5. Documentation sync | `src/CLAUDE.md`, `infrastructure.md`, rules header, roadmap, PRD | Leaving a document contradicting itself |
| 6. Deploy + App Check | Three merged slices live, enforcement on | Removes public-URL access with no cutover message |

**Prerequisites:** `S-01` merged (done, 2026-07-29); a JDK on the dev machine (absent as of
2026-07-28 — Phase 1 installs it); Firebase Console access for App Check enforcement in Phase 6.

**Estimated effort:** ~4–6 sessions across six phases. Phases 1 and 4 are the heavy ones — Phase 1 is
mostly setup with a manual seed step, Phase 4 carries both guardrails.

## Open Risks & Assumptions

- **The deploy ships FR-004's regression without the cutover message.** PRD Open Question #4 and
  roadmap OQ#2 both ask for it and it does not exist. Raised during planning and reaffirmed: anyone
  holding a bookmark to `britannia-reports.web.app` will meet a sign-in screen with no notice. This is
  a recorded decision, not an oversight, and it is the reason Phase 6 is also the phase to cut first.
- **The rules script is not in `npm test` and not in CI.** Nothing runs it automatically, so a future
  rule change can ship unverified. `S-03` inherits the script; it does not inherit a gate.
- **A `date` round-trip can pass every spec and break in the browser** — specs use the native date
  adapter, the app uses the moment adapter. Mitigated by storing a calendar-date string and by an
  explicit manual check; this is exactly the seam that produced three of `S-01`'s defects.
- **Dev and prod still share one Firebase project.** The emulator is the mitigation and it is on by
  default in `environment.ts` after Phase 1 — but any developer who flips the flag is writing to real
  teacher data.
- **Assumption:** the ten-field domain is enough to deliver the "under 50% of the previous time"
  secondary success criterion. If a teacher reports otherwise, widening the domain is a deliberate
  follow-up, and the partition spec is what makes that widening safe.

## Success Criteria (Summary)

- A teacher saves a filled trimester/semester report's cohort fields as a named template, applies it
  to a new report, and downloads a PDF indistinguishable from a hand-typed one.
- Applying over non-empty fields warns first, naming what will be overwritten and what will be
  cleared; an empty template does nothing.
- One teacher cannot see another teacher's templates — proven by `npm run test:rules` and confirmed
  against the live app with two accounts.
