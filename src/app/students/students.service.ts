import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { SessionService } from '../auth/session.service';
import { SessionState } from '../model/auth.interface';
import { Student, StudentDocument, StudentDraft, StudentIdentity } from '../model/student.interface';
import { STUDENT_IDENTITY_DEFAULTS, STUDENT_IDENTITY_DOMAIN, STUDENT_SCHEMA_VERSION } from './student-domain';
import { StoredStudent, StudentsGateway } from './students.gateway';

/**
 * Why an operation did not happen.
 *
 * A closed set rather than a Firebase error, so the roster can pick a message
 * without inspecting SDK error codes — and so a new failure mode has to be named
 * here before it can reach the UI as "something went wrong".
 */
export type StudentsFailure =
  | 'not-signed-in'
  | 'name-required'
  | 'name-too-long'
  | 'sex-required'
  | 'permission-denied'
  | 'offline'
  | 'unknown';

/**
 * Outcomes are returned, not thrown.
 *
 * Every call site here is a user action with a message attached to it, and a
 * rejected promise makes "show the right message" the caller's problem to
 * remember. This makes it the compiler's.
 */
export type StudentsResult<T> = { ok: true; value: T } | { ok: false; failure: StudentsFailure };

/**
 * Long enough for a double-barrelled surname, short enough that the list stays
 * readable. A cap exists at all because an unbounded string is a document a
 * teacher cannot see the end of, not because Firestore needs one — unlike a
 * template name, this one is never a document id.
 */
export const STUDENT_NAME_MAX_LENGTH = 80;

/**
 * Every decision about the student roster: what makes a student storable, what
 * the list holds, and how a stored document is read back.
 *
 * The Firebase SDK is not reachable from here — `StudentsGateway` holds all of
 * it — which is what lets this file be driven with a fake in
 * `students.service.spec.ts`. `S-01` shipped three defects that a green suite
 * missed because its fakes were more agreeable than Firebase; the spec here
 * models the rejections deliberately.
 */
@Injectable({ providedIn: 'root' })
export class StudentsService {
  private readonly gateway: StudentsGateway = inject(StudentsGateway);
  private readonly session: SessionService = inject(SessionService);

  private readonly loaded: WritableSignal<readonly Student[]> = signal<readonly Student[]>([]);

  /** Whose list `loaded` holds. `null` before the first successful load. */
  private readonly loadedFor: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * The teacher's students, as of the last successful `load()`.
   *
   * Gated on the uid it was loaded for. Two Google accounts in one browser is
   * the ordinary case here — the header shows the address for exactly that
   * reason — and a roster surviving that transition would put one teacher's
   * children on another teacher's screen. This is the cheapest place to make
   * that impossible.
   */
  public readonly students: Signal<readonly Student[]> = computed<readonly Student[]>(() => {
    const uid: string | null = this.currentUid();

    return uid !== null && uid === this.loadedFor() ? this.loaded() : [];
  });

  /**
   * `null` when the student can be stored.
   *
   * Only two of the four fields are checked, and that is the product rule rather
   * than an oversight: FR-005 requires a name, the report form requires a sex to
   * pick its gendered wording, and both `name` and `class` are genuinely
   * optional. There is no uniqueness check — two children may share a name, and
   * auto-ids make that representable.
   */
  public validate(identity: StudentIdentity): StudentsFailure | null {
    const trimmed: string = (identity.studentName ?? '').trim();

    if (trimmed.length === 0) {
      return 'name-required';
    }

    if (trimmed.length > STUDENT_NAME_MAX_LENGTH) {
      return 'name-too-long';
    }

    if (identity.sex === null || identity.sex === undefined) {
      return 'sex-required';
    }

    return null;
  }

  /** Replaces the cached list on success; leaves it untouched on failure. */
  public async load(): Promise<StudentsResult<readonly Student[]>> {
    const uid: string | null = this.currentUid();

    if (uid === null) {
      return { ok: false, failure: 'not-signed-in' };
    }

    let stored: StoredStudent[];

    try {
      stored = await this.gateway.list(uid);
    } catch (error: unknown) {
      return this.fail('Listing students failed', error);
    }

    const students: readonly Student[] = stored
      .map((document: StoredStudent) => this.toStudent(document))
      .sort(byName);

    this.loaded.set(students);
    this.loadedFor.set(uid);

    return { ok: true, value: students };
  }

  public async create(draft: StudentDraft): Promise<StudentsResult<Student>> {
    const uid: string | null = this.currentUid();

    if (uid === null) {
      return { ok: false, failure: 'not-signed-in' };
    }

    const identity: StudentIdentity = this.normalizeForWrite(draft.identity);
    const failure: StudentsFailure | null = this.validate(identity);

    if (failure !== null) {
      return { ok: false, failure };
    }

    const document: Omit<StudentDocument, 'createdAt' | 'updatedAt'> = {
      schemaVersion: STUDENT_SCHEMA_VERSION,
      identity,
    };

    let id: string;

    try {
      id = await this.gateway.create(uid, document);
    } catch (error: unknown) {
      return this.fail('Adding a student failed', error);
    }

    const created: Student = {
      id,
      identity,
      // The server timestamp is not readable without re-reading the document,
      // and nothing in the UI needs it. It arrives on the next `load()`.
      createdAt: null,
    };

    this.loaded.set([...this.students(), created].sort(byName));
    this.loadedFor.set(uid);

    return { ok: true, value: created };
  }

  /**
   * Replaces a student's four fields.
   *
   * A student not in the cached list leaves the list untouched — the only way to
   * reach this method is the Edit button on a listed row, so that case means the
   * list moved underneath the form rather than that something needs inserting.
   */
  public async update(studentId: string, draft: StudentDraft): Promise<StudentsResult<Student>> {
    const uid: string | null = this.currentUid();

    if (uid === null) {
      return { ok: false, failure: 'not-signed-in' };
    }

    const identity: StudentIdentity = this.normalizeForWrite(draft.identity);
    const failure: StudentsFailure | null = this.validate(identity);

    if (failure !== null) {
      return { ok: false, failure };
    }

    try {
      await this.gateway.update(uid, studentId, identity);
    } catch (error: unknown) {
      return this.fail('Editing a student failed', error);
    }

    const updated: Student = {
      id: studentId,
      identity,
      createdAt: this.students().find((student: Student) => student.id === studentId)?.createdAt ?? null,
    };

    this.loaded.set(
      this.students()
        .map((student: Student) => (student.id === studentId ? updated : student))
        .sort(byName),
    );

    return { ok: true, value: updated };
  }

  public async remove(studentId: string): Promise<StudentsResult<void>> {
    const uid: string | null = this.currentUid();

    if (uid === null) {
      return { ok: false, failure: 'not-signed-in' };
    }

    try {
      await this.gateway.remove(uid, studentId);
    } catch (error: unknown) {
      return this.fail('Deleting a student failed', error);
    }

    this.loaded.set(this.students().filter((student: Student) => student.id !== studentId));

    return { ok: true, value: undefined };
  }

  private currentUid(): string | null {
    const state: SessionState = this.session.state();

    return state.status === 'authorized' ? state.uid : null;
  }

  private fail<T>(message: string, error: unknown): StudentsResult<T> {
    console.error(message, error);

    return { ok: false, failure: classify(error) };
  }

  private toStudent(stored: StoredStudent): Student {
    return {
      id: stored.id,
      identity: this.normalizeIdentity(stored.data['identity']),
      createdAt: toDate(stored.data['createdAt']),
    };
  }

  /**
   * Reads one stored identity tolerantly.
   *
   * A key the document lacks becomes that key's default and a key the domain
   * does not know is dropped — the whole of the forward compatibility
   * `schemaVersion: 1` promises.
   *
   * `studentName` is the one field coerced rather than kept verbatim: the list
   * sorts on it with `localeCompare` and renders it as the row's label, so a
   * document carrying a number or a `null` there would throw during a sort
   * instead of showing one odd row.
   */
  private normalizeIdentity(raw: unknown): StudentIdentity {
    const source: Record<string, unknown> = isRecord(raw) ? raw : {};
    const identity: StudentIdentity = { ...STUDENT_IDENTITY_DEFAULTS };

    for (const field of STUDENT_IDENTITY_DOMAIN) {
      const value: unknown = source[field];

      // `undefined` is the only "absent": a stored `null` is a real value here,
      // and three of these four fields default to exactly that.
      if (value !== undefined) {
        // The domain constant guarantees `field` indexes `identity`. What the
        // stored value's *type* is remains the schema's promise, not something
        // TypeScript can check across a Firestore round-trip.
        (identity as Record<keyof StudentIdentity, unknown>)[field] = value;
      }
    }

    if (typeof identity.studentName !== 'string') {
      identity.studentName = STUDENT_IDENTITY_DEFAULTS.studentName;
    }

    return identity;
  }

  /**
   * What actually gets written: trimmed, and reduced to the four known keys.
   *
   * Normalizing on the way out as well as on the way in means a caller handing
   * over an object with an extra key cannot write one into the document.
   */
  private normalizeForWrite(identity: StudentIdentity): StudentIdentity {
    const normalized: StudentIdentity = this.normalizeIdentity(identity);

    return {
      ...normalized,
      studentName: normalized.studentName.trim(),
      name: blankToNull(normalized.name),
      class: blankToNull(normalized.class),
    };
  }
}

/** Polish collation, because that is what the names are written in. */
const byName = (a: Student, b: Student): number =>
  a.identity.studentName.localeCompare(b.identity.studentName, 'pl');

/** An emptied optional text field is absent, not an empty string. */
const blankToNull = (value: string | null): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed: string = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Duck-typed rather than `instanceof Timestamp`.
 *
 * Importing the SDK's `Timestamp` here would put `@angular/fire` back inside the
 * service the gateway exists to keep it out of, and would make every fake in the
 * spec construct a real Firestore type to be believed.
 */
const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }

  if (isRecord(value) && typeof value['toDate'] === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  return null;
};

/**
 * Firebase error codes arrive either bare (`permission-denied`) or namespaced
 * (`firestore/permission-denied`) depending on which layer raised them.
 */
const classify = (error: unknown): StudentsFailure => {
  if (!isRecord(error) || typeof error['code'] !== 'string') {
    return 'unknown';
  }

  const code: string = error['code'].split('/').pop() ?? '';

  if (code === 'permission-denied') {
    return 'permission-denied';
  }

  if (code === 'unavailable') {
    return 'offline';
  }

  return 'unknown';
};
