---
applyTo: "angular.json,firebase.json,.firebaserc,.github/workflows/**,package.json"
---

# Build output, deploys and CI

Source: `src/CLAUDE.md` §Common commands and §Conventions, `context/deployment/deploy-plan.md`.

When reviewing a change to these files:

- `angular.json` `outputPath.base: "dist"` and `firebase.json` `hosting.public: "dist/browser"` are
  coupled. Changing one without the other in the same commit is **blocking**: `firebase deploy`
  then publishes an empty directory over the live site and exits 0.
- Production deploys only from `master`; `develop` is the integration branch and PR target.
  A workflow that deploys live from any other branch is **blocking**.
- Rules deploy before hosting. Deploys run only from `deploy-staging.yml` (push to `develop` →
  `britannia-reports-staging`) and `deploy-production.yml` (push to `master` → `britannia-reports`),
  each with its own environment-scoped service account; a workflow deploying to the other
  project, or production without the `refs/heads/master` guard, is **blocking**.
- Workflows that run with secrets on `pull_request_target` or `workflow_run` must not check out
  and execute code from forks or from non-owner PRs.
- No new dependency without an explicit request in the issue or PR; the Angular set
  (`@angular/*`, `@angular/cli`, `angular-eslint`) moves together as one unit.
- `firebase-tools` is installed globally (locally and in CI), not as a project dependency.
- Merging stays human. The ruleset requires 0 approvals (solo owner), so the Claude GitHub App
  could merge a green PR through the API — only `--allowedTools` stops it. Adding `gh` merge
  rights (`Bash(gh:*)`, `Bash(gh pr merge*)`, `Bash(gh api*)`) to any Claude workflow's
  `--allowedTools` is **blocking**, as is adding the app to the ruleset's bypass list.
- The `@claude` and review workflows must keep their owner-only guards
  (`author_association == 'OWNER'`, same-repo + owner actor on `workflow_run`); the repo is public
  and the jobs spend the owner's Claude subscription.
