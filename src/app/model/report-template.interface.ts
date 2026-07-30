/**
 * Trimester/semester report template types (FR-009…FR-012).
 *
 * Stored at `users/{uid}/reportTemplates/{templateId}`, where `templateId` is
 * the normalized name — see `TemplatesService.nameKey`. Ownership is the path
 * segment, not a field on the document; `firestore.rules` explains why.
 */

import { ReportType } from '../shared/enum/report-type.enum';

/**
 * The controls a template owns — properties of a *cohort*, never of a student.
 *
 * This interface is the boundary `S-04` (student picker) is built on: nothing
 * here identifies or assesses one child, so applying a template can never move
 * one student's grade onto another's report. Widening it is a deliberate act,
 * not a convenience — `src/app/semestr-report/semestr-report.component.spec.ts`
 * asserts the partition of all 48 form controls and fails when it drifts.
 */
export interface ReportTemplateFields {
  reportType: ReportType;
  /**
   * A calendar date as `YYYY-MM-DD` — no time, no zone.
   *
   * The form control holds a `Moment` in the app and a `Date` in specs
   * (`app.config.ts` provides the moment adapter, specs provide the native one),
   * so neither type may cross this boundary: a round-trip that assumed one would
   * pass every spec and break in the browser. `SemestrReportComponent` converts
   * in both directions and nothing else needs to know which adapter is in play.
   */
  date: string | null;
  teachers: string[] | null;
  /**
   * Deliberately heterogeneous: `"1" | "2" | true | false`.
   *
   * The radio group binds the strings while the `onCheckboxChange*` handlers
   * write the booleans, and `generatePDF`'s book-title fallback chain depends on
   * the current mix. Store it verbatim — normalizing it to either type changes
   * what the PDF prints.
   */
  ownEducationMaterial: string | boolean;
  studentBookTitle: string | null;
  ownTitleStudentBook: string | null;
  course: string | null;
  realizedMaterial: string | null;
  signature: string | null;
  isExamRecommendation: boolean;
}

/** The ten control names a template owns. */
export type TemplateField = keyof ReportTemplateFields;

/** A template as the app works with it. */
export interface ReportTemplate {
  /** The document id, which is also the normalized name. */
  id: string;
  /** The name as the teacher typed it. */
  name: string;
  fields: ReportTemplateFields;
  /** `null` until the server timestamp written on create has materialized. */
  createdAt: Date | null;
}

/** A template on its way to being saved: no id yet, and no timestamp. */
export interface ReportTemplateDraft {
  name: string;
  fields: ReportTemplateFields;
}

/**
 * The stored document.
 *
 * `nameKey` is redundant with the document id on purpose — an id is not readable
 * from a document's own data in Firestore rules or in an export, and duplicating
 * it costs nothing.
 */
export interface ReportTemplateDocument {
  schemaVersion: number;
  name: string;
  nameKey: string;
  createdAt: unknown;
  fields: ReportTemplateFields;
}
