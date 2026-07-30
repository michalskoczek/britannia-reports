/**
 * Firestore security-rules tests for `users/{uid}/reportTemplates/{templateId}`.
 *
 * Run with `npm run test:rules`, which starts the Firestore emulator through
 * `firebase emulators:exec`, runs this file with Node's built-in test runner, and
 * shuts the emulator down. A JDK must be on the machine.
 *
 * Deliberately outside `src/` and written as `.mjs`: Karma (`tsconfig.spec.json`
 * includes only `src/**\/*.spec.ts`), the TypeScript spec project, and ESLint
 * (`src/**\/*.ts`) all ignore it. `src/CLAUDE.md` pins the browser test runner to
 * Karma + Jasmine, and `@firebase/rules-unit-testing` is Node-only — keeping the
 * two apart is what lets both exist without a migration.
 *
 * This file is the reason the S-02 per-teacher rule is a checked fact rather than
 * a claim. `context/foundation/infrastructure.md` records the failure being
 * modelled: an over-permissive rule leaks silently and for a long time.
 */
import { readFileSync } from 'node:fs';
import { after, afterEach, before, describe, it } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const PROJECT_ID = 'britannia-reports';

const TEACHER_A = 'uid-teacher-a';
const TEACHER_B = 'uid-teacher-b';

const TEMPLATE_ID = 'klasa 5 semestr';

/** Shape the app actually writes — see `src/app/model/report-template.interface.ts`. */
const TEMPLATE_DOCUMENT = {
  schemaVersion: 1,
  name: 'Klasa 5 semestr',
  nameKey: 'klasa 5 semestr',
  fields: {
    reportType: 'semester',
    date: '2026-06-12',
    teachers: ['Regina Raczyńska'],
    ownEducationMaterial: '1',
    studentBookTitle: 'Prepare, level 3, wydawnictwo Cambridge',
    ownTitleStudentBook: null,
    course: 'English Emeralds 6 / A2.1',
    realizedMaterial: 'Units 1-8',
    signature: 'BRITANNIA — Regina Raczyńska',
    isExamRecommendation: true,
  },
};

let testEnv;

/** `users/{uid}/reportTemplates/{TEMPLATE_ID}` for a given caller's Firestore. */
const templateRef = (firestore, uid) =>
  doc(firestore, 'users', uid, 'reportTemplates', TEMPLATE_ID);

/** Writes A's template past the rules, so denial tests have something to be denied. */
const seedTemplateForA = () =>
  testEnv.withSecurityRulesDisabled((context) =>
    setDoc(templateRef(context.firestore(), TEACHER_A), TEMPLATE_DOCUMENT),
  );

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

after(async () => {
  await testEnv.cleanup();
});

describe('reportTemplates — the owning teacher', () => {
  it('creates a template under their own uid', async () => {
    const firestore = testEnv.authenticatedContext(TEACHER_A).firestore();

    await assertSucceeds(setDoc(templateRef(firestore, TEACHER_A), TEMPLATE_DOCUMENT));
  });

  it('reads their own template', async () => {
    await seedTemplateForA();

    const firestore = testEnv.authenticatedContext(TEACHER_A).firestore();

    await assertSucceeds(getDoc(templateRef(firestore, TEACHER_A)));
  });

  it('deletes their own template', async () => {
    await seedTemplateForA();

    const firestore = testEnv.authenticatedContext(TEACHER_A).firestore();

    await assertSucceeds(deleteDoc(templateRef(firestore, TEACHER_A)));
  });

  it('cannot update an existing template — the write-once invariant', async () => {
    await seedTemplateForA();

    const firestore = testEnv.authenticatedContext(TEACHER_A).firestore();

    await assertFails(
      updateDoc(templateRef(firestore, TEACHER_A), { name: 'Renamed' }),
    );
  });

  it('cannot overwrite an existing template with a fresh save — duplicate names', async () => {
    await seedTemplateForA();

    const firestore = testEnv.authenticatedContext(TEACHER_A).firestore();

    // `setDoc` over an existing document is an update in rules terms, which is
    // what makes "the normalized name is the document id" enforce uniqueness.
    await assertFails(setDoc(templateRef(firestore, TEACHER_A), TEMPLATE_DOCUMENT));
  });
});

describe('reportTemplates — another teacher', () => {
  it('cannot read teacher A’s template', async () => {
    await seedTemplateForA();

    const firestore = testEnv.authenticatedContext(TEACHER_B).firestore();

    await assertFails(getDoc(templateRef(firestore, TEACHER_A)));
  });

  it('cannot create a document under teacher A’s uid', async () => {
    const firestore = testEnv.authenticatedContext(TEACHER_B).firestore();

    await assertFails(setDoc(templateRef(firestore, TEACHER_A), TEMPLATE_DOCUMENT));
  });

  it('cannot delete teacher A’s template', async () => {
    await seedTemplateForA();

    const firestore = testEnv.authenticatedContext(TEACHER_B).firestore();

    await assertFails(deleteDoc(templateRef(firestore, TEACHER_A)));
  });
});

describe('reportTemplates — an unauthenticated caller', () => {
  it('cannot read a template', async () => {
    await seedTemplateForA();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(templateRef(firestore, TEACHER_A)));
  });

  it('cannot create a template', async () => {
    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(setDoc(templateRef(firestore, TEACHER_A), TEMPLATE_DOCUMENT));
  });

  it('cannot delete a template', async () => {
    await seedTemplateForA();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(deleteDoc(templateRef(firestore, TEACHER_A)));
  });
});
