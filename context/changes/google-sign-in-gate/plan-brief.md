# Google Sign-in Gate (S-01) — Plan Brief

> Full plan: `context/changes/google-sign-in-gate/plan.md`
> Roadmap item: `context/foundation/roadmap.md` → S-01
> Platform state: `context/foundation/infrastructure.md`

## What & Why

Britannia Reports is a public URL anyone can open. Every capability the rest of this change is built on —
per-teacher templates, a per-teacher student roster — needs an identity to scope "their own" data against.
This slice puts one there: sign in with Google, get checked against a developer-seeded allowlist, and only
then reach the four report forms. It also carries the change's only deliberate regression — the public URL
stops working for anyone not on file.

## Starting Point

F-01 provisioned the platform and stopped: Google provider enabled, Firestore live in `eur3` with zero
collections under deny-all rules, App Check registered in monitoring mode, four `@angular/fire` providers in
`app.config.ts`. Those providers are lazy and nothing injects them, so **no Firebase code has ever executed
in this project** — this slice makes the first real call. The app itself has no router: `AppComponent`
renders a header, a tab bar, and an `NgComponentOutlet` over `TabData.tabs`, which is why gating can sit
above the report components without editing a single report template.

## Desired End State

Opening the app shows a brief loading state, then either the sign-in screen or the familiar four-tab report
surface — never a flash of the wrong one. An allowlisted teacher signs in and sees their address plus a
sign-out button in the header. Any other Google account bounces back to the sign-in screen with a "no
access" message and no session left behind. The language toggle works everywhere, and the four report forms
behave and print exactly as before.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) |
| --- | --- | --- |
| Navigation surface | Minimal Angular Router — `/sign-in` + guarded shell | `@angular/router` is already installed and the SPA rewrite exists; two routes give FR-004 its literal redirect and later slices somewhere to land. |
| Tab registry | Untouched, moved into a `ShellComponent` | Routing stops at the shell; the four report types stay composed by `TabData.tabs`, so `S-05b` is unaffected. |
| Header placement | Stays in `AppComponent`, above the outlet | Moving it into the shell would strip the language toggle from the sign-in screen and break FR-018 ("every screen"). |
| Allowlist shape | `allowedUsers/{lowercased-email}`, read-only | Only an email-keyed document can be seeded *before* the teacher first signs in, which is exactly what FR-003 asks for; a UID does not exist yet. |
| Denied account | Immediate `signOut()` + message | Leaves no half-authenticated state — the session either exists and is entitled, or does not exist. |
| Lookup failure | Fail-closed, but a distinct message | A network blip is otherwise indistinguishable from revoked access, and generates a phone call to the developer. |
| Read mechanism | One-shot `getDoc`, never `onSnapshot` | The risk register names leaky listeners against Spark's 50K reads/day; the allowlist does not change mid-session. |
| Session | `signInWithPopup` + `browserLocalPersistence` | PRD is desktop-only, popup keeps app state, and teachers return to this tool once a reporting period. |
| Emulator + rules-testing harness | **Deferred to `S-02`/`S-03`** | Conscious override of a documented prerequisite — see Open Risks. |
| Testability seam | Two thin gateways under a `SessionService` | With the emulator deferred, unit tests are the only automated barrier, so the decision logic must be drivable with fakes. |
| App Check | Stays monitoring-only | `infrastructure.md` describes enforcement as a deploy→observe→enable sequence, not a toggle; enabling it in the same change that first runs Firebase gives two suspects for every failure. |
| Deployment | Merge only — no hosting deploy, not even a preview channel | The public-URL cutover waits on the director's message (Open Roadmap Question #2). |
| Documentation | Runbook + sync of `infrastructure.md`, `src/CLAUDE.md`, roadmap, PRD | `lessons.md` makes it a standing rule that a change fixes the sections it makes contradictory. |

## Scope

**In scope:** `allowedUsers` collection, its security rule, and a seeding runbook; a session layer
(`AuthGateway`, `AllowlistGateway`, `SessionService`) with specs; two routes, two guards, a `ShellComponent`;
a sign-in screen on the published design language; email + sign-out in the header; PL/EN keys for every new
string; absorbing the fifth elevation-shadow copy that `design-language.md` §5 assigns to this slice;
documentation sync.

**Out of scope:** the emulator suite and `@firebase/rules-unit-testing`; App Check enforcement; any hosting
deploy; any collection beyond the allowlist; any edit inside the four report components; a route per report
type; in-app invites or director-specific behaviour; the `S-05b` restyle.

## Architecture / Approach

```
AppComponent  ─ app-header (language toggle · email · sign-out)
              └ router-outlet ─┬─ /sign-in  → SignInComponent      [signInGuard]
                               └─ /         → ShellComponent       [authGuard]
                                               └ tab-group + NgComponentOutlet (unchanged)

SessionService (signal: resolving | anonymous | authorized | denied)
   ├── AuthGateway      → @angular/fire/auth   (popup sign-in, sign-out, user stream)
   └── AllowlistGateway → @angular/fire/firestore (one-shot getDoc on allowedUsers/{email})
```

Every consumer reads the one session signal. Both gateways exist so the state machine can be tested with
fakes — the compensation for having no emulator.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Allowlist, rules, runbook | `allowedUsers` rule deployed, first account seeded, onboarding written down | The project's first conditional rule, with no automated test behind it |
| 2. Session layer | Gateways, `SessionService`, the change's main spec coverage | A state machine with four states and a forced sign-out inside one of them |
| 3. Router, shell, guard, sign-in | The gate works end-to-end | Guard/boot ordering — a flash of the wrong screen, or a redirect loop |
| 4. Visual language pass | Sign-in screen and header on the published tokens | A "no-op" shadow refactor that is not actually a no-op |
| 5. Documentation sync | Four documents describing the system that now exists | Skipped at the end, leaving records that actively mislead the next slice |

**Prerequisites:** F-01 and F-02 (both `impl_reviewed`); `S-05a` merged (`36c2c9b`) so the style tokens
exist; Firebase Console access for seeding the allowlist and registering the App Check debug token; one
Google address to seed, ideally a second to test denial.

**Estimated effort:** ~3 sessions across 5 phases. Phase 3 is the bulk; Phases 1 and 4 are short.

## Open Risks & Assumptions

- **The emulator and rules-testing harness are deferred, against a documented prerequisite.**
  `infrastructure.md` → Getting Started step 4 calls them a hard `S-01` prerequisite, "before the first
  conditional rule". The reasoning for overriding it: the allowlist is read-only to every caller and holds
  no student data, so the pre-mortem's cross-teacher leak has no surface here. That stops being true in
  `S-02`/`S-03`, which now inherit the debt — Phase 5 writes that into all three documents rather than
  leaving it implicit.
- **Local development reads and writes the production Firestore project.** Unavoidable without the
  emulator; the exposure is one read-only collection, but it is real and grows with the next slice.
- **The first Firebase call is the first proof any config value is correct.** A malformed `apiKey` or
  reCAPTCHA site key surfaces in Phase 3 and nowhere earlier; on `localhost` an App Check debug token must be
  registered by hand before assuming a failure is a code bug.
- **Two files are shared with the parallel `S-05b`**: `src/assets/i18n/{en,pl}.json` and
  `header.component.*`. Both diffs are additive and small, but they need coordinating at merge.
- **Nothing ships to users.** The change ends merged and unverified against Hosting; the first deploy —
  and the regression it carries — is a separate, human-gated decision that also needs a preview-channel
  domain authorized in Firebase Auth.

## Success Criteria (Summary)

- A teacher whose address the developer seeded signs in with Google and reaches all four report forms; the
  header shows which account they used.
- A visitor who is not on the allowlist cannot reach any form, and is told which of the two things went
  wrong — no access, or the check itself failed.
- The four report forms behave, look, and print exactly as they did before, and the UI still switches
  between Polish and English on every screen.
