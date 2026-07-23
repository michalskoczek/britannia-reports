---
project: britannia-reports
researched_at: 2026-05-25
frontmatter_refreshed_at: 2026-07-21
recommended_platform: Firebase (Hosting + Authentication + Firestore)
runner_up: Cloudflare (Pages + D1 + Access)
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Angular 20 (standalone, SPA)
  runtime: browser (static SPA bundle, output dist/browser)
---

## Current State (verified 2026-07-23)

Verified against the live project with `firebase-tools` v15.x, not inferred from the research above. The Firestore, Auth, and App Check bullets were re-verified on 2026-07-23 after roadmap item **F-01** (`context/changes/identity-and-data-platform/`) provisioned them; the Hosting, build-output, and codebase bullets carry their earlier 2026-07-10 verification and were not re-checked.

- **Hosting: LIVE.** Site `britannia-reports`, URL https://britannia-reports.web.app. Deploys are made from the `dev` branch. The "first deployment" framing elsewhere in this document is obsolete.
- **Build output is `dist/browser`.** `angular.json` sets `outputPath: { base: "dist" }`; `@angular/build:application` appends the `browser` subdirectory. `firebase.json` already points `hosting.public` at `dist/browser` and is **correct as written** — see the Unknown Unknowns note below for the trap this document previously got backwards.
- **Codebase is Angular 20.3, fully standalone.** `bootstrapApplication` in `src/main.ts` + `appConfig` in `src/app/app.config.ts`. There is no `AppModule` and no NgModule anywhere in `src/app/`.
- **Firestore: LIVE, empty, locked (created 2026-07-23).** `(default)` database, `FIRESTORE_NATIVE`, `STANDARD` edition. **`Location: eur3`** (Europe multi-region) — the recorded decision is now executed and is a one-way door; changing it means a new database and a data migration. Verify with `npx firebase firestore:databases:get "(default)"`. Zero collections, zero documents. `firestore.rules` at the repo root is the live ruleset and denies every read and write to every path for every caller; `firebase.json` carries a top-level `firestore.rules` pointer so `firebase deploy --only firestore:rules` has a source. Delete protection and point-in-time recovery are both **disabled** (Spark defaults) — fine while the store is empty, worth revisiting once `S-01` writes real data.
- **Auth: Google provider ENABLED (2026-07-23).** Turned on by hand in the Firebase Console — there is still no CLI verb for this, so it cannot be re-provisioned by a script. Authorized domains include `britannia-reports.web.app` and `localhost`. **Preview-channel domains are NOT authorized.** They follow the pattern `britannia-reports--<channel>-<hash>.web.app` and are not covered by the base domain, so sign-in fails on any preview channel until that specific domain is added by hand. No sign-in UI, guard, or session surface exists yet — `provideAuth()` only; the session contract belongs to `S-01`.
- **App Check: registered, MONITORING ONLY (2026-07-23).** The web app is registered with a **reCAPTCHA v3** provider; Firestore enforcement is **off**. Site key `6LfffGEtAAAAAHj0u6_WmNZLrw6FM9BbLukS05ZL` — public by design, it ships in the SPA bundle (it lives in `src/environments/environment*.ts`). Until enforcement is flipped, App Check protects nothing.
  **Enforcement is `S-01`'s to enable, and it is not a single toggle.** Turning it on rejects any request without an attestation token, including the app's own unless a client wired with `provideAppCheck` is actually *deployed*. F-01 did no hosting redeploy, so the live site carries no App Check client regardless of what this repo contains. The sequence is: deploy a wired client → confirm tokens appear in monitoring → only then enforce.
  **App Check has never actually initialized, and neither has anything else Firebase.** The dev boot emitted no App Check output and printed no debug token — not because attestation succeeded, but because **no Firebase code runs at all in F-01**. `@angular/fire@20` registers `provideFirebaseApp`, `provideAppCheck`, `provideAuth`, and `provideFirestore` as *lazy* providers: there is no `ENVIRONMENT_INITIALIZER` or `APP_INITIALIZER` in any of those modules, so their factories only execute when something injects `FirebaseApp` / `AppCheck` / `Auth` / `Firestore`. Nothing in `src/` does — `app.config.ts` is the only file in the tree importing `@angular/fire`. So `initializeApp()` and `initializeAppCheck()` are never called, and reCAPTCHA is never reached.

  Two consequences worth carrying into `S-01`. First, **"the app boots with no Firebase errors" proves much less than it sounds like** — it shows the SDK bundles and the existing app still works, not that any Firebase config value is correct. A malformed `apiKey` or site key would not surface until the first injection. Second, on `localhost` the debug-token path is what will engage, not reCAPTCHA: `@angular/fire` sets `globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN ??= true` whenever it is in dev mode or on a localhost hostname, which puts App Check into debug mode and bypasses reCAPTCHA entirely. When `S-01` makes its first real Firestore or Auth call, the SDK will `console.log` a freshly generated debug token; register it via Firebase Console → App Check → Apps → Manage debug tokens (per machine, per browser profile).
- **Web app registered:** `britannia-reports-web`, App ID `1:1039458477078:web:90de33b8569b522a060137`. Fetch its config with `npx firebase apps:sdkconfig WEB <app-id>`. These values are **not secrets** — they ship inside the SPA bundle; Firestore security rules, not key secrecy, are what protect the data. As of F-01 they are checked in at `src/environments/environment.ts` and `environment.prod.ts` (identical in both — dev and prod share one Firebase project). Do not "fix" them into a secret store.
- **`@angular/fire@20` + `firebase` are installed and wired.** `src/app/app.config.ts` appends four providers to the existing `appConfig.providers` array: `provideFirebaseApp`, `provideAppCheck`, `provideAuth`, `provideFirestore`. Still no `AppModule`, still standalone-only. **No emulator suite** — no `emulators` block in `firebase.json`, no `connect*Emulator` calls, no `useEmulators` flag; `npm start` is still one command.

## Recommendation

**Deploy on Firebase (Hosting + Authentication + Firestore).**

Firebase wins on co-location (FR-001..004 Google OAuth, FR-005..012 persistent store, and the SPA hosting all from one vendor), cost ($0 on Spark plan with 2–3 orders of magnitude headroom for a single school's traffic), and existing on-disk configuration (`firebase.json` + `.firebaserc` already present, `firebase-tools` already in devDeps). The Google OAuth requirement (FR-001, FR-002) is first-party — no glue code. The runner-up (Cloudflare) ties on cost and beats on MCP maturity but uses a different OAuth paradigm (Cloudflare Access is an edge gate, not user-bound identity) and trades Firestore's NoSQL footgun for D1's SQL surface — a real consideration tracked in the risk register.

## Platform Comparison

| Platform | CLI-first | Managed | Docs agent-ready | Stable deploy | MCP/Integration | Cost at this scale |
|---|---|---|---|---|---|---|
| **Firebase** | Pass (`firebase-tools` GA, v15.19.0) | Pass (Hosting + Auth + Firestore all managed) | Partial (Genkit ships `llms.txt`; rest HTML) | Pass (`firebase deploy`, channels, versions) | Partial (Firebase MCP **experimental**, May 2025) | **$0** Spark plan |
| **Cloudflare** | Pass (wrangler GA) | Pass (Pages + Workers + D1 all serverless) | Pass (`llms.txt` per product, GA) | Pass (`wrangler deploy` + `wrangler rollback`) | Pass (Cloudflare MCP **GA**) | **$0** Free + Zero Trust Free (50u cap) |
| **Netlify** | Pass (CLI v22+) | Pass (Functions + static) | Pass (`llms.txt` + markdown-for-agents GA) | Pass (CLI deploy; rollback via dashboard "Publish Deploy" on any prior atomic deploy) | Pass (Netlify MCP stable, 43 tools) | **$0** Free (300 credits/mo, hard cap) |
| Render | Pass (CLI GA v2.18) | Pass (Static Sites + managed Postgres) | Pass (`llms.txt` + Copy-page, GA) | Pass (CLI deploy; dashboard rollback) | Pass (Render MCP **GA**) | $6/mo (Postgres Basic; Static free) |
| Vercel | Pass (vercel CLI GA) | Pass (serverless + static) | Partial (no canonical `llms.txt`; MCP search tool) | Pass (`vercel deploy/rollback`) | Partial (Vercel MCP **Beta**) | **$20/mo Pro** (Hobby = non-commercial; a language school is commercial) |
| Railway | Pass (`railway up`, `logs`) | Partial (containers; needs Caddy/nginx for static) | Pass (`llms-full.txt`) | Partial (no rollback CLI verb, dashboard-only) | Partial (MCP **preview**) | ~$10–15/mo (Hobby $5 + Postgres usage; serverless opt-in causes 502 cold-waking) |
| Fly.io | Pass (flyctl GA) | Partial (containers; Dockerfile + nginx) | Partial (no `llms.txt`; "copy as markdown" buttons) | Partial (no native rollback; manual image pin) | Partial (MCP **experimental**) | ~$7–10/mo (no free tier since Oct 2024; MPG min $38/mo oversized) |

### Shortlisted Platforms

#### 1. Firebase (Recommended)

Wins on three axes the PRD makes load-bearing: first-party Google OAuth (FR-001/002 — `GoogleAuthProvider` + `signInWithPopup` on Spark, free for unlimited Google sign-ins), co-located persistent store (Firestore — fits "students/templates/users" as documents at the PRD's scale), and zero cost on Spark with headroom of 2–3 orders of magnitude for this single school's traffic. Familiarity bonus: `firebase.json` + `.firebaserc` already on disk, `firebase-tools` already installed, and `@angular/fire@20` lines up with this codebase's Angular 20 standalone architecture. Hosting is fully decoupled from `@angular/fire` — the hosting deploy is just `firebase deploy --only hosting` on the static bundle; the client SDK is orthogonal and can land incrementally.

#### 2. Cloudflare (Pages + D1 + Access)

Ties Firebase on cost ($0 on Free + Zero Trust Free 50-user cap). Beats Firebase on three points: MCP is **GA** (vs Firebase's experimental), docs ship as `llms.txt` per product (vs Firebase's HTML-only outside Genkit), and D1 is SQL (vs Firestore NoSQL) — which materially reduces v2-migration risk if the PRD's deferred admin features push toward relational shapes. Loses on Google OAuth integration: Cloudflare Access is an edge gate on the SPA rather than per-user identity in the app, which means FR-002 (director role) and FR-001 (teacher role) get distinguished outside the app rather than inside it. Workable but requires more glue than Firebase Auth's role-via-custom-claims pattern. Also: abandons the existing `firebase.json` and `.firebaserc` already on disk, and the live Hosting site they point at.

#### 3. Netlify (+ Netlify DB + external auth)

Strong tooling: MCP stable with 43 tools, `llms.txt` GA + markdown-for-agents Edge Function (request `Accept: text/markdown` and any Netlify site returns markdown — ~80% token reduction for agents). Netlify Database (Neon-backed Postgres) reached GA 2026-04-28 — gives SQL by default. Loses on auth: no first-party Google OAuth at MVP maturity (Identity is feature-frozen as of 2026-02-19; recommended path is Auth0 partnership or BYO Firebase Auth as a client SDK). The hybrid (Netlify hosting + Netlify DB + Firebase Auth as SDK) is workable but introduces more moving parts. Free-storage cliff for Netlify DB was scheduled for 2026-07-01 — that date has now passed and the outcome was not re-checked. Treat the Netlify cost line in the comparison table as unverified from that date onward; re-research before ever acting on this option.

## Anti-Bias Cross-Check: Firebase

### Devil's Advocate — Weaknesses

1. **NoSQL ↔ relational shape mismatch.** The PRD has clear relational shapes (teacher → students, teacher → templates). Firestore forces denormalization decisions early — embed vs reference for class-label, template content, future "last-used student per template" relations. Works at MVP scale, but the PRD's v2-deferred features (admin invite UI, central report access, configurable form fields) are exactly the kind that push toward SQL.
2. **Firestore security rules are a silent footgun.** Every owned-data FR requires `request.auth.uid == resource.data.teacherId` consistently — students (FR-005..008) *and* templates (FR-009..012), including the read paths (FR-010 list, FR-011 apply) that are easy to leave off a rules review because they don't write. Over-permissive rules don't fail loudly — they leak data quietly until a second teacher signs in. Testing rules properly needs the Firebase emulator + an explicit testing harness, not the kind of thing a 3-week after-hours brownfield window naturally builds.
3. **Spark plan daily quotas are tight.** 50K reads/day, 20K writes/day. A buggy `onSnapshot` listener that doesn't tear down on `ngOnDestroy` (and the project already has known sub-leak warnings) can churn through quotas in minutes of active use.
4. **Project ID + default Firestore database location are one-way decisions.** Project ID gets baked into `auth.callback` URLs forever. Default Firestore database location picked on first write — for Europe must be `eur3`, mistake means a brand-new database to migrate to.
5. **Firebase MCP server is experimental (May 2025).** Tool surface, names, and authentication may shift between `firebase-tools` releases during the 3-week build window.

### Pre-Mortem — How This Could Fail

The team picked Firebase because `firebase.json` was already on disk and the cost story looked perfect ($0 on Spark). The first three weeks went well: Hosting + Auth (Google) + Firestore landed for FR-001..014, template flow worked. Then the director asked for v2-deferred features earlier than planned: a central view of completed reports, an in-app teacher invite UI, and configurable form labels.

Each surfaced friction the team hadn't budgeted. The teacher invite UI needed Admin SDK from a server context → Cloud Functions → Blaze plan. The central report view required either denormalizing reports into a queryable shape or building aggregation Functions — costs trended upward. After two months, a teacher reported seeing another teacher's templates — a security-rule typo had `teacherUid` where the field was `teacherId`. The bug had been live for a month before anyone noticed because over-permissive rules don't fail loudly.

The team migrated to Postgres in month five. The Auth migration alone took three weeks of evenings because Firebase Auth UIDs don't map to anything else without coordinated migration.

### Unknown Unknowns

- **`firebase.json` has `public: "dist/browser"`, and that is correct — do not "fix" it.** An earlier revision of this document claimed the builder writes to `dist/britannia-reports/browser` and called the config a day-0 bug. That was wrong, and acting on it would have shipped an empty deploy to a live site. The builder's output path is driven by `angular.json`'s `outputPath.base`, which is `"dist"`; the `browser` subdirectory is appended by `@angular/build:application`. The real trap is the coupling: **`angular.json:outputPath` and `firebase.json:hosting.public` must change together, in the same commit.** Verified 2026-07-10 — `firebase hosting:channel:deploy` reports `found 22 files in dist/browser`.
- **Firestore default database location is one-way.** Pick `eur3` (Europe multi-region) on the very first write — changing requires creating a new database and migrating.
- **Spark plan blocks outbound HTTP from Cloud Functions.** Any external API call from Functions (email notifications, webhooks to the director) requires Blaze. Not just a cost issue — a feature gate.
- **`@angular/fire` docs default to standalone idioms, and so does this codebase — they match.** An earlier revision claimed the opposite (that the project was NgModule-based and standalone snippets needed translating). There is no `AppModule`. Providers (`provideFirebaseApp`, `provideAuth`, `provideFirestore`) go into the `appConfig.providers` array in `src/app/app.config.ts`, alongside the existing `provideHttpClient()` and `provideTranslateService(...)`. Reject any agent-generated `AppModule` scaffolding.
- **Firebase project ID is global and irreversible.** A picked ID like `britannia-reports-prod` gets baked into auth domain (`<id>.firebaseapp.com`), storage bucket name, and OAuth callback URLs. Display name can change; ID cannot.

## Operational Story

- **Preview deploys**: Firebase Hosting preview channels via `firebase hosting:channel:deploy <channel-name> --expires 7d` produce a temporary URL per channel. Expires automatically (max 30 days). Useful for PR review — no native Git integration on Spark, so wire via GitHub Actions when CI lands (M1L5). Channel URLs are public by default; gate via Firebase Auth in the app, not at the URL level.
- **Secrets**: Firebase config (`apiKey`, `authDomain`, `projectId`) is NOT secret — it's bundled into the SPA and exposed to every visitor (Auth + Firestore security depend on rules, not on API-key secrecy). True secrets (e.g., service-account JSON for Admin SDK in future Functions) live in GitHub Actions Secrets and Functions runtime config (`firebase functions:config:set`). On Spark plan, server-side secrets are limited because Functions are limited.
- **Rollback**: `firebase hosting:versions:list` to see deployed versions; `firebase hosting:versions:clone <source-version-id>:live <target-site>:live` to roll a prior version forward. Typical time-to-revert: under a minute. Firestore data: NOT rolled back by hosting rollback — Firestore mutations are independent of Hosting versions. Schema migrations on Firestore (collection renames, field migrations) require manual reversal scripts.
- **Approval**: Any human-gated step. Production deploys (`firebase deploy --only hosting`) — human-approved. Rotating the Firebase service account (when CI lands) — human-approved. Adding a new teacher to the Auth store (FR-003 says developer-seeded for MVP) — developer action, technically agent-runnable via Admin SDK + Functions, but Spark plan doesn't include Functions for outbound network calls. Schema-changing Firestore migrations — human-approved.
- **Logs**: `firebase functions:log` for Cloud Functions output. Hosting logs: in the Firebase Console (no dedicated CLI log-tail; hosting logs are request-level summaries, not full stack-trace streams). Firestore audit logs require Blaze + Cloud Audit Logs enablement. For an agent reading state read-only: `firebase database:get` + `firebase firestore:indexes` + the Firebase MCP server (experimental — 30+ tools for projects/Auth/Firestore queries).

## Risk Register

| Risk | Source | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| `hosting.public` and `angular.json:outputPath` drift apart — one changed without the other — producing a silent empty deploy over a live site | Unknown unknowns | L (config verified aligned 2026-07-10) | H | Never edit one without the other in the same commit. Gate every deploy on `ls dist/browser/index.html` after `npm run build`; a missing file means STOP, not "deploy anyway". `firebase deploy` exits 0 on an empty directory. |
| Firestore default DB location picked wrong (not `eur3`) — one-way decision | Unknown unknowns | **CLOSED 2026-07-23** | H | Resolved. Created via `firestore:databases:create "(default)" --location=eur3`; `firestore:databases:get` confirms `Location: eur3`. The door is now shut in the right position — no further action, and no way back. |
| Firestore security rules silently over-permissive — data leakage between teachers (students FR-005..008, templates FR-009..012) | Devil's advocate, Pre-mortem | M | H | **OPEN — the top risk carried out of F-01.** Currently mitigated only by an unconditional deny-all ruleset, which holds exactly until `S-01` writes its first conditional rule. Adopt the emulator suite + `@firebase/rules-unit-testing` **before** that rule, not after — see Getting Started step 4. Per-FR tests across both collections in `*.rules.spec.ts`: teacher A cannot read teacher B's students/templates. |
| Dev and prod share one Firebase project — local development reads and writes the production store | F-01 implementation | M | H | Harmless while the store is empty under deny-all. From `S-01`'s first collection onward it is live. The emulator suite is the mitigation and it does not exist yet, which is why `S-01` must adopt it before its first Firestore call rather than after. |
| App Check attestation on `localhost` is unproven — no debug token registered, and F-01 exercised zero attested requests | F-01 implementation | M | L | Low impact while enforcement is off. If `S-01`'s first Firestore/Auth call fails attestation, register a debug token (Firebase Console → App Check → Apps → Manage debug tokens) — the escape hatch is already wired in `app.config.ts` behind `!environment.production`. Per machine and per browser profile. |
| Spark plan daily quotas exhausted by leaky `onSnapshot` listeners (50K reads / 20K writes per day) | Devil's advocate | M | M | Enforce existing `OnDestroy` cleanup convention (CLAUDE.md mentions `takeUntil`/`async`/`destroyRef`). Add a `@firebase/firestore` listener wrapper that warns at dev-time when more than N listeners are active. Set up Firebase usage alerts in Console. |
| v2-deferred features push toward SQL — Firestore → Postgres migration during MVP+6mo | Pre-mortem | M | H | Document v1 schema in `infrastructure.md` so the v2 migration starts from a known state. Defer migration decision until v2 features have firm requirements; don't pre-migrate. |
| Firebase MCP server experimental — tool surface may change mid-build | Devil's advocate | M | L | Treat MCP tools as nice-to-have, not load-bearing. CLI commands (`firebase deploy`, `firebase firestore:*`) are GA and the authoritative path for the 3-week window. |
| Agent scaffolds an `AppModule` when wiring `@angular/fire`, breaking the standalone-only architecture | Unknown unknowns | L | L | Providers go in `appConfig.providers` (`src/app/app.config.ts`): `provideFirebaseApp(...)`, `provideAuth(...)`, `provideFirestore(...)`. `src/CLAUDE.md` already pins standalone-only; reject any NgModule scaffolding. |
| Firebase project ID is irreversible | Unknown unknowns | L | M | Pick the ID once with deliberate naming (`britannia-reports-prod`, `britannia-reports-dev`). Document the choice and the auth domain it produces. |
| Spark blocks outbound HTTP from Cloud Functions — blocks email/webhooks | Unknown unknowns | L (no Functions in MVP scope) | M | Stay on Spark for MVP. When Functions land (post-MVP), explicitly budget Blaze and acknowledge cost shift. |
| `firebase deploy` has no native pre-deploy validation that the bundle actually loaded — silent empty deploys possible if path is wrong | Devil's advocate | L | M | After `npm run build`, run `ls dist/browser/index.html` as a pre-deploy check. Prefer `firebase hosting:channel:deploy <name> --expires 7d` over a direct live deploy: the CLI prints `found N files in dist/browser`, which is the cheapest confirmation the bundle is real. Wire the check into CI when it lands. |

## Getting Started

Hosting was already done. **Steps 1, 2, and 3 were executed by F-01 on 2026-07-23 and are kept below as the record of what was done, not as work to do.** Step 4 is the one item still outstanding — see **Still Outstanding** at the end of this section.

0. **Do not change `firebase.json`.** `"public": "dist/browser"` is correct and matches `angular.json`'s `outputPath.base: "dist"`. Verify alignment before every deploy rather than editing: `npm run build && ls dist/browser/index.html`. To rehearse a deploy safely, use a preview channel (`firebase hosting:channel:deploy predeploy-check --expires 7d`) and check that the CLI reports a non-zero file count from `dist/browser`.

1. **✅ DONE (2026-07-23) — Create the Firestore database.** Executed as `npx firebase firestore:databases:create "(default)" --location=eur3`, followed immediately by `npx firebase deploy --only firestore:rules` so the store was never reachable under rules we did not commit.

   **Do not use `firebase init firestore`** — an earlier revision of this document recommended it and that was wrong. It writes `firestore.indexes.json` and an `"indexes"` key into `firebase.json` as a side effect, and it offers no "production mode vs test mode" choice (that prompt belongs to the Console flow), so an implementer looking for it stalls at exactly the step whose next decision is irreversible. Passing `--location=eur3` explicitly keeps the one-way value reviewable in the command instead of typed at a prompt.

2. **✅ DONE (2026-07-23) — Enable Authentication providers.** Google provider enabled in Firebase Console → Authentication → Sign-in method (no CLI verb exists — manual, human-gated). `britannia-reports.web.app` and `localhost` are authorized.

   **Preview-channel domains are still not authorized, and this is a live trap.** Channel URLs are generated per channel (e.g. `britannia-reports--<channel>-<hash>.web.app`) and the base domain does not cover them, so Google sign-in fails on any preview until that exact domain is added by hand. Whoever first deploys a preview channel with a sign-in flow hits this.

3. **✅ DONE (2026-07-23) — Install `@angular/fire@20` and wire it into `app.config.ts`.** `npm install @angular/fire@^20 firebase` landed `@angular/fire@^20.0.1` and `firebase@^12.16.0` with no `@angular/*` version drift. Four providers now sit at the end of the existing `appConfig.providers` array — `provideFirebaseApp`, `provideAppCheck`, `provideAuth`, `provideFirestore` — with `provideFirebaseApp` first. There is still no `AppModule`; the app bootstraps via `bootstrapApplication(AppComponent, appConfig)` in `src/main.ts`. **Reject any NgModule scaffolding.**

   Config no longer comes from a call to `apps:sdkconfig` at wiring time — it is checked in at `src/environments/environment.ts` / `environment.prod.ts`, swapped by `fileReplacements` on the production build. See `src/CLAUDE.md` for the convention.

### Still Outstanding

4. **⚠️ OPEN — Stand up the emulator suite and the rules-testing harness BEFORE the first conditional rule.** This is the one recommendation F-01 did **not** execute, and it is a hard prerequisite for `S-01`, not a nice-to-have.

   Deferral was defensible in F-01 only because the deployed ruleset is an unconditional deny-all whose correctness is legible in four lines. **It stops being defensible the moment a conditional rule appears** — which is `S-01`'s first collection. The pre-mortem above describes the failure precisely: a month-long cross-teacher data leak caused by a single field-name typo (`teacherUid` where the field was `teacherId`), invisible because over-permissive rules do not fail loudly.

   Two reasons this is now more urgent than the risk register alone suggests. **Dev and prod share one Firebase project** — from `S-01`'s first collection onward, local development reads and writes the *production* store. The emulator is the mitigation and it does not exist yet. And `@firebase/rules-unit-testing` is **Node-only**, while this project is pinned to Karma + Jasmine in the browser (`src/CLAUDE.md`) — so this is a second-test-runner decision, which that file classifies as explicit future work rather than a drive-by.

   Budget the setup: a JDK (verify presence — it was absent on the development machine as of 2026-07-22), an `emulators` block in `firebase.json`, a `useEmulators` flag added to the `Environment` interface in `src/environments/environment.model.ts`, and `connect*Emulator` calls in `app.config.ts`. Then `*.rules.spec.ts` covering: teacher A reads/writes only own data, teacher B blocked from A's data, unauthenticated user blocked from everything — run against the emulator before any deploy.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration (Firebase is serverless — no containers in this stack).
- CI/CD pipeline setup (M1L5 territory). When CI lands, the recommended target is GitHub Actions running `npm ci && npm run build && firebase deploy --only hosting` on push.
  Two corrections to the obvious recipe: **(a)** `--token` / `firebase login:ci` is deprecated as of `firebase-tools` v13+ — authenticate CI with a service account via `GOOGLE_APPLICATION_CREDENTIALS` (or `FIREBASE_SERVICE_ACCOUNT` with the official `FirebaseExtended/action-hosting-deploy`) instead. **(b)** Deploys currently ship from `dev`, not `master`; wire the trigger to whichever branch is actually the deploy source, or the pipeline will silently never fire.
  Include a lint gate from the first workflow. `npm run lint` passes on `dev` as of 2026-07-20 — the 9 pre-existing errors in `src/app/year-report/year-report.component.ts` were cleared in a dedicated change. That regression had lived on the deploy branch for over a month precisely because nothing ran the linter between commits (see `context/foundation/health-check.md`), so the gate is the fix, not a follow-up to it.
- Production-scale architecture: multi-region failover, SLA commitments, Firestore at >50K MAU, Functions beyond Spark — all out of scope for MVP and absent from the PRD.
- Cost projections beyond MVP. The Spark plan covers single-school usage with 2–3 orders of magnitude headroom; Blaze transition cost is a v2 question.
