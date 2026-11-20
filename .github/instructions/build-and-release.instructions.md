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
- Rules deploy before hosting.
- Workflows that run with secrets on `pull_request_target` or `workflow_run` must not check out
  and execute code from forks or from non-owner PRs.
- No new dependency without an explicit request in the issue or PR; the Angular set
  (`@angular/*`, `@angular/cli`, `angular-eslint`) moves together as one unit.
- `firebase-tools` is installed globally (locally and in CI), not as a project dependency.
