/**
 * The field-domain boundary for trimester/semester report templates.
 *
 * One place answers "which controls does a template own", and everything else —
 * the gateway, the service, the panel, the report component, and the partition
 * assertion in `semestr-report.component.spec.ts` — reads it from here. Data
 * only: no Angular imports, so it can be imported from anywhere including a
 * plain Node script.
 *
 * The four sets below partition all 48 controls of `SemestrReportComponent`'s
 * form exactly once. That is asserted, not asserted-in-prose: a change that adds
 * a control or moves one across the boundary fails a spec instead of quietly
 * breaking `S-04`.
 */

import { ReportTemplateFields, TemplateField } from '../model/report-template.interface';
import { ReportType } from '../shared/enum/report-type.enum';

/**
 * Bumped only when a stored document's shape changes incompatibly.
 *
 * Widening `TEMPLATE_DOMAIN` does not qualify: `TemplatesService` treats any key
 * a document lacks as that key's default, so templates saved at version 1 keep
 * working after `S-04` adds fields. The version exists for the change that
 * cannot be handled that way.
 */
export const TEMPLATE_SCHEMA_VERSION = 1;

/**
 * The ten controls a template reads and writes.
 *
 * Iterate this rather than hand-listing fields — apply, collect and diff all do,
 * which is what keeps them in agreement when the domain widens.
 */
export const TEMPLATE_DOMAIN = [
  'reportType',
  'date',
  'teachers',
  'ownEducationMaterial',
  'studentBookTitle',
  'ownTitleStudentBook',
  'course',
  'realizedMaterial',
  'signature',
  'isExamRecommendation',
] as const satisfies readonly TemplateField[];

/**
 * The value each domain control holds in a freshly created form.
 *
 * Must match `SemestrReportComponent.createForm()` exactly. Two things depend on
 * it: "is this template empty" (US-01's no-op apply) and "would applying clear
 * something the teacher typed" (the FR-011 dialog). A default that drifted from
 * the form would make both answers wrong in the same direction — silently.
 */
export const TEMPLATE_DOMAIN_DEFAULTS: Readonly<ReportTemplateFields> = {
  reportType: ReportType.TRIMESTER,
  date: null,
  teachers: null,
  ownEducationMaterial: false,
  studentBookTitle: null,
  ownTitleStudentBook: null,
  course: null,
  realizedMaterial: null,
  signature: null,
  isExamRecommendation: false,
};

/**
 * Who the report is about. A template must never write these — this is the half
 * of the boundary that makes "a parent received another child's grade"
 * unreachable, and `S-04`'s student picker owns them instead.
 */
export const STUDENT_IDENTITY_FIELDS = ['studentName', 'name', 'sex', 'class'] as const;

/**
 * Judgements about one child: the six required descriptive-mark selects, plus
 * attendance, the average mark, the free-text comment, the Cambridge
 * recommendation flag, and the two exam-recommendation value controls.
 *
 * Deliberately outside the template domain even though pre-filling them would
 * save clicks. A template that carried them would turn "the teacher overlooked
 * one select" into "a parent received a PDF carrying another student's grade" —
 * the worst failure available to this product.
 *
 * `S-04` added one writer of these values that is not the teacher: when `sex`
 * changes, `SemestrReportComponent` re-maps the six descriptive-mark controls to
 * the matching gender's wording of the *same* sentence, because their option
 * lists are sex-dependent and a control left holding the other variant renders
 * blank while still passing `required`. That changes values inside this set; it
 * does not move a single field across the partition, and the student picker's
 * own domain is still `STUDENT_IDENTITY_FIELDS` and nothing else. Do not read
 * the remap as a widening of what a picker or a template may reach.
 */
export const PER_STUDENT_FIELDS = [
  'pronunciation',
  'vocabulary',
  'prepareToLecture',
  'homeworks',
  'involvement',
  'behaviour',
  'frequency',
  'avgMark',
  'additionalComment',
  'recommendationToCambridgeExam',
  'examRecommendationOptions',
  'examRecommendationResult',
] as const;

/**
 * Declared in `createForm()` but bound nowhere in
 * `semestr-report.component.html`, so no user can reach them: the fourteen
 * `FormArray`s (the template binds no `formArrayName`) plus eight controls with
 * no widget.
 *
 * They are listed rather than dropped because they are still part of the frozen
 * form contract, and the partition has to account for all 48 controls to be an
 * exhaustive one. Removing them is its own change.
 */
export const UNREACHABLE_FIELDS = [
  'comments',
  'recommendations',
  'listeningA1Array',
  'writingAndReadingA1Array',
  'speakingA1Array',
  'listeningA2B1Array',
  'readingA2B1Array',
  'writingA2B1Array',
  'speakingA2B1Array',
  'listeningB2C1Array',
  'readingB2C1Array',
  'useOfEnglishB2C1Array',
  'writingB2C1Array',
  'speakingB2C1Array',
  'lead',
  'respect',
  'focus',
  'typeOfExam',
  'learningRecommendations',
  'examRecommendation',
  'examRecommendationAcceptCheckbox',
  'examRecommendationNonCheckbox',
] as const;
