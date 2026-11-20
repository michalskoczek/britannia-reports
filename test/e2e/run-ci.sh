#!/usr/bin/env bash
# CI entry point for the e2e suite. Runs inside `firebase emulators:exec`, so the Auth and
# Firestore emulators are already up and are torn down when this script exits.
#
# Starts the dev server (development configuration → useEmulators: true), waits for it,
# creates the signed-in session headlessly, then runs the suite.
set -euo pipefail

LOG="${RUNNER_TEMP:-/tmp}/ng-serve.log"  # outside test/e2e/.output, which Playwright empties on start
npx ng serve --port 4200 > "$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 90); do
  if curl -fs -o /dev/null http://localhost:4200; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "ng serve exited early:" >&2
    cat "$LOG" >&2
    exit 1
  fi
  sleep 2
done
curl -fs -o /dev/null http://localhost:4200 || { echo "dev server never answered" >&2; cat "$LOG" >&2; exit 1; }

node test/e2e/ci-session.mjs
npx playwright test
