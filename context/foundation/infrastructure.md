---
project: britannia-reports
researched_at: 2026-05-25
frontmatter_refreshed_at: 2026-06-02
recommended_platform: Firebase (Hosting + Authentication + Firestore)
runner_up: Cloudflare (Pages + D1 + Access)
context_type: mvp
tech_stack:
  language: TypeScript
  framework: Angular 20 (standalone, SPA)
  runtime: browser (static SPA bundle, output dist/britannia-reports/browser)
---

## Recommendation

**Deploy on Firebase (Hosting + Authentication + Firestore).**

Firebase wins on co-location (FR-001..004 Google OAuth, FR-005..009 persistent store, and the SPA hosting all from one vendor), cost ($0 on Spark plan with 2–3 orders of magnitude headroom for a single school's traffic), and existing on-disk configuration (`firebase.json` + `.firebaserc` already present, `firebase-tools` already in devDeps). The Google OAuth requirement (FR-001, FR-002) is first-party — no glue code. The runner-up (Cloudflare) ties on cost and beats on MCP maturity but uses a different OAuth paradigm (Cloudflare Access is an edge gate, not user-bound identity) and trades Firestore's NoSQL footgun for D1's SQL surface — a real consideration tracked in the risk register.

## Platform Comparison

| Platform | CLI-first | Managed | Docs agent-ready | Stable deploy | MCP/Integration | Cost at this scale |
|---|---|---|---|---|---|---|
| **Firebase** | Pass (`firebase-tools` GA, v15.18.0) | Pass (Hosting + Auth + Firestore all managed) | Partial (Genkit ships `llms.txt`; rest HTML) | Pass (`firebase deploy`, channels, versions) | Partial (Firebase MCP **experimental**, May 2025) | **$0** Spark plan |
| **Cloudflare** | Pass (wrangler GA) | Pass (Pages + Workers + D1 all serverless) | Pass (`llms.txt` per product, GA) | Pass (`wrangler deploy` + `wrangler rollback`) | Pass (Cloudflare MCP **GA**) | **$0** Free + Zero Trust Free (50u cap) |
| **Netlify** | Pass (CLI v22+) | Pass (Functions + static) | Pass (`llms.txt` + markdown-for-agents GA) | Pass (CLI deploy; rollback via dashboard "Publish Deploy" on any prior atomic deploy) | Pass (Netlify MCP stable, 43 tools) | **$0** Free (300 credits/mo, hard cap) |
| Render | Pass (CLI GA v2.18) | Pass (Static Sites + managed Postgres) | Pass (`llms.txt` + Copy-page, GA) | Pass (CLI deploy; dashboard rollback) | Pass (Render MCP **GA**) | $6/mo (Postgres Basic; Static free) |
| Vercel | Pass (vercel CLI GA) | Pass (serverless + static) | Partial (no canonical `llms.txt`; MCP search tool) | Pass (`vercel deploy/rollback`) | Partial (Vercel MCP **Beta**) | **$20/mo Pro** (Hobby = non-commercial; a language school is commercial) |
| Railway | Pass (`railway up`, `logs`) | Partial (containers; needs Caddy/nginx for static) | Pass (`llms-full.txt`) | Partial (no rollback CLI verb, dashboard-only) | Partial (MCP **preview**) | ~$10–15/mo (Hobby $5 + Postgres usage; serverless opt-in causes 502 cold-waking) |
| Fly.io | Pass (flyctl GA) | Partial (containers; Dockerfile + nginx) | Partial (no `llms.txt`; "copy as markdown" buttons) | Partial (no native rollback; manual image pin) | Partial (MCP **experimental**) | ~$7–10/mo (no free tier since Oct 2024; MPG min $38/mo oversized) |

### Shortlisted Platforms

#### 1. Firebase (Recommended)

Wins on three axes the PRD makes load-bearing: first-party Google OAuth (FR-001/002 — `GoogleAuthProvider` + `signInWithPopup` on Spark, free for unlimited Google sign-ins), co-located persistent store (Firestore — fits "students/templates/users" as documents at the PRD's scale), and zero cost on Spark with headroom of 2–3 orders of magnitude for this single school's traffic. Familiarity bonus: `firebase.json` + `.firebaserc` already on disk, `firebase-tools` already installed, and `@angular/fire@19` is GA (Jan 2024) for Angular 19's NgModule architecture. Hosting is fully decoupled from `@angular/fire` — the hosting deploy is just `firebase deploy --only hosting` on the static bundle; the client SDK is orthogonal and can land incrementally.

#### 2. Cloudflare (Pages + D1 + Access)

Ties Firebase on cost ($0 on Free + Zero Trust Free 50-user cap). Beats Firebase on three points: MCP is **GA** (vs Firebase's experimental), docs ship as `llms.txt` per product (vs Firebase's HTML-only outside Genkit), and D1 is SQL (vs Firestore NoSQL) — which materially reduces v2-migration risk if the PRD's deferred admin features push toward relational shapes. Loses on Google OAuth integration: Cloudflare Access is an edge gate on the SPA rather than per-user identity in the app, which means FR-002 (director role) and FR-001 (teacher role) get distinguished outside the app rather than inside it. Workable but requires more glue than Firebase Auth's role-via-custom-claims pattern. Also: porzuca istniejący `firebase.json` na dysku.

#### 3. Netlify (+ Netlify DB + external auth)

Strong tooling: MCP stable with 43 tools, `llms.txt` GA + markdown-for-agents Edge Function (request `Accept: text/markdown` and any Netlify site returns markdown — ~80% token reduction for agents). Netlify Database (Neon-backed Postgres) reached GA 2026-04-28 — gives SQL by default. Loses on auth: no first-party Google OAuth at MVP maturity (Identity is feature-frozen as of 2026-02-19; recommended path is Auth0 partnership or BYO Firebase Auth as a client SDK). The hybrid (Netlify hosting + Netlify DB + Firebase Auth as SDK) is workable but introduces more moving parts. Free-storage cliff for Netlify DB lands 2026-07-01 — a real cost surprise on the horizon.

## Anti-Bias Cross-Check: Firebase

### Devil's Advocate — Weaknesses

1. **NoSQL ↔ relational shape mismatch.** The PRD has clear relational shapes (teacher → students, teacher → templates). Firestore forces denormalization decisions early — embed vs reference for class-label, template content, future "last-used student per template" relations. Works at MVP scale, but the PRD's v2-deferred features (admin invite UI, central report access, configurable form fields) are exactly the kind that push toward SQL.
2. **Firestore security rules are a silent footgun.** FR-005..009 require `request.auth.uid == resource.data.teacherId` consistently. Over-permissive rules don't fail loudly — they leak data quietly until a second teacher signs in. Testing rules properly needs the Firebase emulator + an explicit testing harness, not the kind of thing a 3-week after-hours brownfield window naturally builds.
3. **Spark plan daily quotas are tight.** 50K reads/day, 20K writes/day. A buggy `onSnapshot` listener that doesn't tear down on `ngOnDestroy` (and the project already has known sub-leak warnings) can churn through quotas in minutes of active use.
4. **Project ID + default Firestore database location are one-way decisions.** Project ID gets baked into `auth.callback` URLs forever. Default Firestore database location picked on first write — for Europe must be `eur3`, mistake means a brand-new database to migrate to.
5. **Firebase MCP server is experimental (May 2025).** Tool surface, names, and authentication may shift between `firebase-tools` releases during the 3-week build window.

### Pre-Mortem — How This Could Fail

The team picked Firebase because `firebase.json` was already on disk and the cost story looked perfect ($0 on Spark). The first three weeks went well: Hosting + Auth (Google) + Firestore landed for FR-001..014, template flow worked. Then the director asked for v2-deferred features earlier than planned: a central view of completed reports, an in-app teacher invite UI, and configurable form labels.

Each surfaced friction the team hadn't budgeted. The teacher invite UI needed Admin SDK from a server context → Cloud Functions → Blaze plan. The central report view required either denormalizing reports into a queryable shape or building aggregation Functions — costs trended upward. After two months, a teacher reported seeing another teacher's templates — a security-rule typo had `teacherUid` where the field was `teacherId`. The bug had been live for a month before anyone noticed because over-permissive rules don't fail loudly.

The team migrated to Postgres in month five. The Auth migration alone took three weeks of evenings because Firebase Auth UIDs don't map to anything else without coordinated migration.

### Unknown Unknowns

- **`firebase.json` on disk has `public: "dist/browser"` — but Angular 19's application builder writes to `dist/britannia-reports/browser`.** This is a day-0 bug. Without updating the config, `firebase deploy --only hosting` ships an empty deploy.
- **Firestore default database location is one-way.** Pick `eur3` (Europe multi-region) on the very first write — changing requires creating a new database and migrating.
- **Spark plan blocks outbound HTTP from Cloud Functions.** Any external API call from Functions (email notifications, webhooks to the director) requires Blaze. Not just a cost issue — a feature gate.
- **`@angular/fire@19` examples default to standalone-component idioms.** This codebase is NgModule-based. Providers (`provideFirebaseApp`, `provideAuth`, `provideFirestore`) go in `AppModule.providers`, not in a `bootstrapApplication` config. Agent-generated code from `@angular/fire` docs will produce standalone snippets that need manual translation to NgModule.
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
| `firebase.json` `public: "dist/browser"` doesn't match Angular 19 app builder output (`dist/britannia-reports/browser`) — first deploy ships empty | Unknown unknowns | H | H | Day 0: edit `firebase.json` `"public"` to `dist/britannia-reports/browser`. Verify locally with `firebase emulators:start` before any real deploy. |
| Firestore default DB location picked wrong (not `eur3`) — one-way decision | Unknown unknowns | M | H | Explicit step in setup: create Firestore database via `firebase init firestore` and choose `eur3` (Europe multi-region). Document choice in `infrastructure.md` after first run. |
| Firestore security rules silently over-permissive — data leakage between teachers (FR-005..009) | Devil's advocate, Pre-mortem | M | H | Adopt rules-testing harness (`@firebase/rules-unit-testing` + emulator) BEFORE first Firestore deploy. Write per-FR rule test: teacher A cannot read teacher B's students/templates. Tests in `*.rules.spec.ts`. |
| Spark plan daily quotas exhausted by leaky `onSnapshot` listeners (50K reads / 20K writes per day) | Devil's advocate | M | M | Enforce existing `OnDestroy` cleanup convention (CLAUDE.md mentions `takeUntil`/`async`/`destroyRef`). Add a `@firebase/firestore` listener wrapper that warns at dev-time when more than N listeners are active. Set up Firebase usage alerts in Console. |
| v2-deferred features push toward SQL — Firestore → Postgres migration during MVP+6mo | Pre-mortem | M | H | Document v1 schema in `infrastructure.md` so the v2 migration starts from a known state. Defer migration decision until v2 features have firm requirements; don't pre-migrate. |
| Firebase MCP server experimental — tool surface may change mid-build | Devil's advocate | M | L | Treat MCP tools as nice-to-have, not load-bearing. CLI commands (`firebase deploy`, `firebase firestore:*`) are GA and the authoritative path for the 3-week window. |
| `@angular/fire@19` examples default to standalone — codebase is NgModule | Unknown unknowns | M | L | Document the NgModule provider pattern (`AppModule.providers: [provideFirebaseApp(...), provideAuth(...), provideFirestore(...)]`) in `src/CLAUDE.md` when @angular/fire lands. Reject agent-generated standalone snippets. |
| Firebase project ID is irreversible | Unknown unknowns | L | M | Pick the ID once with deliberate naming (`britannia-reports-prod`, `britannia-reports-dev`). Document the choice and the auth domain it produces. |
| Spark blocks outbound HTTP from Cloud Functions — blocks email/webhooks | Unknown unknowns | L (no Functions in MVP scope) | M | Stay on Spark for MVP. When Functions land (post-MVP), explicitly budget Blaze and acknowledge cost shift. |
| `firebase deploy` has no native pre-deploy validation that the bundle actually loaded — silent empty deploys possible if path is wrong | Devil's advocate | L (after first fix) | M | After `ng build`, run `ls dist/britannia-reports/browser/index.html` as a pre-deploy check. Wire into CI when M1L5 lands. |

## Getting Started

These steps assume Angular 19's application builder (already in use here) and the existing `firebase.json` + `.firebaserc` on disk.

1. **Fix the `firebase.json` publish path (day 0).** Open `firebase.json`. Change `"public": "dist/browser"` to `"public": "dist/britannia-reports/browser"`. Verify locally: `npm run build && firebase emulators:start --only hosting` and confirm `http://localhost:5000` serves the app (not 404 / empty).

2. **Create the Firebase project (if not already done) and pick the Firestore location.** In the Firebase Console, create the project (or confirm `.firebaserc` points at the right one). Then `firebase init firestore` — **at the location prompt, choose `eur3`** (Europe multi-region). This is one-way for the default database.

3. **Enable Authentication providers.** In Firebase Console → Authentication → Sign-in method, enable **Google** provider. Add the production auth domain + any preview-channel domains to "Authorized domains".

4. **Install `@angular/fire@19` and wire it into `AppModule`.** `npm install @angular/fire@^19 firebase`. In `src/app/app.module.ts`, add to `providers: []`:

   ```typescript
   provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
   provideAuth(() => getAuth()),
   provideFirestore(() => getFirestore()),
   ```

   Do NOT migrate `AppModule` to standalone — the rest of the codebase is NgModule-based.

5. **Write security rules and a rules-testing harness BEFORE the first Firestore write.** Create `firestore.rules` with per-collection `request.auth.uid == resource.data.teacherId` rules for `students` and `templates`. Install `@firebase/rules-unit-testing`; add `*.rules.spec.ts` files covering: teacher A reads/writes only own data, teacher B blocked from A's data, unauthenticated user blocked from everything. Run against the emulator before any deploy.

## Out of Scope

The following were not evaluated in this research:

- Docker image configuration (Firebase is serverless — no containers in this stack).
- CI/CD pipeline setup (M1L5 territory). When CI lands, the recommended target is GitHub Actions running `npm ci && npm run build && firebase deploy --only hosting --token "$FIREBASE_TOKEN"` on push to `master`.
- Production-scale architecture: multi-region failover, SLA commitments, Firestore at >50K MAU, Functions beyond Spark — all out of scope for MVP and absent from the PRD.
- Cost projections beyond MVP. The Spark plan covers single-school usage with 2–3 orders of magnitude headroom; Blaze transition cost is a v2 question.
