# Identity and Data Platform (F-01) — Plan Brief

> Full plan: `context/changes/identity-and-data-platform/plan.md`
> Roadmap item: `context/foundation/roadmap.md` → F-01
> Platform decision: `context/foundation/infrastructure.md`

## What & Why

Britannia Reports is a stateless public tool that must become a stateful, signed-in product. Nothing in that change can start until an identity provider and a persistent store exist. F-01 provisions both — Google sign-in, a Firestore database in `eur3`, App Check in monitoring mode — wires them into the app's standalone provider config, and locks the store with deny-all rules.

It ships no user-visible behavior. Its entire value is that `S-01`, `S-02`, and `S-03` each find a platform already in place, already region-locked, already closed.

## Starting Point

Verified live on 2026-07-21, not inherited from the roadmap snapshot: `firebase firestore:databases:list` returns `No databases found`, the Google provider is off, and neither `firebase` nor `@angular/fire` appears in `package.json`. `src/app/app.config.ts:25-41` is the only global provider surface and there is no `AppModule` anywhere — so `@angular/fire`'s standalone idioms match this codebase directly. There is no `src/environments/` folder and no `fileReplacements`; this change introduces both.

## Desired End State

A Firestore database exists in `eur3` holding zero collections, with committed deny-all rules deployed to it. The Google provider is enabled with production and localhost domains authorized. App Check is registered but unenforced. The app boots with Firebase initialized and every existing report form behaves and renders PDFs exactly as before.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| Allowlist ownership | No collections in F-01 — `S-01` owns it | The roadmap's Outcome ("no collections, no schemas") beats its Unlocks line; every collection is introduced by the slice that uses it. | Plan |
| Verification approach | Manual console verification | With deny-all and zero collections there is no functional behavior to assert; the rules file's correctness is legible by inspection. | Plan |
| Rules-testing harness | Deferred to `S-01` | `@firebase/rules-unit-testing` is Node-only and the project is pinned to Karma; deferral holds only while rules are unconditional deny-all. | Plan |
| Rules deployment | Deploy deny-all to live | A live database without deployed rules is the risky state, not the safe one. | Plan |
| Config location | `src/environments/` + `fileReplacements` | Gives a build-time seam now so `S-01` has somewhere to put the first value that genuinely differs; the shared shape lives in a third, never-replaced `environment.model.ts`. | Plan |
| Project topology | Single `britannia-reports` project | A second project doubles the manual console steps against a three-week budget, and there is no data to isolate yet. | Plan |
| Emulator | Deferred to `S-01` | F-01 has zero collections, deny-all rules, and no code touching Firestore or Auth — nothing for an emulator to intercept; its JDK prerequisite and two-command dev startup buy nothing until `S-01`'s first collection, which is also where the rules-testing harness needs it. | Plan review |
| App Check | Registered, monitoring mode only | Infrastructure is ready for a one-toggle enable in `S-01`, without shipping enforcement that cannot be safely tested against a deny-all store. | Plan |
| Auth wiring depth | `provideAuth()` only | `S-01` owns the session contract; designing one here with no consumer invites a rewrite. | Plan |
| Rules shape | Deny-all + commented ownership scaffold | Passes the intended pattern forward, carrying the pre-mortem's typo warning with it. | Plan |
| Manual-step record | Update `infrastructure.md` after execution | That document currently asserts Firestore does not exist; unrevised, it becomes a lying source of truth. | Plan |
| Rollback | Code revert only | An empty deny-all database is inert and free, and deleting it would not undo the one-way `eur3` choice. | Plan |
| Landing target | Current branch, no hosting redeploy | F-01 changes nothing a user sees; shipping the SDK to the live site with no feature using it is pure regression risk. | Plan |

## Scope

**In scope:** Firestore database in `eur3`; deny-all rules authored and deployed; Google provider enabled with authorized domains; App Check registered unenforced; `@angular/fire` + `firebase` installed; `src/environments/` with `fileReplacements`; four Firebase providers in `app.config.ts`; documentation sync.

**Out of scope:** Any collection or schema (including the FR-003 allowlist); emulator suite; rules-testing harness; auth session surface, guards, or sign-in UI; navigation layer; hosting redeploy; App Check enforcement; usage alerts; a second Firebase project; CI/CD.

## Architecture / Approach

Four phases, ordered so the store is never reachable while unprotected. The non-obvious choice is that **rules are authored before the database exists** — the naive order leaves a live store on default rules for a whole phase. Writing them first lets the deploy follow creation by seconds.

Phase 2 is isolated because it is where infrastructure comes into existence. Its Console steps (Google provider, App Check) cannot be automated; its CLI steps are non-interactive and can be. The database is created with `firestore:databases:create "(default)" --location=eur3`, **not** `firebase init firestore` — the explicit flag keeps the irreversible region value in a reviewable command, and `init` would silently rewrite the `firebase.json` Phase 1 authored.

```
Phase 1 (local)  →  Phase 2 (human/console)  →  Phase 3 (app code)  →  Phase 4 (docs)
firestore.rules     create DB in eur3            @angular/fire          infrastructure.md
firebase.json       deploy rules                 src/environments/      src/CLAUDE.md
                    Google provider              app.config.ts          change.md
                    App Check (monitoring)
```

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Rules & config scaffolding | `firestore.rules` (deny-all + scaffold), `firebase.json` rules pointer | Commented scaffold gets copied into a live rule without tests — the pre-mortem's leak |
| 2. Infrastructure provisioning | Firestore in `eur3`, rules deployed, Google provider on, App Check registered | `eur3` is a one-way door and nothing in the tooling warns you; the rules deploy must follow creation immediately |
| 3. Environments & SDK wiring | `@angular/fire` installed, `src/environments/` (3 files), four providers | PDF fidelity regression across four report forms; App Check blocking local dev without a debug token |
| 4. Documentation sync | `infrastructure.md`, `src/CLAUDE.md`, `change.md` updated | Skipped at the end, leaving documents that actively misdescribe the system |

**Prerequisites:** Owner access to the Firebase Console for project `britannia-reports` (needed for the Google provider and App Check steps only); authenticated `firebase-tools` (verified working). No upstream change is blocking — F-01 has no prerequisites in the roadmap.

**Estimated effort:** ~2 sessions across 4 phases. Phase 2 is short but entirely human and cannot be parallelized or delegated. No JDK is required — the emulator suite is out of scope.

## Open Risks & Assumptions

- **The emulator suite and the rules-testing harness are both deferred, and arrive together in `S-01`** — before its first conditional rule, as one hard prerequisite. The pre-mortem describes a month-long cross-teacher data leak caused by one field-name typo in exactly that kind of rule. Budget the emulator's setup there: JDK (absent on the current machine), `firebase.json` block, `useEmulators` flag, `connect*Emulator` calls.
- **Dev and prod share one project.** Harmless while empty; from `S-01`'s first collection the emulator must be habit, not an option.
- **App Check protects nothing until `S-01` enables enforcement.**
- **`eur3` is irreversible.** If Phase 2 selects any other location, stop and create a new database rather than proceeding.
- **The App Check debug token is per-machine** — each new developer or browser profile sees console warnings until they register their own.

## Success Criteria (Summary)

- `firebase firestore:databases:list` reports one database in `eur3` with zero collections, and the console shows deny-all as the live ruleset.
- The Google provider is enabled and App Check is registered unenforced, so `S-01` can build a sign-in gate without touching infrastructure.
- The app builds, lints, tests, and boots with Firebase initialized — and all four report forms still produce visually identical PDFs.
