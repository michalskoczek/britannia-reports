import { computed, inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { SessionService } from '../auth/session.service';
import { SessionState } from '../model/auth.interface';
import {
  ReportTemplate,
  ReportTemplateDocument,
  ReportTemplateDraft,
  ReportTemplateFields,
  TemplateField,
} from '../model/report-template.interface';
import { TEMPLATE_DOMAIN, TEMPLATE_DOMAIN_DEFAULTS, TEMPLATE_SCHEMA_VERSION } from './template-domain';
import { StoredTemplate, TemplatesGateway } from './templates.gateway';

/**
 * Why an operation did not happen.
 *
 * A closed set rather than a Firebase error, so the panel can pick a message
 * without inspecting SDK error codes — and so a new failure mode has to be named
 * here before it can reach the UI as "something went wrong".
 */
export type TemplatesFailure =
  | 'not-signed-in'
  | 'name-required'
  | 'name-too-long'
  | 'name-invalid'
  | 'name-taken'
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
export type TemplatesResult<T> = { ok: true; value: T } | { ok: false; failure: TemplatesFailure };

/**
 * What applying a template would do to the fields the teacher already filled.
 *
 * Two lists, because apply writes every domain key including the empty ones:
 * `overwritten` is "this value will be replaced by another value", `cleared` is
 * "this value will go back to the form's default". FR-011 only names the first;
 * the second exists because a template can carry a `null` the teacher did not
 * ask for. Note that a default is not always a blank — `reportType`'s default is
 * `TRIMESTER` — so the dialog wording for `cleared` has to mean "reset", not
 * "emptied".
 */
export interface TemplateApplyDiff {
  overwritten: TemplateField[];
  cleared: TemplateField[];
}

/**
 * Long enough for "Klasa 5B semestr 2 — poziom rozszerzony", short enough that
 * the list stays readable and the document id stays well inside Firestore's
 * 1500-byte limit.
 */
export const TEMPLATE_NAME_MAX_LENGTH = 60;

/**
 * Every decision about report templates: what a name means, whether a template
 * is empty, and what applying one would cost the teacher.
 *
 * The Firebase SDK is not reachable from here — `TemplatesGateway` holds all of
 * it — which is what lets this file be driven with a fake in
 * `templates.service.spec.ts`. `S-01` shipped three defects that a green suite
 * missed because its fakes were more agreeable than Firebase; the spec here
 * models the rejections deliberately.
 */
@Injectable({ providedIn: 'root' })
export class TemplatesService {
  private readonly gateway: TemplatesGateway = inject(TemplatesGateway);
  private readonly session: SessionService = inject(SessionService);

  private readonly loaded: WritableSignal<readonly ReportTemplate[]> = signal<readonly ReportTemplate[]>([]);

  /** Whose list `loaded` holds. `null` before the first successful load. */
  private readonly loadedFor: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * The teacher's templates, as of the last successful `load()`.
   *
   * Gated on the uid it was loaded for. Two teachers using the same browser tab
   * in sequence is unlikely, but a list surviving that transition would leak one
   * teacher's template names into the other's panel and — worse — into the
   * duplicate-name check, which is the one place a stale list produces a wrong
   * *decision* rather than a wrong display.
   */
  public readonly templates: Signal<readonly ReportTemplate[]> = computed<readonly ReportTemplate[]>(() => {
    const uid: string | null = this.currentUid();

    return uid !== null && uid === this.loadedFor() ? this.loaded() : [];
  });

  /**
   * The uniqueness key and the document id, in one value.
   *
   * Trim, collapse internal whitespace, lowercase — so "Klasa 5" and
   * " klasa  5 " are the same template, which is what a teacher means by "I
   * already have that one".
   */
  public nameKey(name: string): string {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /**
   * `null` when the name is usable.
   *
   * The last two checks are Firestore document-id constraints rather than product
   * rules. Without them the write fails with an opaque SDK error at the end of a
   * save the teacher has already committed to, instead of a message next to the
   * field they typed.
   */
  public validateName(name: string): TemplatesFailure | null {
    const trimmed: string = name.trim();

    if (trimmed.length === 0) {
      return 'name-required';
    }

    if (trimmed.length > TEMPLATE_NAME_MAX_LENGTH) {
      return 'name-too-long';
    }

    const key: string = this.nameKey(name);

    // `/` splits a Firestore path; `__…` is reserved; `.` and `..` are path
    // segments with a meaning of their own.
    if (key.includes('/') || key.startsWith('__') || key === '.' || key === '..') {
      return 'name-invalid';
    }

    return null;
  }

  /** Replaces the cached list on success; leaves it untouched on failure. */
  public async load(): Promise<TemplatesResult<readonly ReportTemplate[]>> {
    const uid: string | null = this.currentUid();

    if (uid === null) {
      return { ok: false, failure: 'not-signed-in' };
    }

    let stored: StoredTemplate[];

    try {
      stored = await this.gateway.list(uid);
    } catch (error: unknown) {
      return this.fail('Listing report templates failed', error);
    }

    const templates: readonly ReportTemplate[] = stored
      .map((document: StoredTemplate) => this.toTemplate(document))
      .sort(byName);

    this.loaded.set(templates);
    this.loadedFor.set(uid);

    return { ok: true, value: templates };
  }

  /**
   * Saves a new template, or explains why it did not.
   *
   * The duplicate check reads the cached list rather than querying, which is what
   * makes "that name is taken" a message instead of a failed write. It is not the
   * enforcement: `allow update: if false` in `firestore.rules` is, and it covers
   * the two-tabs race this check cannot see.
   */
  public async save(draft: ReportTemplateDraft): Promise<TemplatesResult<ReportTemplate>> {
    const uid: string | null = this.currentUid();

    if (uid === null) {
      return { ok: false, failure: 'not-signed-in' };
    }

    const nameFailure: TemplatesFailure | null = this.validateName(draft.name);

    if (nameFailure !== null) {
      return { ok: false, failure: nameFailure };
    }

    const templateId: string = this.nameKey(draft.name);

    if (this.templates().some((template: ReportTemplate) => template.id === templateId)) {
      return { ok: false, failure: 'name-taken' };
    }

    const document: Omit<ReportTemplateDocument, 'createdAt'> = {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      name: draft.name.trim(),
      nameKey: templateId,
      // Normalized on the way out too, so a caller that hands over an object
      // carrying an extra key cannot write one into the document.
      fields: this.normalizeFields(draft.fields),
    };

    try {
      await this.gateway.create(uid, templateId, document);
    } catch (error: unknown) {
      // A `permission-denied` here can also be the two-tabs race — the rule
      // refusing a write over a document this session never saw. Reported as
      // denied rather than taken, because guessing which one it was would need
      // another read to find out.
      return this.fail('Saving a report template failed', error);
    }

    const saved: ReportTemplate = {
      id: templateId,
      name: document.name,
      fields: document.fields,
      // The server timestamp is not readable without re-reading the document,
      // and nothing in the UI needs it. It arrives on the next `load()`.
      createdAt: null,
    };

    this.loaded.set([...this.templates(), saved].sort(byName));
    this.loadedFor.set(uid);

    return { ok: true, value: saved };
  }

  public async remove(templateId: string): Promise<TemplatesResult<void>> {
    const uid: string | null = this.currentUid();

    if (uid === null) {
      return { ok: false, failure: 'not-signed-in' };
    }

    try {
      await this.gateway.remove(uid, templateId);
    } catch (error: unknown) {
      return this.fail('Deleting a report template failed', error);
    }

    this.loaded.set(this.templates().filter((template: ReportTemplate) => template.id !== templateId));

    return { ok: true, value: undefined };
  }

  /**
   * True when every domain field still holds the form's default.
   *
   * US-01 requires that applying such a template is a no-op. "Empty" cannot mean
   * "blank" here: `reportType` and the two booleans carry defaults rather than
   * blanks, so the comparison is against `TEMPLATE_DOMAIN_DEFAULTS`.
   */
  public isEmpty(fields: ReportTemplateFields): boolean {
    return TEMPLATE_DOMAIN.every((field: TemplateField) => this.isDefault(field, fields[field]));
  }

  /** What the FR-011 confirmation dialog lists. Empty lists mean "apply freely". */
  public diff(fields: ReportTemplateFields, current: ReportTemplateFields): TemplateApplyDiff {
    const overwritten: TemplateField[] = [];
    const cleared: TemplateField[] = [];

    for (const field of TEMPLATE_DOMAIN) {
      const currentValue: unknown = current[field];

      // Nothing to lose: the teacher has not filled this one.
      if (this.isDefault(field, currentValue)) {
        continue;
      }

      const templateValue: unknown = fields[field];

      if (sameValue(currentValue, templateValue)) {
        continue;
      }

      if (this.isDefault(field, templateValue)) {
        cleared.push(field);
      } else {
        overwritten.push(field);
      }
    }

    return { overwritten, cleared };
  }

  private isDefault(field: TemplateField, value: unknown): boolean {
    return sameValue(value, TEMPLATE_DOMAIN_DEFAULTS[field]);
  }

  private currentUid(): string | null {
    const state: SessionState = this.session.state();

    return state.status === 'authorized' ? state.uid : null;
  }

  private fail<T>(message: string, error: unknown): TemplatesResult<T> {
    console.error(message, error);

    return { ok: false, failure: classify(error) };
  }

  /**
   * Reads one stored document tolerantly.
   *
   * A key the document lacks becomes that key's default and a key
   * `TEMPLATE_DOMAIN` does not know is dropped — which is the whole of the
   * forward compatibility `schemaVersion: 1` promises. Values that *are* present
   * are kept verbatim, `ownEducationMaterial`'s string/boolean mix included:
   * coercing it here would change what the PDF prints.
   */
  private toTemplate(stored: StoredTemplate): ReportTemplate {
    const name: unknown = stored.data['name'];
    const fields: unknown = stored.data['fields'];

    return {
      id: stored.id,
      // Falls back to the id, which is the normalized name — a listed template
      // with a blank label would be unusable, and unnameable is worse than
      // lowercased.
      name: typeof name === 'string' && name.trim().length > 0 ? name : stored.id,
      fields: this.normalizeFields(fields),
      createdAt: toDate(stored.data['createdAt']),
    };
  }

  private normalizeFields(raw: unknown): ReportTemplateFields {
    const source: Record<string, unknown> = isRecord(raw) ? raw : {};
    const fields: ReportTemplateFields = { ...TEMPLATE_DOMAIN_DEFAULTS };

    for (const field of TEMPLATE_DOMAIN) {
      const value: unknown = source[field];

      // `undefined` is the only "absent": a stored `null` is a real value here,
      // and several of these fields default to exactly that.
      if (value !== undefined) {
        // The domain constant guarantees `field` indexes `fields`. What the
        // stored value's *type* is remains the schema's promise, not something
        // TypeScript can check across a Firestore round-trip.
        (fields as Record<TemplateField, unknown>)[field] = value;
      }
    }

    return fields;
  }
}

/** Polish collation, because that is what the names are written in. */
const byName = (a: ReportTemplate, b: ReportTemplate): number => a.name.localeCompare(b.name, 'pl');

/** `teachers` is an array; everything else in the domain is a primitive. */
const sameValue = (a: unknown, b: unknown): boolean => {
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value: unknown, index: number) => value === b[index])
    );
  }

  return a === b;
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
const classify = (error: unknown): TemplatesFailure => {
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
