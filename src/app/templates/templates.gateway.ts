import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  DocumentData,
  Firestore,
  getDocs,
  serverTimestamp,
  setDoc,
} from '@angular/fire/firestore';
import { ReportTemplateDocument } from '../model/report-template.interface';

/** Contract shared with `firestore.rules` — the ownership path segment. */
export const USERS_COLLECTION = 'users';

/** Contract shared with `firestore.rules`. */
export const REPORT_TEMPLATES_COLLECTION = 'reportTemplates';

/** One document as it came back, before anything interprets it. */
export interface StoredTemplate {
  id: string;
  data: DocumentData;
}

/**
 * Every `@angular/fire/firestore` call for report templates lives here, and
 * nothing else does — the same seam `allowlist.gateway.ts` established, for the
 * same reason: `TemplatesService` holds all the decisions and has to be drivable
 * with a fake.
 *
 * No decision logic belongs in this file. It does not validate, does not map
 * errors, and does not interpret a document's contents; rejections propagate
 * untouched so the service can tell "permission denied" from "offline".
 */
@Injectable({ providedIn: 'root' })
export class TemplatesGateway {
  private readonly firestore: Firestore = inject(Firestore);
  private readonly injector: Injector = inject(Injector);

  /**
   * All of one teacher's templates, in whatever order Firestore returns them.
   *
   * Deliberately a one-shot `getDocs`, not `collectionData` / `onSnapshot`: a
   * live listener per panel mount is the Spark-quota leak the risk register in
   * `context/foundation/infrastructure.md` names, and a teacher's own template
   * list does not change behind their back.
   *
   * Deliberately unordered, too. An `orderBy('createdAt')` would silently omit
   * any document missing that field — and tolerating missing fields is exactly
   * the forward compatibility `schemaVersion` buys. The service sorts; template
   * counts per teacher are in single digits.
   */
  public async list(uid: string): Promise<StoredTemplate[]> {
    const snapshot = await runInInjectionContext(this.injector, () =>
      getDocs(collection(this.firestore, USERS_COLLECTION, uid, REPORT_TEMPLATES_COLLECTION)),
    );

    return snapshot.docs.map((document) => ({ id: document.id, data: document.data() }));
  }

  /**
   * Writes a new template at `templateId`.
   *
   * `setDoc` at a known id rather than `addDoc`, because the id *is* the
   * normalized name — which is what makes duplicate names impossible without a
   * uniqueness index. A second save under the same name is a write over an
   * existing document, and `allow update: if false` rejects it. That rejection is
   * the backstop for two tabs racing; the service's own check is what produces a
   * readable message in the ordinary case.
   */
  public async create(
    uid: string,
    templateId: string,
    document: Omit<ReportTemplateDocument, 'createdAt'>,
  ): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      setDoc(doc(this.firestore, USERS_COLLECTION, uid, REPORT_TEMPLATES_COLLECTION, templateId), {
        ...document,
        // Server-side, so a teacher's clock cannot order the list.
        createdAt: serverTimestamp(),
      }),
    );
  }

  public async remove(uid: string, templateId: string): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      deleteDoc(doc(this.firestore, USERS_COLLECTION, uid, REPORT_TEMPLATES_COLLECTION, templateId)),
    );
  }
}
