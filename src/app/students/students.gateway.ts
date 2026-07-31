import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  Firestore,
  getDocs,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { StudentDocument } from '../model/student.interface';
import { USERS_COLLECTION } from '../templates/templates.gateway';

/** Contract shared with `firestore.rules`. */
export const STUDENTS_COLLECTION = 'students';

/** One document as it came back, before anything interprets it. */
export interface StoredStudent {
  id: string;
  data: DocumentData;
}

/**
 * Every `@angular/fire/firestore` call for the student roster lives here, and
 * nothing else does — the seam `allowlist.gateway.ts` established and
 * `templates.gateway.ts` repeated, for the same reason: `StudentsService` holds
 * all the decisions and has to be drivable with a fake.
 *
 * No decision logic belongs in this file. It does not validate, does not map
 * errors, and does not interpret a document's contents; rejections propagate
 * untouched so the service can tell "permission denied" from "offline".
 *
 * `USERS_COLLECTION` is imported rather than re-declared. It is the path segment
 * `firestore.rules` compares against `request.auth.uid`, and a second copy of it
 * is exactly the schema/rule drift the warning at the bottom of that file
 * describes — a drifted owner path does not fail loudly, it over-permits or
 * silently addresses nothing.
 */
@Injectable({ providedIn: 'root' })
export class StudentsGateway {
  private readonly firestore: Firestore = inject(Firestore);
  private readonly injector: Injector = inject(Injector);

  /**
   * All of one teacher's students, in whatever order Firestore returns them.
   *
   * Deliberately a one-shot `getDocs`, not `collectionData` / `onSnapshot`: a
   * live listener per mount is the Spark-quota leak the risk register in
   * `context/foundation/infrastructure.md` names, and a teacher's own roster
   * does not change behind their back.
   *
   * Deliberately unordered, too. An `orderBy('identity.studentName')` would
   * silently omit any document missing that field — and tolerating missing
   * fields is the whole of the forward compatibility `schemaVersion` buys. The
   * service sorts; a teacher's roster is a class list, not a school register.
   */
  public async list(uid: string): Promise<StoredStudent[]> {
    const snapshot = await runInInjectionContext(this.injector, () =>
      getDocs(collection(this.firestore, USERS_COLLECTION, uid, STUDENTS_COLLECTION)),
    );

    return snapshot.docs.map((document) => ({ id: document.id, data: document.data() }));
  }

  /**
   * Writes a new student and returns the generated id.
   *
   * `addDoc` rather than `setDoc` at a known id, which is where this parts
   * company with `TemplatesGateway`: a template's id IS its normalized name and
   * that is what makes duplicate names impossible, but a student's name is
   * editable (FR-007) and legitimately non-unique. Keying on it would turn a
   * corrected surname into a non-atomic delete-and-recreate and would reject a
   * second child who happens to share a name.
   */
  public async create(
    uid: string,
    document: Omit<StudentDocument, 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const reference: DocumentReference = await runInInjectionContext(this.injector, () =>
      addDoc(collection(this.firestore, USERS_COLLECTION, uid, STUDENTS_COLLECTION), {
        ...document,
        // Server-side, so a teacher's clock cannot order the list.
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }),
    );

    return reference.id;
  }

  /**
   * Replaces the whole identity map.
   *
   * The nested object is written as one value rather than as dotted field paths,
   * so a key the caller omitted is removed rather than left behind from the
   * previous version. That is what makes an edit a full replacement of the four
   * fields, matching what `StudentsService` normalizes on the way in.
   *
   * Takes the same document shape as `create` rather than a bare identity, so
   * `schemaVersion` is rewritten alongside the fields it describes. An update
   * that replaced the identity but left the old version behind would leave the
   * only field a future migration can branch on describing a shape the document
   * no longer has.
   */
  public async update(
    uid: string,
    studentId: string,
    document: Omit<StudentDocument, 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      updateDoc(doc(this.firestore, USERS_COLLECTION, uid, STUDENTS_COLLECTION, studentId), {
        ...document,
        updatedAt: serverTimestamp(),
      }),
    );
  }

  public async remove(uid: string, studentId: string): Promise<void> {
    await runInInjectionContext(this.injector, () =>
      deleteDoc(doc(this.firestore, USERS_COLLECTION, uid, STUDENTS_COLLECTION, studentId)),
    );
  }
}
