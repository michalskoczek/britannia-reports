---
status: superseded
superseded_by: context/foundation/infrastructure.md
superseded_at: 2026-07-10
researched_at: 2026-05-25
session_limit_hit_at: ~17:00 Europe/Warsaw
session_resets_at: 2026-05-25T17:40+02:00
completed_platforms: [cloudflare, vercel, fly-io]
pending_platforms: [netlify, railway, render, firebase]
context_type: mvp
hard_constraints:
  language: TypeScript
  framework: Angular 19 (NgModule, SPA, output dist/britannia-reports/browser)
  needs_backend: true  # FR-005, FR-009 — persistent store for students + templates
  needs_oauth: true    # FR-001..004 — Google sign-in
  must_preserve_url: true  # PRD Constraints & Compatibility
interview_answers:
  q1_persistent_connections: "No (inferred from PRD — no WebSockets / streaming / workers)"
  q2_cost_vs_dx: "Don't know / roughly equal"
  q3_familiarity: "Firebase (firebase.json + .firebaserc on disk)"
  q4_geographic_reach: "Single region (inferred from PRD — single-tenant Britannia school in PL)"
  q5_co_location: "Co-location preferred"
---

# Partial Infra Research — Britannia Reports

> ⚠️ **Superseded by `context/foundation/infrastructure.md` (2026-07-10). Do not act on this file.**
> It is retained only as a record of the interrupted research run. Its `hard_constraints` are wrong on two counts, both corrected in `infrastructure.md`:
> - **Framework** is Angular **20.3, fully standalone** — not "Angular 19 (NgModule)". There is no `AppModule` in this repo.
> - **Build output** is `dist/browser` — not `dist/britannia-reports/browser`. Any deploy command below that names the latter path (e.g. the Cloudflare Pages `wrangler pages deploy` line) would publish an empty directory.
>
> The platform decision has been made: **Firebase Hosting**, already live at https://britannia-reports.web.app.

Three of seven platform subagents returned full research before the session limit kicked in at ~17:00 Europe/Warsaw. The remaining four (Netlify, Railway, Render, Firebase) hit the limit and returned empty payloads. Firebase is the critical missing one — it's the project's currently-configured deploy target (`firebase.json` + `.firebaserc` on disk).

**Continuation plan.** After session reset at 17:40, re-invoke `/10x-infra-research`. The skill (or its operator) should:

1. Read this file and skip re-research on Cloudflare, Vercel, Fly.io — their summaries are below, dated 2026-05-25.
2. Spawn four subagents for Netlify, Railway, Render, Firebase using the same prompt template as the first run (see prompts in conversation history of session that wrote this file).
3. Merge and proceed to scoring (Step 3), anti-bias cross-check (Step 4), and write `context/foundation/infrastructure.md` (Step 5).

---

## Cloudflare (Pages + D1 + Access) — completed 2026-05-25

**Verdict:** Strong fit for this MVP.

- **SPA hosting (GA):** Cloudflare Pages serves Angular 19 production build (`dist/britannia-reports/browser`). SPA fallback via `src/_redirects` with `/* /index.html 200` (include in `angular.json` assets). Free tier: unlimited bandwidth, 500 builds/month, 20k files, 25 MiB/file, 100 custom domains.
- **CLI (Wrangler, GA):** `npx wrangler pages deploy dist/britannia-reports/browser`; rollback via dashboard or `wrangler rollback [VERSION_ID]`; logs via `wrangler tail` (Workers) or Pages Functions logs in dashboard.
- **Docs:** publishes `llms.txt` / `llms-full.txt` per product (e.g. `developers.cloudflare.com/pages/llms.txt`) — agent-friendly.
- **Cost at this scale:** $0. Static assets unmetered; Workers/Pages Functions Free = 100k req/day; D1 Free = 5M reads, 100k writes, 5GB/day; Zero Trust Free = 50 users.
- **Auth:** Cloudflare Access + Google IdP on Zero Trust Free (50 users, plenty for one school). Edge-side gate before the SPA loads. Alternative: keep Firebase Auth or wire Google OAuth into a Worker.
- **Database:** D1 (SQLite, GA since 2024-04-01) — right shape for "dozens of records, low writes". Read Replication is Beta (Apr 2025); not needed at this scale.
- **MCP:** Official Cloudflare MCP at `https://mcp.cloudflare.com/mcp` — OAuth, production-ready, covers API/Workers/Docs/Observability.
- **Risks for register:** D1 Read Replication beta; Zero Trust Free 50-user cap (ceiling if school grows); Pages Functions invalidate `_redirects` on their routes; D1 daily limits enforced since 2025-02-10 (well within scope).

Sources: developers.cloudflare.com/pages/framework-guides/deploy-an-angular-site/, /pages/platform/limits/, /pages/configuration/redirects/, /d1/platform/pricing/, /workers/wrangler/commands/, /cloudflare-one/integrations/identity-providers/google/, /agents/model-context-protocol/mcp-servers-for-cloudflare/.

---

## Vercel + Neon — completed 2026-05-25

**Verdict:** OK fit, but Hobby plan is non-commercial → school must pay Pro $20/user/mo.

- **SPA hosting (GA):** Auto-detects Angular; build `npm run build`; output `dist/<project>/browser` auto-filled for Angular 17+. SPA routing requires `vercel.json` rewrites `{ "source": "/(.*)", "destination": "/index.html" }`.
- **CLI (GA):** `vercel deploy`, `vercel --prod`, `vercel rollback [url]` (Hobby restricted to previous prod deploy only), `vercel logs --follow` (5-min stream cap).
- **Hobby plan (GA, non-commercial only):** 100 GB bandwidth, 1M edge requests, 1M function invocations, 4 CPU-hrs. **A language school is commercial — Hobby violates fair-use; budget Pro ~$20/mo.**
- **Docs:** No canonical `llms.txt`; MCP `search_vercel_documentation` tool provides programmatic access.
- **Auth:** No first-party auth. Integrate Firebase Auth, Clerk, Auth0, or Auth.js.
- **Database:** Vercel Postgres **sunset** (migrated to Neon Dec 2024). Vercel KV **sunset** (use Upstash Redis). Vercel **Blob = Beta** (2026-02-27 plan table). Neon Free tier suits <100 MB easily.
- **MCP:** Vercel MCP at `https://mcp.vercel.com` — **Beta** (2026-05-25), OAuth, supported in Claude Code (`claude mcp add --transport http vercel ...`). Public Beta Agreement applies.
- **WebSockets:** not supported.
- **Risks for register:** Hobby = non-commercial; Vercel MCP Beta; Vercel Blob Beta; no first-party auth; Angular is supported but not as first-class as Next.js; Hobby has no overage — hitting a limit pauses deployment.

Sources: vercel.com/kb/guide/deploying-angular-with-vercel, /solutions/angular, /docs/project-configuration/vercel-json, /docs/cli/rollback, /docs/cli/logs, /docs/plans/hobby, /pricing, /docs/marketplace-storage, neon.com/docs/guides/vercel-postgres-transition-guide, vercel.com/docs/agent-resources/vercel-mcp.

---

## Fly.io — completed 2026-05-25

**Verdict:** Overkill for a tiny static SPA + thin API. Capable but oversized.

- **SPA hosting:** Container-based; needs Dockerfile (`nginx:alpine`, copy `dist/` to `/usr/share/nginx/html`). Adds container build/registry overhead vs purpose-built static hosts.
- **CLI (`flyctl`, GA):** `fly launch`, `fly deploy`, `fly logs` (streaming + `--no-tail`, `-r` region, `-i` instance), `fly releases`. **No native rollback** — pattern is `fly releases --image` then `fly deploy --image=<older>`.
- **Pricing (2026-05-25):** **No free tier, no Hobby plan since Oct 2024.** New users get 2 VM-hours OR 7-day trial. Credit card required. `shared-cpu-1x` 256MB = $2.02/mo (Amsterdam); Volumes $0.15/GB-mo; dedicated IPv4 $2/mo. **Realistic floor: ~$7-10/mo.**
- **Auth:** No first-party. Bring Firebase Auth / Auth0 / Clerk.
- **Database:** Fly Managed Postgres (MPG) — GA with documented gaps, **min $38/mo Basic** + $0.28/GB storage. Wildly oversized for <100 MB. Better fits: external Supabase/Neon free tier or SQLite on a Fly Volume.
- **MCP:** `fly mcp server` — **experimental** (2026-05-25). `fly mcp launch` auto-configures Claude/Cursor/VS Code/Zed.
- **Risks for register:** Container pipeline + Dockerfile + nginx config + IPv4 cost + MPG min $38/mo all add up; Fly's strength (persistent processes, global Machines) is unused here.

Sources: fly.io/docs/about/pricing/, /docs/languages-and-frameworks/static/, /docs/mpg/, /docs/postgres/, /docs/flyctl/mcp-server/, /docs/blueprints/rollback-guide/, /docs/flyctl/logs/, saaspricepulse.com/tools/flyio.

---

## To re-spawn after session reset

Same prompt structure as the first run. Headlines:

- **Netlify** — focus: SPA hosting + `_redirects` fallback; Netlify CLI; free tier limits; Netlify Identity status; Netlify MCP Server status (was beta/GA — verify); auth via Identity vs external; DB strictly external (Supabase/Neon/Fauna/PlanetScale).
- **Railway** — focus: container-based SPA hosting; no free tier since 2023 — current minimum; Railway Postgres pricing; Railway CLI; MCP status; auth strictly external.
- **Render** — focus: Render Static Sites free; CLI status (Render historically dashboard-heavy); Render Postgres pricing; auth strictly external; MCP status.
- **Firebase Hosting + Auth + Firestore** — focus: existing `firebase.json` on disk maps correctly to current Angular 19 application builder output (`dist/britannia-reports/browser`); Spark plan free limits for Hosting + Auth + Firestore; Blaze plan cost estimate at <5k req/day; `@angular/fire@19` GA status + install steps for existing NgModule project; whether Hosting deploys can stay decoupled from `@angular/fire` (yes — hosting is independent of how the client talks to Auth/Firestore); Firebase MCP server status in 2025-2026.
