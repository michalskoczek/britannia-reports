/**
 * Create the signed-in emulator session the e2e suite reads — headlessly, for CI.
 *
 * Locally the session is captured once by hand (`npm run e2e:auth:save`), because the
 * sign-in is a Google popup. Against the Auth emulator that popup is a plain HTML account
 * chooser, so it can be driven. This script:
 *
 *   1. seeds the test teacher into the `allowedUsers` allowlist in the Firestore emulator,
 *      over REST as `owner` (the rules forbid every client write to that collection);
 *   2. signs in through the app's own button and the emulator's popup;
 *   3. writes the Firebase IndexedDB rows to `test/e2e/.auth/firebase-session.json` —
 *      the exact file `test/e2e/fixtures/app.ts` reads.
 *
 * It only ever talks to localhost emulators. Requires `npm run emulators:ci` (or any
 * empty Auth + Firestore emulator) and the dev server on :4200 to be up.
 *
 * Usage: node test/e2e/ci-session.mjs [email]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
// Overridable so a local dry run cannot clobber a session captured by hand.
const STATE_FILE = process.env.E2E_SESSION_FILE ?? join(HERE, '.auth', 'firebase-session.json');

const EMAIL = (process.argv[2] ?? 'e2e.teacher@britannia.example').toLowerCase();
const APP_URL = 'http://localhost:4200';

const firebaseJson = JSON.parse(readFileSync(join(REPO_ROOT, 'firebase.json'), 'utf8'));
const projectId = JSON.parse(readFileSync(join(REPO_ROOT, '.firebaserc'), 'utf8')).projects.default;
const FIRESTORE = `http://localhost:${firebaseJson.emulators.firestore.port}`;
const DOCUMENTS = `${FIRESTORE}/v1/projects/${projectId}/databases/(default)/documents`;

async function seedAllowlist() {
  const response = await fetch(`${DOCUMENTS}/allowedUsers/${encodeURIComponent(EMAIL)}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { role: { stringValue: 'teacher' } } }),
  });

  if (!response.ok) {
    throw new Error(`Seeding allowedUsers/${EMAIL} failed: ${response.status} ${await response.text()}`);
  }
}

const READ_SESSION = async () => {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('firebaseLocalStorageDb');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return new Promise((resolve, reject) => {
    const request = db.transaction('firebaseLocalStorage', 'readonly').objectStore('firebaseLocalStorage').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

async function signIn() {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.goto(APP_URL);
    await page.waitForURL('**/sign-in');

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: /google/i }).click(),
    ]);

    // Clicking before the chooser's script has loaded leaves the account form at zero size,
    // and the email field then never becomes fillable.
    await popup.waitForLoadState();
    await popup.getByRole('button', { name: /add new account/i }).click();
    await popup.getByLabel(/email/i).fill(EMAIL);
    await popup.getByRole('button', { name: /sign in with google/i }).click();

    await page.waitForURL((url) => !url.pathname.startsWith('/sign-in'));
    const rows = await page.evaluate(READ_SESSION);

    if (!rows.length) {
      throw new Error('Signed in, but no Firebase session was found in IndexedDB.');
    }

    return rows;
  } finally {
    await browser.close();
  }
}

await seedAllowlist();
const rows = await signIn();
mkdirSync(dirname(STATE_FILE), { recursive: true });
writeFileSync(STATE_FILE, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
console.log(`Seeded and signed in ${EMAIL} → ${STATE_FILE}`);
