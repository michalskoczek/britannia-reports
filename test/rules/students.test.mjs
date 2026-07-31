/**
 * Firestore security-rules tests for `users/{uid}/students/{studentId}`.
 *
 * Run with `npm run test:rules`, which starts the Firestore emulator through
 * `firebase emulators:exec`, runs `test/rules/` with Node's built-in test runner,
 * and shuts the emulator down. A JDK must be on the machine.
 *
 * Same placement rules as `report-templates.test.mjs` — outside `src/` and
 * written as `.mjs`, so Karma, `tsconfig.spec.json` and ESLint all ignore it, and
 * `@firebase/rules-unit-testing` (Node-only) never meets the browser runner.
 *
 * This file carries one assertion the templates suite cannot: the students rule
 * is the first in `firestore.rules` that ALLOWS `update`, so "the owner may edit"
 * and "nobody else may edit" are both facts that have to be checked rather than
 * inherited from the rule above.
 */
import { readFileSync } from 'node:fs';
import { after, afterEach, before, describe, it } from 'node:test';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Deliberately NOT `britannia-reports`, which `report-templates.test.mjs` uses.
 *
 * `node --test test/rules` runs each file in its own process, in parallel,
 * against one shared emulator — and `initializeTestEnvironment` namespaces both
 * the data and the rules by project id. With a shared id the two files write to
 * one dataset, and this file's `clearFirestore()` in `afterEach` wipes the
 * allowlist the other file seeded mid-test. That surfaced immediately when this
 * suite was added: a passing templates test started failing intermittently on a
 * create that its own `seedAllowlist` had just made legal.
 *
 * The id is a namespace here, nothing more — rules are loaded per environment
 * below, so it does not have to match the real project.
 */
const PROJECT_ID = 'britannia-reports-students';

const TEACHER_A = 'uid-teacher-a';
const TEACHER_B = 'uid-teacher-b';

/** Whoever holds a Google account but was never seeded into `allowedUsers`. */
const OUTSIDER = 'uid-outsider';

const EMAIL_A = 'teacher.a@britannia.example';
const EMAIL_B = 'teacher.b@britannia.example';
const EMAIL_OUTSIDER = 'random.person@gmail.example';

/**
 * The app writes students with `addDoc`, so the real ids are auto-generated and
 * carry no meaning — unlike a template id, which IS the normalized name. A fixed
 * id here keeps the assertions readable; the rules never look at it.
 */
const STUDENT_ID = 'auto-id-student-1';

/** Shape the app actually writes — see `src/app/model/student.interface.ts`. */
const STUDENT_DOCUMENT = {
  schemaVersion: 1,
  identity: {
    studentName: 'Jan Kowalski',
    name: 'Jaś',
    sex: 'male',
    class: 'Klasa 5 szkoły podstawowej',
  },
};

/** What an edit sends: the whole identity object, never a partial merge. */
const EDITED_IDENTITY = {
  studentName: 'Jan Kowalczyk',
  name: 'Janek',
  sex: 'male',
  class: 'Klasa 6 szkoły podstawowej',
};

let testEnv;

/** `users/{uid}/students/{STUDENT_ID}` for a given caller's Firestore. */
const studentRef = (firestore, uid) => doc(firestore, 'users', uid, 'students', STUDENT_ID);

/**
 * A signed-in caller carrying the token claims the rules actually read.
 *
 * `authenticatedContext(uid)` alone leaves `request.auth.token.email` undefined,
 * which `isAllowlisted()` would (correctly) deny. Google's real tokens always
 * carry both claims, so a test without them would be testing a caller that
 * cannot exist.
 */
const teacher = (uid, email, emailVerified = true) =>
  testEnv.authenticatedContext(uid, { email, email_verified: emailVerified }).firestore();

/** Writes A's student past the rules, so denial tests have something to be denied. */
const seedStudentForA = () =>
  testEnv.withSecurityRulesDisabled((context) =>
    setDoc(studentRef(context.firestore(), TEACHER_A), STUDENT_DOCUMENT),
  );

/** Puts an address on the allowlist, the way the runbook does through the Console. */
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

describe('students — the owning teacher', () => {
  it('creates a student under their own uid', async () => {
    await seedAllowlist(EMAIL_A);

    await assertSucceeds(setDoc(studentRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A), STUDENT_DOCUMENT));
  });

  it('reads their own student', async () => {
    await seedAllowlist(EMAIL_A);
    await seedStudentForA();

    await assertSucceeds(getDoc(studentRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A)));
  });

  it('updates their own student — the FR-007 capability templates do not have', async () => {
    await seedAllowlist(EMAIL_A);
    await seedStudentForA();

    await assertSucceeds(
      updateDoc(studentRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A), { identity: EDITED_IDENTITY }),
    );
  });

  it('deletes their own student', async () => {
    await seedAllowlist(EMAIL_A);
    await seedStudentForA();

    await assertSucceeds(deleteDoc(studentRef(teacher(TEACHER_A, EMAIL_A), TEACHER_A)));
  });

  it('is recognised whatever case the address is signed in with', async () => {
    // The allowlist document id is lowercase by runbook; the token is whatever
    // Google sends. `isAllowlisted()` lowercases the token side to bridge them.
    await seedAllowlist(EMAIL_A);

    await assertSucceeds(
      setDoc(studentRef(teacher(TEACHER_A, EMAIL_A.toUpperCase()), TEACHER_A), STUDENT_DOCUMENT),
    );
  });
});

describe('students — another teacher', () => {
  // B is deliberately allowlisted throughout: these assertions are about path
  // ownership, and they would be worthless if B were denied for being an
  // outsider instead.
  it('cannot read teacher A’s student', async () => {
    await seedBothTeachers();
    await seedStudentForA();

    await assertFails(getDoc(studentRef(teacher(TEACHER_B, EMAIL_B), TEACHER_A)));
  });

  it('cannot create a student under teacher A’s uid', async () => {
    await seedBothTeachers();

    await assertFails(setDoc(studentRef(teacher(TEACHER_B, EMAIL_B), TEACHER_A), STUDENT_DOCUMENT));
  });

  it('cannot update teacher A’s student', async () => {
    await seedBothTeachers();
    await seedStudentForA();

    await assertFails(
      updateDoc(studentRef(teacher(TEACHER_B, EMAIL_B), TEACHER_A), { identity: EDITED_IDENTITY }),
    );
  });

  it('cannot delete teacher A’s student', async () => {
    await seedBothTeachers();
    await seedStudentForA();

    await assertFails(deleteDoc(studentRef(teacher(TEACHER_B, EMAIL_B), TEACHER_A)));
  });
});

/**
 * Every caller here is a fully signed-in Google account operating on its OWN
 * subtree — the case `request.auth.uid == uid` happily allows. What denies them
 * is `isAllowlisted()`, and nothing else. If someone removes that call, these are
 * the tests that fail.
 */
describe('students — a signed-in account that is not on the allowlist', () => {
  it('cannot create a student under its own uid', async () => {
    await assertFails(
      setDoc(studentRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER), STUDENT_DOCUMENT),
    );
  });

  it('cannot read a student under its own uid', async () => {
    await assertFails(getDoc(studentRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER)));
  });

  it('cannot update a student under its own uid', async () => {
    await testEnv.withSecurityRulesDisabled((context) =>
      setDoc(studentRef(context.firestore(), OUTSIDER), STUDENT_DOCUMENT),
    );

    await assertFails(
      updateDoc(studentRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER), { identity: EDITED_IDENTITY }),
    );
  });

  it('cannot delete a student under its own uid', async () => {
    await testEnv.withSecurityRulesDisabled((context) =>
      setDoc(studentRef(context.firestore(), OUTSIDER), STUDENT_DOCUMENT),
    );

    await assertFails(deleteDoc(studentRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER)));
  });

  it('is denied even once the allowlist holds a DIFFERENT address', async () => {
    // Guards against an `exists()` that accidentally tests the collection rather
    // than the caller's own document.
    await seedAllowlist(EMAIL_A);

    await assertFails(
      setDoc(studentRef(teacher(OUTSIDER, EMAIL_OUTSIDER), OUTSIDER), STUDENT_DOCUMENT),
    );
  });
});

describe('students — an allowlisted address with an unverified email', () => {
  it('is denied, matching the hardening on the allowlist rule itself', async () => {
    await seedAllowlist(EMAIL_A);

    await assertFails(
      setDoc(studentRef(teacher(TEACHER_A, EMAIL_A, false), TEACHER_A), STUDENT_DOCUMENT),
    );
  });
});

describe('students — an unauthenticated caller', () => {
  it('cannot read a student', async () => {
    await seedBothTeachers();
    await seedStudentForA();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(getDoc(studentRef(firestore, TEACHER_A)));
  });

  it('cannot create a student', async () => {
    await seedBothTeachers();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(setDoc(studentRef(firestore, TEACHER_A), STUDENT_DOCUMENT));
  });

  it('cannot update a student', async () => {
    await seedBothTeachers();
    await seedStudentForA();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(updateDoc(studentRef(firestore, TEACHER_A), { identity: EDITED_IDENTITY }));
  });

  it('cannot delete a student', async () => {
    await seedBothTeachers();
    await seedStudentForA();

    const firestore = testEnv.unauthenticatedContext().firestore();

    await assertFails(deleteDoc(studentRef(firestore, TEACHER_A)));
  });
});
