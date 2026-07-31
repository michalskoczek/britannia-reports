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

/** Whoever holds a Google account but was never seeded into `allowedUsers`. */
const OUTSIDER = 'uid-outsider';

const EMAIL_A = 'teacher.a@britannia.example';
const EMAIL_B = 'teacher.b@britannia.example';
const EMAIL_OUTSIDER = 'random.person@gmail.example';

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

/**
 * A signed-in caller carrying the token claims the rules actually read.
 *
 * `authenticatedContext(uid)` alone leaves `request.auth.token.email` undefined,
 * which every rule keyed on the allowlist would (correctly) deny. The app's real
 * tokens always carry both claims — Google issues them — so a test without them
 * would be testing a caller that cannot exist.
 */
const teacher = (uid, email, emailVerified = true) =>
  testEnv.authenticatedContext(uid, { email, email_verified: emailVerified }).firestore();

/** Writes A's template past the rules, so denial tests have something to be denied. */
const seedTemplateForA = () =>
  testEnv.withSecurityRulesDisabled((context) =>
    setDoc(templateRef(context.firestore(), TEACHER_A), TEMPLATE_DOCUMENT),
  );

/**
 * Puts an address on the allowlist, the way the runbook does through the Console.
 *
 * Document id is the lowercased address — `docs/teacher-allowlist-runbook.md` is
 * what keeps that true in production, and `isAllowlisted()` in `firestore.rules`
 * lowercases the token side to match.
 */
const seedAllowlist = (email) =>
  testEnv.withSecurityRulesDisabled((context) =>
    setDoc(doc(context.firestore(), 'allowedUsers', email.toLowerCase()), { role: 'teacher' }),
  );

/** The ordinary starting point: both teachers are on the allowlist. */
const seedBothTeachers = () => Promise.all([seedAllowlist(EMAIL_A), seedAllowlist(EMAIL_B)]);

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
    await seedAllowlist(EMAIL_A);

    await assertSucceeds(
      setDoc(templateRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A), TEMPLATE_DOCUMENT),
    );
  });

  it('reads their own template', async () => {
    await seedAllowlist(EMAIL_A);
    await seedTemplateForA();

    await assertSucceeds(getDoc(templateRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A)));
  });

  it('deletes their own template', async () => {
    await seedAllowlist(EMAIL_A);
    await seedTemplateForA();

    await assertSucceeds(deleteDoc(templateRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A)));
  });

  it('is recognised whatever case the address is signed in with', async () => {
    // The allowlist document id is lowercase by runbook; the token is whatever
    // Google sends. `isAllowlisted()` lowercases the token side to bridge them.
    await seedAllowlist(EMAIL_A);

    await assertSucceeds(
      setDoc(templateRef(teacher(TEACHER_A, EMAIL_A.toUpperCase()), TEACHER_A), TEMPLATE_DOCUMENT),
    );
  });

  it('cannot update an existing template — the write-once invariant', async () => {
    await seedAllowlist(EMAIL_A);
    await seedTemplateForA();

    await assertFails(
      updateDoc(templateRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A), { name: 'Renamed' }),
    );
  });

  it('cannot overwrite an existing template with a fresh save — duplicate names', async () => {
    await seedAllowlist(EMAIL_A);
    await seedTemplateForA();

    // `setDoc` over an existing document is an update in rules terms, which is
    // what makes "the normalized name is the document id" enforce uniqueness.
    await assertFails(
      setDoc(templateRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A), TEMPLATE_DOCUMENT),
    );
  });
});

describe('reportTemplates — another teacher', () => {
  // B is deliberately allowlisted throughout: these assertions are about path
  // ownership, and they would be worthless if B were denied for being an
  // outsider instead.
  it('cannot read teacher A’s template', async () => {
    await seedBothTeachers();
    await seedTemplateForA();

    await assertFails(getDoc(templateRef(teacher(TEACHER_B, EMAIL_B), TEACHER_A)));
  });

  it('cannot create a document under teacher A’s uid', async () => {
    await seedBothTeachers();

    await assertFails(
      setDoc(templateRef(teacher(TEACHER_B, EMAIL_B), TEACHER_A), TEMPLATE_DOCUMENT),
    );
  });

  it('cannot delete teacher A’s template', async () => {
    await seedBothTeachers();
    await seedTemplateForA();

    await assertFails(deleteDoc(templateRef(teacher(TEACHER_B, EMAIL_B), TEACHER_A)));
  });
});

/**
 * The gap this suite exists to close, raised as F1 in the Phase 1 review and
 * fixed on 2026-07-31.
 *
 * Every caller here is a fully signed-in Google account operating on its OWN
 * subtree — the case `request.auth.uid == uid` happily allows. What denies them
 * is `isAllowlisted()`, and nothing else. If someone ever removes that call,
 * these four are the tests that fail.
 */
describe('reportTemplates — a signed-in account that is not on the allowlist', () => {
  it('cannot create a template under its own uid', async () => {
    await assertFails(
      setDoc(
        templateRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER),
        TEMPLATE_DOCUMENT,
      ),
    );
  });

  it('cannot read a template under its own uid', async () => {
    await assertFails(getDoc(templateRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER)));
  });

  it('cannot delete a template under its own uid', async () => {
    await testEnv.withSecurityRulesDisabled((context) =>
      setDoc(templateRef(context.firestore(), OUTSIDER), TEMPLATE_DOCUMENT),
    );

    await assertFails(deleteDoc(templateRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER)));
  });

  it('is denied even once the allowlist holds a DIFFERENT address', async () => {
    // Guards against an `exists()` that accidentally tests the collection rather
    // than the caller's own document.
    await seedAllowlist(EMAIL_A);

    await assertFails(
      setDoc(
        templateRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER),
        TEMPLATE_DOCUMENT,
      ),
    );
  });
});

describe('reportTemplates — an allowlisted address with an unverified email', () => {
  it('is denied, matching the hardening on the allowlist rule itself', async () => {
    await seedAllowlist(EMAIL_A);

    await assertFails(
      setDoc(
        templateRef(teacher(TEACHER_A, EMAIL_A, false), TEACHER_A),
        TEMPLATE_DOCUMENT,
      ),
    );
  });
});

describe('reportTemplates — an unauthenticated caller', () => {
  it('cannot read a template', async () => {
    await seedBothTeachers();
    await seedTemplateForA();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(templateRef(firestore, TEACHER_A)));
  });

  it('cannot create a template', async () => {
    await seedBothTeachers();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(setDoc(templateRef(firestore, TEACHER_A), TEMPLATE_DOCUMENT));
  });

  it('cannot delete a template', async () => {
    await seedBothTeachers();
    await seedTemplateForA();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(deleteDoc(templateRef(firestore, TEACHER_A)));
  });
});
