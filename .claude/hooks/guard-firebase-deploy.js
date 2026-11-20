#!/usr/bin/env node
/**
 * PreToolUse hook (matcher `Bash|PowerShell`): a PRODUCTION Firebase deploy may only run from
 * `master`; deploys to the staging project (`--project staging`) are allowed from any branch.
 *
 * `firebase deploy` publishes whatever is in dist/browser and exits 0, so a deploy from the wrong
 * branch silently rolls production back. No GitHub ruleset can see this — the deploy runs from the
 * laptop — so the agent is stopped here instead. Preview channels (`hosting:channel:deploy`) do not
 * touch the live site and are allowed from any branch.
 *
 * This guards the agent's tool calls only; commands typed by hand in a terminal are not seen.
 * It matches the command text, not its meaning, so `echo firebase deploy` is blocked too —
 * a false positive is cheap, a false negative is a production rollback.
 *
 * Signal contract:
 *   stdout JSON with permissionDecision "deny" — blocked; the reason is fed back to the agent
 *   no output, exit 0 — not a live deploy, or a live deploy from master: let it run
 * Fails closed: if the payload or git cannot be read, the deploy is denied.
 */

const { execFileSync } = require('child_process');

const LIVE_DEPLOY = /\bfirebase(\.cmd)?\s+deploy\b/;
const RELEASE_BRANCH = 'master';
// Deploys to the staging project (client testbed, separate data) are allowed from any branch.
// Matched per command segment, so `deploy --project staging && deploy` cannot smuggle a
// production deploy past the check.
const STAGING_TARGET = /(?:--project|-P)(?:=|\s+)["']?(?:staging|britannia-reports-staging)["']?(?=\s|$)/;
const SEGMENT_SEPARATOR = /&&|\|\||;|\||\r?\n/;

function readStdin() {
  return new Promise((resolve, reject) => {
    let raw = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (raw += chunk));
    process.stdin.on('end', () => resolve(raw));
    process.stdin.on('error', reject);
  });
}

function currentBranch() {
  try {
    return execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
}

async function main() {
  const raw = await readStdin();
  const command = JSON.parse(raw || '{}')?.tool_input?.command ?? '';
  const productionDeploys = command
    .split(SEGMENT_SEPARATOR)
    .filter((segment) => LIVE_DEPLOY.test(segment) && !STAGING_TARGET.test(segment));
  if (productionDeploys.length === 0) return;

  const branch = currentBranch();
  if (branch === RELEASE_BRANCH) return;

  deny(
    `Production Firebase deploys run only from \`${RELEASE_BRANCH}\`; current branch is ` +
      `\`${branch || 'unknown (git failed)'}\`. Switch to ${RELEASE_BRANCH}, pull, rebuild, ` +
      'then deploy. To deploy to staging instead, pass `--project staging`; for a preview use ' +
      '`firebase hosting:channel:deploy`.',
  );
}

main().catch((error) => {
  deny(`guard-firebase-deploy failed, blocking to be safe: ${error?.message || error}`);
});
