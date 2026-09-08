/**
 * Save and restore a signed-in Firebase session for the Playwright CLI browser.
 *
 * Why this exists: `playwright-cli state-save` writes cookies and localStorage
 * only, and the Firebase Web SDK keeps its session in IndexedDB
 * (`firebaseLocalStorageDb` → `firebaseLocalStorage`). Against this app,
 * `state-save` therefore produces an empty file and the next browser lands on
 * `/sign-in` again. This script moves that one IndexedDB record instead, so a
 * manual sign-in through the Auth emulator's Google popup is a one-time cost.
 *
 * Usage (with `npm run emulators` and `npm start` already running):
 *
 *   npx playwright-cli open http://localhost:4200   # sign in by hand, once
 *   npm run e2e:auth:save
 *
 *   npx playwright-cli open http://localhost:4200   # every session after that
 *   npm run e2e:auth:restore
 *
 * The stored access token expires after an hour, but the emulator's refresh
 * token does not, and the SDK refreshes on load — so the saved file keeps
 * working until the emulator data is wiped or the account is removed.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const STATE_FILE = join(HERE, '.auth', 'firebase-session.json');
// Spawned as a plain .js file through `node`: on Windows, spawning the
// `playwright-cli.cmd` shim directly fails with EINVAL.
const CLI_ENTRY = createRequire(import.meta.url).resolve('@playwright/cli/playwright-cli.js');

/** Runs one playwright-cli command against the already-open browser. */
function cli(...args) {
  const result = spawnSync(process.execPath, [CLI_ENTRY, ...args], { encoding: 'utf8' });

  if (result.status !== 0) {
    console.error(result.stdout ?? '');
    console.error(result.stderr ?? '');
    throw new Error(`playwright-cli ${args[0]} failed with status ${result.status}`);
  }

  return result.stdout ?? '';
}

/**
 * `eval` prints the return value as a JSON string inside a `### Result` block;
 * everything after it is the echoed Playwright code. Pull the first line back
 * out and parse it.
 */
function evalOnPage(fn) {
  const output = cli('eval', fn);
  const line = output.split('\n').find((l) => l.trim().startsWith('"'));

  if (!line) {
    throw new Error(`Could not read an eval result from playwright-cli:\n${output}`);
  }

  return JSON.parse(JSON.parse(line.trim()));
}

const READ_SESSION = `async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('firebaseLocalStorageDb');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const rows = await new Promise((resolve, reject) => {
    const request = db.transaction('firebaseLocalStorage', 'readonly')
      .objectStore('firebaseLocalStorage').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return JSON.stringify(rows);
}`;

const writeSession = (rows) => `async () => {
  const rows = ${JSON.stringify(rows)};
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('firebaseLocalStorageDb');
    request.onupgradeneeded = () =>
      request.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  await new Promise((resolve, reject) => {
    const tx = db.transaction('firebaseLocalStorage', 'readwrite');
    const store = tx.objectStore('firebaseLocalStorage');
    for (const row of rows) store.put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return JSON.stringify(rows.map((row) => row.value && row.value.email).filter(Boolean));
}`;

function save() {
  const rows = evalOnPage(READ_SESSION);

  if (rows.length === 0) {
    throw new Error('No Firebase session in the open browser — sign in first, then re-run.');
  }

  mkdirSync(dirname(STATE_FILE), { recursive: true });
  writeFileSync(STATE_FILE, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
  console.log(`Saved session for ${rows.map((row) => row.value?.email).join(', ')}`);
  console.log(`→ ${STATE_FILE}`);
}

function restore() {
  let rows;

  try {
    rows = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
  } catch {
    throw new Error(`No saved session at ${STATE_FILE} — run "npm run e2e:auth:save" first.`);
  }

  const emails = evalOnPage(writeSession(rows));
  cli('reload');
  console.log(`Restored session for ${emails.join(', ')} — the page is reloaded and signed in.`);
}

const command = process.argv[2];

if (command === 'save') {
  save();
} else if (command === 'restore') {
  restore();
} else {
  console.error('Usage: node test/e2e/auth-session.mjs <save|restore>');
  process.exit(1);
}
