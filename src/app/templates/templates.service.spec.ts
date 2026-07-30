import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionService } from '../auth/session.service';
import { SessionState } from '../model/auth.interface';
import { ReportTemplate, ReportTemplateFields, TemplateField } from '../model/report-template.interface';
import { ReportType } from '../shared/enum/report-type.enum';
import { TEMPLATE_DOMAIN, TEMPLATE_DOMAIN_DEFAULTS, TEMPLATE_SCHEMA_VERSION } from './template-domain';
import { StoredTemplate, TemplatesGateway } from './templates.gateway';
import { TemplateApplyDiff, TemplatesFailure, TemplatesResult, TemplatesService } from './templates.service';

/**
 * The decisions this service makes are where the product's correctness lives —
 * "that name is taken", "this template is empty so applying it does nothing",
 * "confirming will clear the paragraph you just typed" — and every one of them is
 * testable without Firebase, which is the reason `TemplatesGateway` exists.
 *
 * The fakes deliberately model the unobliging cases: a `list` that rejects, a
 * `create` rejected with `permission-denied`, a session that is not authorized.
 * `context/foundation/infrastructure.md` records that `S-01`'s three
 * browser-only defects all lived in the gap between an agreeable fake and
 * Firebase.
 */
describe('TemplatesService', () => {
  const UID = 'firebase-uid-anna';

  /** A Firestore `Timestamp` is duck-typed by the service: `toDate()` is all it reads. */
  const timestamp = (iso: string): { toDate: () => Date } => ({ toDate: () => new Date(iso) });

  const firebaseError = (code: string): Error => Object.assign(new Error(code), { code });

  const fields = (overrides: Partial<ReportTemplateFields> = {}): ReportTemplateFields => ({
    ...TEMPLATE_DOMAIN_DEFAULTS,
    ...overrides,
  });

  let sessionState: WritableSignal<SessionState>;
  let gateway: { list: jasmine.Spy; create: jasmine.Spy; remove: jasmine.Spy };

  const createService = (): TemplatesService => TestBed.inject(TemplatesService);

  beforeEach(() => {
    sessionState = signal<SessionState>({
      status: 'authorized',
      uid: UID,
      email: 'anna.kowalska@britannia.pl',
      role: 'teacher',
    });

    gateway = {
      list: jasmine.createSpy('list').and.resolveTo([]),
      create: jasmine.createSpy('create').and.resolveTo(),
      remove: jasmine.createSpy('remove').and.resolveTo(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: TemplatesGateway, useValue: gateway },
        { provide: SessionService, useValue: { state: sessionState } },
      ],
    });
  });

  describe('the domain constant', () => {
    it('names every field the defaults declare, and no other', () => {
      expect(Object.keys(TEMPLATE_DOMAIN_DEFAULTS).sort()).toEqual([...TEMPLATE_DOMAIN].sort());
    });
  });

  describe('nameKey', () => {
    it('folds case and collapses whitespace into one key', () => {
      const service: TemplatesService = createService();

      expect(service.nameKey('Klasa 5 semestr')).toBe('klasa 5 semestr');
      expect(service.nameKey('  KLASA   5    SEMESTR  ')).toBe('klasa 5 semestr');
      expect(service.nameKey('klasa 5 semestr')).toBe(service.nameKey('Klasa  5  Semestr'));
    });
  });

  describe('validateName', () => {
    it('accepts an ordinary name', () => {
      expect(createService().validateName('Klasa 5 semestr')).toBeNull();
    });

    it('rejects a name that is empty after trimming', () => {
      expect(createService().validateName('   ')).toBe('name-required');
    });

    it('rejects a name longer than 60 characters', () => {
      expect(createService().validateName('x'.repeat(61))).toBe('name-too-long');
      expect(createService().validateName('x'.repeat(60))).toBeNull();
    });

    it('rejects the characters Firestore cannot put in a document id', () => {
      const service: TemplatesService = createService();

      expect(service.validateName('Klasa 5/6')).toBe('name-invalid');
      expect(service.validateName('__internal')).toBe('name-invalid');
      expect(service.validateName('.')).toBe('name-invalid');
      expect(service.validateName('..')).toBe('name-invalid');
    });
  });

  describe('load', () => {
    it('refuses when nobody is signed in, without reaching the gateway', async () => {
      sessionState.set({ status: 'anonymous' });

      const result: TemplatesResult<readonly ReportTemplate[]> = await createService().load();

      expect(result).toEqual({ ok: false, failure: 'not-signed-in' });
      expect(gateway.list).not.toHaveBeenCalled();
    });

    it('reads the signed-in uid, sorts by name, and exposes the list', async () => {
      gateway.list.and.resolveTo([
        { id: 'klasa 6', data: { name: 'Klasa 6', fields: fields({ course: 'B1' }), createdAt: timestamp('2026-07-01') } },
        { id: 'klasa 5', data: { name: 'Klasa 5', fields: fields({ course: 'A2' }), createdAt: timestamp('2026-07-02') } },
      ] satisfies StoredTemplate[]);

      const service: TemplatesService = createService();
      const result = await service.load();

      expect(gateway.list).toHaveBeenCalledWith(UID);
      expect(result.ok).toBeTrue();
      expect(service.templates().map((template: ReportTemplate) => template.name)).toEqual(['Klasa 5', 'Klasa 6']);
      expect(service.templates()[0].fields.course).toBe('A2');
      expect(service.templates()[0].createdAt).toEqual(new Date('2026-07-02'));
    });

    it('treats a key the document lacks as that key`s default and drops one the domain does not know', async () => {
      gateway.list.and.resolveTo([
        {
          id: 'stary szablon',
          data: {
            name: 'Stary szablon',
            // Saved before the domain included `signature`, and carrying a field
            // a later slice removed. Both have to survive as a usable template.
            fields: { course: 'A1', unknownFuture: 'ignore me' },
          },
        },
      ] satisfies StoredTemplate[]);

      const service: TemplatesService = createService();
      await service.load();

      const loaded: ReportTemplateFields = service.templates()[0].fields;

      expect(loaded.course).toBe('A1');
      expect(loaded.signature).toBeNull();
      expect(loaded.reportType).toBe(ReportType.TRIMESTER);
      expect(Object.keys(loaded).sort()).toEqual([...TEMPLATE_DOMAIN].sort());
    });

    it('keeps `ownEducationMaterial` verbatim rather than coercing its string/boolean mix', async () => {
      gateway.list.and.resolveTo([
        { id: 'z listy', data: { name: 'Z listy', fields: { ownEducationMaterial: '1' } } },
        { id: 'wlasne', data: { name: 'Własne', fields: { ownEducationMaterial: true } } },
      ] satisfies StoredTemplate[]);

      const service: TemplatesService = createService();
      await service.load();

      const byId = (id: string): ReportTemplate =>
        service.templates().find((template: ReportTemplate) => template.id === id)!;

      expect(byId('z listy').fields.ownEducationMaterial).toBe('1');
      expect(byId('wlasne').fields.ownEducationMaterial).toBe(true);
    });

    it('falls back to the document id when the stored name is missing', async () => {
      gateway.list.and.resolveTo([{ id: 'klasa 5', data: { fields: {} } }] satisfies StoredTemplate[]);

      const service: TemplatesService = createService();
      await service.load();

      expect(service.templates()[0].name).toBe('klasa 5');
    });

    it('maps a rejected read to a failure instead of throwing, and leaves the list alone', async () => {
      spyOn(console, 'error');
      gateway.list.and.resolveTo([{ id: 'klasa 5', data: { name: 'Klasa 5', fields: {} } }] satisfies StoredTemplate[]);

      const service: TemplatesService = createService();
      await service.load();

      gateway.list.and.rejectWith(firebaseError('unavailable'));

      const result = await service.load();

      expect(result).toEqual({ ok: false, failure: 'offline' });
      expect(service.templates().length).toBe(1);
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

    it('hides a list loaded for a different uid', async () => {
      gateway.list.and.resolveTo([{ id: 'klasa 5', data: { name: 'Klasa 5', fields: {} } }] satisfies StoredTemplate[]);

      const service: TemplatesService = createService();
      await service.load();
      expect(service.templates().length).toBe(1);

      // A second teacher in the same tab must not inherit the first one's names —
      // they drive the duplicate-name decision, not just the display.
      sessionState.set({ status: 'authorized', uid: 'firebase-uid-tomasz', email: 't@britannia.pl', role: 'teacher' });

      expect(service.templates()).toEqual([]);
    });
  });

  describe('save', () => {
    it('writes the schema version, the normalized id and the trimmed name', async () => {
      const service: TemplatesService = createService();

      const result = await service.save({ name: '  Klasa 5   Semestr  ', fields: fields({ course: 'A2' }) });

      expect(result.ok).toBeTrue();
      expect(gateway.create).toHaveBeenCalledWith(UID, 'klasa 5 semestr', {
        schemaVersion: TEMPLATE_SCHEMA_VERSION,
        name: 'Klasa 5   Semestr',
        nameKey: 'klasa 5 semestr',
        fields: fields({ course: 'A2' }),
      });
      expect(service.templates().map((template: ReportTemplate) => template.id)).toEqual(['klasa 5 semestr']);
    });

    it('refuses when nobody is signed in, without reaching the gateway', async () => {
      sessionState.set({ status: 'denied', reason: 'not-allowlisted' });

      expect(await createService().save({ name: 'Klasa 5', fields: fields() })).toEqual({
        ok: false,
        failure: 'not-signed-in',
      });
      expect(gateway.create).not.toHaveBeenCalled();
    });

    it('never reaches the gateway with an invalid name', async () => {
      const service: TemplatesService = createService();

      expect(await service.save({ name: '  ', fields: fields() })).toEqual({ ok: false, failure: 'name-required' });
      expect(await service.save({ name: 'a/b', fields: fields() })).toEqual({ ok: false, failure: 'name-invalid' });
      expect(gateway.create).not.toHaveBeenCalled();
    });

    it('rejects a duplicate name that differs only in case and spacing', async () => {
      gateway.list.and.resolveTo([
        { id: 'klasa 5 semestr', data: { name: 'Klasa 5 semestr', fields: {} } },
      ] satisfies StoredTemplate[]);

      const service: TemplatesService = createService();
      await service.load();

      expect(await service.save({ name: 'KLASA  5   Semestr', fields: fields() })).toEqual({
        ok: false,
        failure: 'name-taken',
      });
      expect(gateway.create).not.toHaveBeenCalled();
    });

    it('surfaces a denied write as a failure and does not add the template to the list', async () => {
      spyOn(console, 'error');
      gateway.create.and.rejectWith(firebaseError('permission-denied'));

      const service: TemplatesService = createService();

      expect(await service.save({ name: 'Klasa 5', fields: fields() })).toEqual({
        ok: false,
        failure: 'permission-denied',
      });
      expect(service.templates()).toEqual([]);
    });

    it('drops a key the domain does not know rather than writing it to the document', async () => {
      const service: TemplatesService = createService();

      await service.save({
        name: 'Klasa 5',
        fields: { ...fields(), studentName: 'Jan Kowalski' } as ReportTemplateFields,
      });

      const written = gateway.create.calls.mostRecent().args[2] as { fields: Record<string, unknown> };

      expect(Object.keys(written.fields).sort()).toEqual([...TEMPLATE_DOMAIN].sort());
      expect(written.fields['studentName']).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('deletes under the signed-in uid and drops the template from the list', async () => {
      gateway.list.and.resolveTo([
        { id: 'klasa 5', data: { name: 'Klasa 5', fields: {} } },
        { id: 'klasa 6', data: { name: 'Klasa 6', fields: {} } },
      ] satisfies StoredTemplate[]);

      const service: TemplatesService = createService();
      await service.load();

      expect(await service.remove('klasa 5')).toEqual({ ok: true, value: undefined });
      expect(gateway.remove).toHaveBeenCalledWith(UID, 'klasa 5');
      expect(service.templates().map((template: ReportTemplate) => template.id)).toEqual(['klasa 6']);
    });

    it('keeps the template in the list when the delete is rejected', async () => {
      spyOn(console, 'error');
      gateway.list.and.resolveTo([{ id: 'klasa 5', data: { name: 'Klasa 5', fields: {} } }] satisfies StoredTemplate[]);
      gateway.remove.and.rejectWith(firebaseError('unavailable'));

      const service: TemplatesService = createService();
      await service.load();

      expect(await service.remove('klasa 5')).toEqual({ ok: false, failure: 'offline' });
      expect(service.templates().length).toBe(1);
    });

    it('refuses when nobody is signed in', async () => {
      sessionState.set({ status: 'resolving' });

      const failure: TemplatesFailure = 'not-signed-in';

      expect(await createService().remove('klasa 5')).toEqual({ ok: false, failure });
      expect(gateway.remove).not.toHaveBeenCalled();
    });
  });

  describe('isEmpty', () => {
    it('is true for a template holding nothing but the form defaults', () => {
      expect(createService().isEmpty(fields())).toBeTrue();
    });

    it('is false as soon as any single domain field differs from its default', () => {
      const service: TemplatesService = createService();
      const nonDefaults: Readonly<Record<TemplateField, unknown>> = {
        reportType: ReportType.SEMESTER,
        date: '2026-06-12',
        teachers: ['Regina Raczyńska'],
        ownEducationMaterial: '1',
        studentBookTitle: 'Brainy 5',
        ownTitleStudentBook: 'Własny tytuł',
        course: 'A2',
        realizedMaterial: 'Units 1-8',
        signature: 'BRITANNIA',
        isExamRecommendation: true,
      };

      TEMPLATE_DOMAIN.forEach((field: TemplateField) => {
        const single: ReportTemplateFields = { ...TEMPLATE_DOMAIN_DEFAULTS };
        (single as Record<TemplateField, unknown>)[field] = nonDefaults[field];

        expect(service.isEmpty(single)).withContext(field).toBeFalse();
      });
    });
  });

  describe('diff', () => {
    it('reports nothing when the form is untouched', () => {
      const diff: TemplateApplyDiff = createService().diff(fields({ course: 'A2', realizedMaterial: 'Units 1-8' }), fields());

      expect(diff).toEqual({ overwritten: [], cleared: [] });
    });

    it('classifies a replaced value as overwritten and a defaulted one as cleared', () => {
      const diff: TemplateApplyDiff = createService().diff(
        fields({ course: 'A2', realizedMaterial: null }),
        fields({ course: 'B1', realizedMaterial: 'Units 1-8', signature: null }),
      );

      expect(diff.overwritten).toEqual(['course']);
      expect(diff.cleared).toEqual(['realizedMaterial']);
    });

    it('leaves a field alone when the template carries the same value', () => {
      const diff: TemplateApplyDiff = createService().diff(fields({ course: 'A2' }), fields({ course: 'A2' }));

      expect(diff).toEqual({ overwritten: [], cleared: [] });
    });

    it('compares `teachers` by contents, not by reference', () => {
      const service: TemplatesService = createService();
      const same: TemplateApplyDiff = service.diff(
        fields({ teachers: ['Regina Raczyńska'] }),
        fields({ teachers: ['Regina Raczyńska'] }),
      );
      const changed: TemplateApplyDiff = service.diff(
        fields({ teachers: ['Regina Raczyńska', 'Marek Nowak'] }),
        fields({ teachers: ['Regina Raczyńska'] }),
      );

      expect(same).toEqual({ overwritten: [], cleared: [] });
      expect(changed.overwritten).toEqual(['teachers']);
    });

    it('reports a boolean the template turns off as cleared', () => {
      const diff: TemplateApplyDiff = createService().diff(fields(), fields({ isExamRecommendation: true }));

      expect(diff.cleared).toEqual(['isExamRecommendation']);
    });
  });
});
