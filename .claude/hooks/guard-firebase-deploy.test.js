// Tests for the PreToolUse deploy guard. Run: node --test .claude/hooks/
// The command strings are assembled at runtime so that running this file is never itself a
// command line the guard would read as a deploy.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const { productionDeploySegments } = require('./guard-firebase-deploy');

const fb = ['fire', 'base'].join('');
const isProduction = (command) => productionDeploySegments(command).length > 0;

test('deploys without a staging target count as production', () => {
  for (const command of [
    `npx ${fb} deploy --only hosting`,
    `cd x && ${fb}.cmd deploy`,
    `npx ${fb} deploy --only firestore:rules`,
    `npx ${fb} deploy --only hosting --project britannia-reports`,
    `${fb} deploy --project staging-old`,
    `${fb} deploy --project stagingx`,
  ]) {
    assert.equal(isProduction(command), true, command);
  }
});

test('deploys that name only the staging project are not production', () => {
  for (const command of [
    `npx ${fb} deploy --only hosting --project staging`,
    `npx ${fb} deploy --only firestore:rules -P staging`,
    `${fb} deploy --project=britannia-reports-staging --only hosting`,
    `${fb} deploy --project "staging"`,
  ]) {
    assert.equal(isProduction(command), false, command);
  }
});

test('a staging deploy cannot carry a production deploy through any separator', () => {
  for (const separator of [' && ', ' & ', '; ', ' || ', ' | ', '\n']) {
    const command = `${fb} deploy --project staging${separator}${fb} deploy --only hosting`;
    assert.equal(isProduction(command), true, JSON.stringify(separator));
  }
});

test('a staging flag inside a message or next to a production flag does not count', () => {
  assert.equal(isProduction(`${fb} deploy -m "--project staging"`), true);
  assert.equal(isProduction(`${fb} deploy --message '--project staging'`), true);
  assert.equal(isProduction(`${fb} deploy --project staging --project britannia-reports`), true);
});

test('previews, builds and look-alike words are not deploys', () => {
  for (const command of [`npx ${fb} hosting:channel:deploy pr-1`, 'npm run build', `${fb} deployment-notes`]) {
    assert.equal(isProduction(command), false, command);
  }
});

test('the hook fails closed on a payload it cannot read', () => {
  const hook = path.join(__dirname, 'guard-firebase-deploy.js');
  const result = spawnSync(process.execPath, [hook], { input: 'not json', encoding: 'utf8' });
  assert.match(result.stdout, /"permissionDecision":"deny"/);
});

test('the hook stays silent on a command that deploys nothing', () => {
  const hook = path.join(__dirname, 'guard-firebase-deploy.js');
  const payload = JSON.stringify({ tool_input: { command: 'npm run lint' } });
  const result = spawnSync(process.execPath, [hook], { input: payload, encoding: 'utf8' });
  assert.equal(result.stdout, '');
});
