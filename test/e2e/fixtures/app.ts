import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test as base, expect, Page } from '@playwright/test';

import { environment } from '../../../src/environments/environment';

// `__dirname`, not `import.meta.url`: Playwright transpiles specs to CommonJS.
const REPO_ROOT = join(__dirname, '..', '..', '..');

/** Written by `npm run e2e:auth:save`. See `test/e2e/auth-session.mjs`. */
const SESSION_FILE = join(REPO_ROOT, 'test', 'e2e', '.auth', 'firebase-session.json');

/**
 * Ports come from `firebase.json` rather than from constants here, so a port
 * change in one place cannot leave this suite talking to nothing.
 */
const firebaseJson = JSON.parse(readFileSync(join(REPO_ROOT, 'firebase.json'), 'utf8'));
const FIRESTORE_ORIGIN = `http://localhost:${firebaseJson.emulators.firestore.port}`;
const AUTH_ORIGIN = `http://localhost:${firebaseJson.emulators.auth.port}`;
const DOCUMENTS = `${FIRESTORE_ORIGIN}/v1/projects/${environment.firebase.projectId}/databases/(default)/documents`;

/** One row of `firebaseLocalStorageDb` — the shape `auth-session.mjs` saves. */
interface SessionRow {
  fbase_key: string;
  value: { uid: string; email: string };
}

/**
 * A student the test is free to create, identified by a string that exists
 * nowhere else — in this run, in the developer's own roster, or in a parallel
 * one. The name is what the report prints and what the downloaded file is named
 * after, so a unique name is also how the test proves *its* data reached the
 * PDF rather than a leftover from a previous run.
 */
export interface TestStudent {
  studentName: string;
  name: string;
}

/**
 * Reads the saved emulator session, or explains how to make one.
 *
 * Sign-in is a Google popup and cannot be scripted, which is why this suite
 * borrows a session captured by hand once instead of authenticating per run.
 */
function readSession(): SessionRow[] {
  try {
    return JSON.parse(readFileSync(SESSION_FILE, 'utf8')) as SessionRow[];
  } catch {
    throw new Error(
      `No signed-in session at ${SESSION_FILE}.\n` +
        'Run `npx playwright-cli open http://localhost:4200`, sign in with an allowlisted ' +
        'account, then `npm run e2e:auth:save`.'
    );
  }
}

/** Fails with an instruction rather than a timeout when a process is missing. */
async function assertLocalStackIsUp(baseURL: string): Promise<void> {
  const probes: [string, string, string][] = [
    [baseURL, 'the dev server', 'npm start'],
    [`${AUTH_ORIGIN}/`, 'the Auth emulator', 'npm run emulators'],
    [`${DOCUMENTS}/users`, 'the Firestore emulator', 'npm run emulators'],
  ];

  for (const [url, what, command] of probes) {
    try {
      await fetch(url, { headers: { Authorization: 'Bearer owner' } });
    } catch {
      throw new Error(`${what} is not answering at ${url} — start it with \`${command}\`.`);
    }
  }
}

/**
 * The roster as the emulator holds it, reached over the Firestore REST API as
 * `owner` — deliberately not through the UI.
 *
 * Cleanup that runs through the app can only clean up when the app works, which
 * is the one thing a failing test has just disproved. Going straight at the
 * store keeps teardown independent of whatever broke.
 */
class Roster {
  constructor(private readonly uid: string) {}

  private get collection(): string {
    return `${DOCUMENTS}/users/${this.uid}/students`;
  }

  /** Every document whose identity carries exactly this name. */
  public async findByName(studentName: string): Promise<string[]> {
    const response = await fetch(this.collection, {
      headers: { Authorization: 'Bearer owner' },
    });

    if (response.status === 404) {
      return [];
    }

    const body = (await response.json()) as { documents?: { name: string; fields?: any }[] };

    return (body.documents ?? [])
      .filter((document) => document.fields?.identity?.mapValue?.fields?.studentName?.stringValue === studentName)
      .map((document) => document.name);
  }

  public async deleteByName(studentName: string): Promise<void> {
    for (const name of await this.findByName(studentName)) {
      await fetch(`${FIRESTORE_ORIGIN}/v1/${name}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer owner' },
      });
    }
  }
}

/**
 * Puts the saved session into IndexedDB and reloads.
 *
 * The Firebase Web SDK keeps its session in IndexedDB, which Playwright's
 * `storageState` does not carry — so this is a page-level seed rather than a
 * context option. It runs after a first navigation because IndexedDB is
 * per-origin: there is no origin to write into until the page has loaded one.
 */
async function signIn(page: Page): Promise<void> {
  await page.goto('/');

  await page.evaluate(async (rows: SessionRow[]) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('firebaseLocalStorageDb');
      request.onupgradeneeded = () =>
        request.result.createObjectStore('firebaseLocalStorage', { keyPath: 'fbase_key' });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('firebaseLocalStorage', 'readwrite');
      const store = transaction.objectStore('firebaseLocalStorage');
      rows.forEach((row) => store.put(row));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }, readSession());

  await page.goto('/');
}

export const test = base.extend<{
  localStack: void;
  signedIn: Page;
  roster: Roster;
  student: TestStudent;
  uncaughtErrors: string[];
}>({
  /** Auto: every test in this suite needs both processes, none of them starts one. */
  localStack: [
    async ({ baseURL }, use) => {
      await assertLocalStackIsUp(baseURL ?? 'http://localhost:4200');
      await use();
    },
    { auto: true },
  ],

  // Playwright reads the destructuring pattern to work out a fixture's
  // dependencies; `{}` is how it is told there are none.
  // eslint-disable-next-line no-empty-pattern
  roster: async ({}, use) => {
    await use(new Roster(readSession()[0].value.uid));
  },

  /**
   * A unique student, deleted from the store when the test ends — passing,
   * failing, or timing out.
   *
   * Teardown deletes by name rather than by the id the UI produced, so a run
   * that died between "the document was written" and "the test learned its id"
   * still cleans up after itself.
   */
  student: async ({ roster }, use, testInfo) => {
    const stamp = `${Date.now().toString(36)}-${testInfo.workerIndex}`;
    const student: TestStudent = { studentName: `E2E Kowalska ${stamp}`, name: 'Zosia' };

    await use(student);

    await roster.deleteByName(student.studentName);
    expect(await roster.findByName(student.studentName), 'teardown left a test student behind in the roster').toEqual(
      []
    );
  },

  /** Uncaught exceptions seen by the browser, collected for the test to assert on. */
  uncaughtErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error: Error) => errors.push(error.message));
    await use(errors);
  },

  signedIn: async ({ page }, use) => {
    await signIn(page);
    await use(page);
  },
});

export { expect };
