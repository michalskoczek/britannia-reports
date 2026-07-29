import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth,
  authState,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

/**
 * Every `@angular/fire/auth` call in the app lives here.
 *
 * The seam exists for testability: with the emulator suite deferred to S-02/S-03
 * (see `context/foundation/infrastructure.md` → Getting Started step 4), unit
 * tests are the only automated barrier this gate has. Keeping the SDK behind a
 * gateway lets `SessionService` — where all the decision logic lives — be driven
 * with fakes instead of mocked Firebase internals.
 *
 * No decision logic belongs in this file.
 */
@Injectable({ providedIn: 'root' })
export class AuthGateway {
  private readonly auth: Auth = inject(Auth);
  private readonly injector: Injector = inject(Injector);

  /** Emits on every sign-in and sign-out, starting with the restored session. */
  public readonly user$: Observable<User | null> = authState(this.auth);

  /**
   * The session survives closing the browser: `getAuth()` initializes with
   * local persistence, which is what a teacher who returns to this tool once a
   * reporting period needs.
   *
   * That is inherited, not configured. An explicit
   * `setPersistence(auth, browserLocalPersistence)` here threw
   * "cls is not a constructor" from the SDK's `_getInstance`, which does
   * `new cls()` on what it is handed. `setPersistence` is on `@angular/fire`'s
   * zone-wrapped export list; `browserLocalPersistence` is not, and reaches us
   * through its `export * from 'firebase/auth'` instead. Do not "restore" the
   * call for explicitness — it configured the default and broke sign-in.
   */
  public async signInWithGoogle(): Promise<void> {
    // `@angular/fire` zone-wraps the SDK functions and warns when they are
    // called outside an injection context; field initializers run inside one,
    // method bodies do not.
    await runInInjectionContext(this.injector, () =>
      signInWithPopup(this.auth, new GoogleAuthProvider()),
    );
  }

  public async signOut(): Promise<void> {
    await runInInjectionContext(this.injector, () => firebaseSignOut(this.auth));
  }
}
