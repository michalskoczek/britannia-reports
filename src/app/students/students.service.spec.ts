import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionService } from '../auth/session.service';
import { SessionState } from '../model/auth.interface';
import { Student, StudentIdentity } from '../model/student.interface';
import { Sex } from '../shared/enum/sex.enum';
import { STUDENT_IDENTITY_DEFAULTS, STUDENT_IDENTITY_DOMAIN, STUDENT_SCHEMA_VERSION } from './student-domain';
import { StoredStudent, StudentsGateway } from './students.gateway';
import { StudentsResult, StudentsService } from './students.service';

/**
 * The decisions this service makes are the ones a teacher notices — "this row is
 * missing a name", "your colleague's roster is not yours", "the edit did not go
 * through" — and every one of them is testable without Firebase, which is the
 * reason `StudentsGateway` exists.
 *
 * The fakes model the unobliging cases on purpose: a `list` that rejects, an
 * `update` denied by the rules, a session that is not authorized.
 * `context/foundation/infrastructure.md` records that `S-01`'s three
 * browser-only defects all lived in the gap between an agreeable fake and
 * Firebase.
 */
describe('StudentsService', () => {
  const UID = 'firebase-uid-anna';

  /** A Firestore `Timestamp` is duck-typed by the service: `toDate()` is all it reads. */
  const timestamp = (iso: string): { toDate: () => Date } => ({ toDate: () => new Date(iso) });

  const firebaseError = (code: string): Error => Object.assign(new Error(code), { code });

  const identity = (overrides: Partial<StudentIdentity> = {}): StudentIdentity => ({
    ...STUDENT_IDENTITY_DEFAULTS,
    studentName: 'Jan Kowalski',
    sex: Sex.MALE,
    ...overrides,
  });

  const storedIdentity = (studentName: string): StoredStudent => ({
    id: studentName.toLowerCase().replace(/\s/g, '-'),
    data: { identity: { ...identity(), studentName } },
  });

  const names = (service: StudentsService): string[] =>
    service.students().map((student: Student) => student.identity.studentName);

  let sessionState: WritableSignal<SessionState>;
  let gateway: { list: jasmine.Spy; create: jasmine.Spy; update: jasmine.Spy; remove: jasmine.Spy };

  const createService = (): StudentsService => TestBed.inject(StudentsService);

  beforeEach(() => {
    sessionState = signal<SessionState>({
      status: 'authorized',
      uid: UID,
      email: 'anna.kowalska@britannia.pl',
      role: 'teacher',
    });

    gateway = {
      list: jasmine.createSpy('list').and.resolveTo([]),
      create: jasmine.createSpy('create').and.resolveTo('generated-id'),
      update: jasmine.createSpy('update').and.resolveTo(),
      remove: jasmine.createSpy('remove').and.resolveTo(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: StudentsGateway, useValue: gateway },
        { provide: SessionService, useValue: { state: sessionState } },
      ],
    });
  });

  describe('validate', () => {
    it('accepts a student carrying a name and a sex', () => {
      expect(createService().validate(identity())).toBeNull();
    });

    it('rejects a name that is empty after trimming', () => {
      expect(createService().validate(identity({ studentName: '   ' }))).toBe('name-required');
    });

    it('rejects a name longer than 80 characters', () => {
      const service: StudentsService = createService();

      expect(service.validate(identity({ studentName: 'x'.repeat(81) }))).toBe('name-too-long');
      expect(service.validate(identity({ studentName: 'x'.repeat(80) }))).toBeNull();
    });

    it('rejects a student with no sex chosen, because the PDF wording depends on it', () => {
      expect(createService().validate(identity({ sex: null }))).toBe('sex-required');
    });

    it('accepts a student with no short name and no class — both are optional', () => {
      expect(createService().validate(identity({ name: null, class: null }))).toBeNull();
    });
  });

  describe('load', () => {
    it('refuses when nobody is signed in, without reaching the gateway', async () => {
      sessionState.set({ status: 'anonymous' });

      const result: StudentsResult<readonly Student[]> = await createService().load();

      expect(result).toEqual({ ok: false, failure: 'not-signed-in' });
      expect(gateway.list).not.toHaveBeenCalled();
    });

    it('reads the signed-in uid, sorts by name, and exposes the list', async () => {
      gateway.list.and.resolveTo([
        { id: 'b', data: { identity: identity({ studentName: 'Zofia Wrona' }), createdAt: timestamp('2026-07-01') } },
        { id: 'a', data: { identity: identity({ studentName: 'Adam Nowak' }), createdAt: timestamp('2026-07-02') } },
      ] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      const result = await service.load();

      expect(gateway.list).toHaveBeenCalledWith(UID);
      expect(result.ok).toBeTrue();
      expect(names(service)).toEqual(['Adam Nowak', 'Zofia Wrona']);
      expect(service.students()[0].createdAt).toEqual(new Date('2026-07-02'));
    });

    it('sorts with Polish collation rather than by code point', async () => {
      gateway.list.and.resolveTo([
        storedIdentity('Zenon Adamski'),
        storedIdentity('Łukasz Bąk'),
        storedIdentity('Marta Cis'),
      ] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      await service.load();

      // `Ł` sorts after `L` and before `M` in Polish; by code point it would land
      // past `Z`.
      expect(names(service)).toEqual(['Łukasz Bąk', 'Marta Cis', 'Zenon Adamski']);
    });

    it('treats a key the document lacks as that key`s default and drops one the domain does not know', async () => {
      gateway.list.and.resolveTo([
        {
          id: 'stary',
          data: {
            // Written before the roster stored a class, and carrying a field no
            // version of it ever had.
            identity: { studentName: 'Jan Kowalski', sex: Sex.MALE, nickname: 'ignore me' },
          },
        },
      ] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      await service.load();

      const loaded: StudentIdentity = service.students()[0].identity;

      expect(loaded.studentName).toBe('Jan Kowalski');
      expect(loaded.class).toBeNull();
      expect(loaded.name).toBeNull();
      expect(Object.keys(loaded).sort()).toEqual([...STUDENT_IDENTITY_DOMAIN].sort());
    });

    it('survives a document whose name is not a string, rather than throwing during the sort', async () => {
      gateway.list.and.resolveTo([
        { id: 'broken', data: { identity: { studentName: 42, sex: Sex.MALE } } },
        storedIdentity('Adam Nowak'),
      ] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      const result = await service.load();

      expect(result.ok).toBeTrue();
      expect(names(service)).toEqual(['', 'Adam Nowak']);
    });

    it('reads a document with no identity map at all as an empty student', async () => {
      gateway.list.and.resolveTo([{ id: 'empty', data: {} }] satisfies StoredStudent[]);

      const service: StudentsService = createService();

      expect((await service.load()).ok).toBeTrue();
      expect(service.students()[0].identity).toEqual({ ...STUDENT_IDENTITY_DEFAULTS });
    });

    it('maps a rejected read to a failure instead of throwing, and leaves the list alone', async () => {
      spyOn(console, 'error');
      gateway.list.and.resolveTo([storedIdentity('Adam Nowak')] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      await service.load();

      gateway.list.and.rejectWith(firebaseError('unavailable'));

      expect(await service.load()).toEqual({ ok: false, failure: 'offline' });
      expect(service.students().length).toBe(1);
      expect(console.error).toHaveBeenCalled();
    });

    it('maps a denied read to `permission-denied`, namespaced code included', async () => {
      spyOn(console, 'error');
      gateway.list.and.rejectWith(firebaseError('firestore/permission-denied'));

      expect(await createService().load()).toEqual({ ok: false, failure: 'permission-denied' });
    });

    it('maps an error carrying no code to `unknown`', async () => {
      spyOn(console, 'error');
      gateway.list.and.rejectWith(new Error('boom'));

      expect(await createService().load()).toEqual({ ok: false, failure: 'unknown' });
    });

    it('hides a roster loaded for a different uid', async () => {
      gateway.list.and.resolveTo([storedIdentity('Adam Nowak')] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      await service.load();
      expect(service.students().length).toBe(1);

      // Two Google accounts in one browser is the ordinary case; one teacher's
      // children must not appear on another teacher's screen.
      sessionState.set({ status: 'authorized', uid: 'firebase-uid-tomasz', email: 't@britannia.pl', role: 'teacher' });

      expect(service.students()).toEqual([]);
    });
  });

  describe('hasFreshRoster', () => {
    it('is false before the first load and true after it', async () => {
      const service: StudentsService = createService();
      expect(service.hasFreshRoster()).toBeFalse();

      await service.load();

      expect(service.hasFreshRoster()).toBeTrue();
    });

    it('is true after a load that found no students', async () => {
      gateway.list.and.resolveTo([]);

      const service: StudentsService = createService();
      await service.load();

      // The saving matters most here: without it, the teacher who has not added
      // anyone yet pays a read on every single visit.
      expect(service.hasFreshRoster()).toBeTrue();
    });

    it('stays false when the load failed', async () => {
      spyOn(console, 'error');
      gateway.list.and.rejectWith(firebaseError('unavailable'));

      const service: StudentsService = createService();
      await service.load();

      expect(service.hasFreshRoster()).toBeFalse();
    });

    it('is false again once a different teacher is signed in', async () => {
      const service: StudentsService = createService();
      await service.load();

      sessionState.set({ status: 'authorized', uid: 'firebase-uid-tomasz', email: 't@britannia.pl', role: 'teacher' });

      expect(service.hasFreshRoster()).toBeFalse();
    });
  });

  describe('create', () => {
    it('writes the schema version and the trimmed identity, and keeps the list sorted', async () => {
      gateway.list.and.resolveTo([storedIdentity('Zofia Wrona')] satisfies StoredStudent[]);
      gateway.create.and.resolveTo('new-id');

      const service: StudentsService = createService();
      await service.load();

      const result = await service.create({
        identity: identity({ studentName: '  Adam   Nowak ', name: '  Adaś  ', class: 'Klasa 5 szkoły podstawowej' }),
      });

      expect(result.ok).toBeTrue();
      expect(gateway.create).toHaveBeenCalledWith(UID, {
        schemaVersion: STUDENT_SCHEMA_VERSION,
        identity: {
          studentName: 'Adam   Nowak',
          name: 'Adaś',
          sex: Sex.MALE,
          class: 'Klasa 5 szkoły podstawowej',
        },
      });
      expect(names(service)).toEqual(['Adam   Nowak', 'Zofia Wrona']);
      expect(service.students()[0].id).toBe('new-id');
    });

    it('stores an emptied optional field as absent rather than as an empty string', async () => {
      await createService().create({ identity: identity({ name: '   ', class: '' }) });

      const written = gateway.create.calls.mostRecent().args[1] as { identity: StudentIdentity };

      expect(written.identity.name).toBeNull();
      expect(written.identity.class).toBeNull();
    });

    it('refuses when nobody is signed in, without reaching the gateway', async () => {
      sessionState.set({ status: 'denied', reason: 'not-allowlisted' });

      expect(await createService().create({ identity: identity() })).toEqual({
        ok: false,
        failure: 'not-signed-in',
      });
      expect(gateway.create).not.toHaveBeenCalled();
    });

    it('never reaches the gateway with an unstorable student', async () => {
      const service: StudentsService = createService();

      expect(await service.create({ identity: identity({ studentName: '  ' }) })).toEqual({
        ok: false,
        failure: 'name-required',
      });
      expect(await service.create({ identity: identity({ sex: null }) })).toEqual({
        ok: false,
        failure: 'sex-required',
      });
      expect(gateway.create).not.toHaveBeenCalled();
    });

    it('surfaces a denied write as a failure and does not add the student to the list', async () => {
      spyOn(console, 'error');
      gateway.create.and.rejectWith(firebaseError('permission-denied'));

      const service: StudentsService = createService();

      expect(await service.create({ identity: identity() })).toEqual({
        ok: false,
        failure: 'permission-denied',
      });
      expect(service.students()).toEqual([]);
    });

    it('drops a key the domain does not know rather than writing it to the document', async () => {
      await createService().create({
        identity: { ...identity(), avgMark: '5' } as StudentIdentity,
      });

      const written = gateway.create.calls.mostRecent().args[1] as { identity: Record<string, unknown> };

      expect(Object.keys(written.identity).sort()).toEqual([...STUDENT_IDENTITY_DOMAIN].sort());
      expect(written.identity['avgMark']).toBeUndefined();
    });
  });

  describe('update', () => {
    it('replaces the identity under the signed-in uid and re-sorts the list', async () => {
      gateway.list.and.resolveTo([
        { id: 'a', data: { identity: identity({ studentName: 'Adam Nowak' }), createdAt: timestamp('2026-07-02') } },
        storedIdentity('Marta Cis'),
      ] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      await service.load();

      const result = await service.update('a', { identity: identity({ studentName: 'Zenon Nowak' }) });

      expect(result.ok).toBeTrue();
      // The version travels with the identity it describes — an edit rewrites
      // both, so a document cannot end up stamped with a schema it no longer has.
      expect(gateway.update).toHaveBeenCalledWith(UID, 'a', {
        schemaVersion: STUDENT_SCHEMA_VERSION,
        identity: {
          studentName: 'Zenon Nowak',
          name: null,
          sex: Sex.MALE,
          class: null,
        },
      });
      expect(names(service)).toEqual(['Marta Cis', 'Zenon Nowak']);
    });

    it('keeps the creation timestamp the edit could not have known', async () => {
      gateway.list.and.resolveTo([
        { id: 'a', data: { identity: identity({ studentName: 'Adam Nowak' }), createdAt: timestamp('2026-07-02') } },
      ] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      await service.load();
      await service.update('a', { identity: identity({ studentName: 'Adam Nowicki' }) });

      expect(service.students()[0].createdAt).toEqual(new Date('2026-07-02'));
    });

    it('never reaches the gateway with an unstorable student', async () => {
      const service: StudentsService = createService();

      expect(await service.update('a', { identity: identity({ studentName: '' }) })).toEqual({
        ok: false,
        failure: 'name-required',
      });
      expect(gateway.update).not.toHaveBeenCalled();
    });

    it('leaves the listed student untouched when the write is denied', async () => {
      spyOn(console, 'error');
      gateway.list.and.resolveTo([storedIdentity('Adam Nowak')] satisfies StoredStudent[]);
      gateway.update.and.rejectWith(firebaseError('permission-denied'));

      const service: StudentsService = createService();
      await service.load();

      expect(await service.update('adam-nowak', { identity: identity({ studentName: 'Ktoś Inny' }) })).toEqual({
        ok: false,
        failure: 'permission-denied',
      });
      expect(names(service)).toEqual(['Adam Nowak']);
    });

    it('refuses when nobody is signed in', async () => {
      sessionState.set({ status: 'resolving' });

      expect(await createService().update('a', { identity: identity() })).toEqual({
        ok: false,
        failure: 'not-signed-in',
      });
      expect(gateway.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes under the signed-in uid and drops the student from the list', async () => {
      gateway.list.and.resolveTo([
        storedIdentity('Adam Nowak'),
        storedIdentity('Marta Cis'),
      ] satisfies StoredStudent[]);

      const service: StudentsService = createService();
      await service.load();

      expect(await service.remove('adam-nowak')).toEqual({ ok: true, value: undefined });
      expect(gateway.remove).toHaveBeenCalledWith(UID, 'adam-nowak');
      expect(names(service)).toEqual(['Marta Cis']);
    });

    it('keeps the student in the list when the delete is rejected', async () => {
      spyOn(console, 'error');
      gateway.list.and.resolveTo([storedIdentity('Adam Nowak')] satisfies StoredStudent[]);
      gateway.remove.and.rejectWith(firebaseError('unavailable'));

      const service: StudentsService = createService();
      await service.load();

      expect(await service.remove('adam-nowak')).toEqual({ ok: false, failure: 'offline' });
      expect(service.students().length).toBe(1);
    });

    it('refuses when nobody is signed in', async () => {
      sessionState.set({ status: 'resolving' });

      expect(await createService().remove('adam-nowak')).toEqual({ ok: false, failure: 'not-signed-in' });
      expect(gateway.remove).not.toHaveBeenCalled();
    });
  });
});
