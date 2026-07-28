import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { AllowlistEntry, UserRole } from '../model/auth.interface';

/** Contract shared with `firestore.rules` and `docs/teacher-allowlist-runbook.md`. */
export const ALLOWED_USERS_COLLECTION = 'allowedUsers';

const ROLES: readonly UserRole[] = ['teacher', 'director'];

/**
 * Reads the FR-003 teacher allowlist. Every `@angular/fire/firestore` call in
 * the app lives here — see `AuthGateway` for why the seam exists.
 */
@Injectable({ providedIn: 'root' })
export class AllowlistGateway {
  private readonly firestore: Firestore = inject(Firestore);
  private readonly injector: Injector = inject(Injector);

  /**
   * Resolves the entry, or `null` when the address is not on file.
   *
   * **Rejects** when the read itself fails. That distinction is load-bearing:
   * `SessionService` turns "not on file" and "could not check" into different
   * messages, and flattening both into `null` would tell a teacher whose network
   * dropped that their access was revoked.
   *
   * Deliberately a one-shot `getDoc`, not `docData` / `onSnapshot`: a live
   * listener per session is exactly the Spark-quota leak the risk register in
   * `context/foundation/infrastructure.md` warns about, and the allowlist does
   * not change while someone is signed in.
   */
  public async lookup(email: string): Promise<AllowlistEntry | null> {
    const documentId = email.toLowerCase();

    const snapshot = await runInInjectionContext(this.injector, () =>
      getDoc(doc(this.firestore, ALLOWED_USERS_COLLECTION, documentId)),
    );

    if (!snapshot.exists()) {
      return null;
    }

    const role: unknown = snapshot.get('role');

    // A hand-seeded document can carry a typo in `role`. Refusing loudly is
    // safer than guessing a role, and surfaces as "could not verify access"
    // rather than "you are not on the list" — which is the honest message,
    // since the account IS on the list and the record is what is wrong.
    if (!ROLES.includes(role as UserRole)) {
      throw new Error(
        `Allowlist entry "${documentId}" has an invalid role: ${JSON.stringify(role)}. ` +
          `Expected one of ${ROLES.join(', ')}. See docs/teacher-allowlist-runbook.md.`,
      );
    }

    return { role: role as UserRole };
  }
}
