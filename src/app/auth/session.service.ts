import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { User } from '@angular/fire/auth';
import {
  catchError,
  concat,
  filter,
  firstValueFrom,
  from,
  Observable,
  of,
  switchMap,
  timeout,
} from 'rxjs';
import { AllowlistEntry, DenialReason, SessionState, UserRole } from '../model/auth.interface';
import { AllowlistGateway } from './allowlist.gateway';
import { AuthGateway } from './auth.gateway';

interface AuthorizedAccount {
  email: string;
  role: UserRole;
}

/**
 * How long the first auth emission may take before the gate stops waiting.
 *
 * Firebase imposes no deadline of its own. If `authState` never emits — a
 * malformed `apiKey`, an App Check refusal, a network that accepts the
 * connection and then says nothing — the guards wait forever and the app sits
 * on the boot spinner with nothing to show and no way to recover. Restoring a
 * persisted session is normally sub-second; this is long enough that a cold,
 * slow network does not trip it, and short enough that nobody stares at a
 * spinner wondering whether the app is broken.
 */
const FIRST_EMISSION_TIMEOUT_MS = 15_000;

/** Tells "the wait expired" apart from a real `User | null` emission. */
const TIMED_OUT = Symbol('auth-timeout');

/**
 * The single source of truth for "is this person allowed in".
 *
 * Composes the two gateways into one `SessionState` signal; the guard, the
 * sign-in screen, and the header all read that signal and nothing else.
 */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly authGateway: AuthGateway = inject(AuthGateway);
  private readonly allowlistGateway: AllowlistGateway = inject(AllowlistGateway);

  /**
   * Why the last sign-in attempt was refused.
   *
   * This lives apart from the account signal on purpose. Refusing calls
   * `signOut()`, which immediately pushes the auth stream back to `null` — so a
   * reason folded into the account state would be discarded by the very act of
   * enforcing it, and the user would be returned to a blank sign-in screen with
   * no explanation.
   */
  private readonly denial = signal<DenialReason | null>(null);

  /**
   * `undefined` means "not known yet" — before the first auth emission, and
   * again for as long as an allowlist lookup is in flight.
   *
   * Re-emitting `undefined` when a user appears is what keeps the guards
   * honest. Without it the signal would hold the previous `null` for the whole
   * duration of the lookup, so a guard consulted in that window would read a
   * stale "anonymous", redirect to the sign-in screen, and never be asked
   * again once the answer arrived.
   */
  private readonly account = toSignal(
    this.authGateway.user$.pipe(
      // Bounds only the *first* emission — an established session is never
      // timed out. `with` resubscribes instead of erroring, so an emission
      // that was merely late still arrives and corrects the state, and the
      // stream stays alive for every sign-in after that.
      timeout({
        first: FIRST_EMISSION_TIMEOUT_MS,
        with: () => concat(of(TIMED_OUT), this.authGateway.user$),
      }),
      switchMap((user: User | null | typeof TIMED_OUT) => {
        if (user === TIMED_OUT) {
          console.error(`No auth emission within ${FIRST_EMISSION_TIMEOUT_MS}ms`);
          this.denial.set('lookup-failed');

          return of(null);
        }

        return user === null
          ? of(null)
          : concat(
              of(undefined),
              from(this.resolveAccount(user)).pipe(
                // `toSignal` latches an errored source: it stores the error,
                // tears the subscription down, and re-throws it on every later
                // read. One rejected Firebase call would leave `state()`
                // throwing for the rest of the page's life — guards included.
                //
                // Caught here rather than on the outer pipe on purpose: this
                // way only the one resolution attempt fails, and `user$` stays
                // alive so the next sign-in still emits.
                catchError((error: unknown) => {
                  console.error('Resolving the session failed', error);
                  this.denial.set('lookup-failed');

                  return of(null);
                }),
              ),
            );
      }),
    ),
    { initialValue: undefined },
  );

  public readonly state: Signal<SessionState> = computed<SessionState>(() => {
    const account: AuthorizedAccount | null | undefined = this.account();

    if (account === undefined) {
      return { status: 'resolving' };
    }

    if (account !== null) {
      return { status: 'authorized', email: account.email, role: account.role };
    }

    const denial: DenialReason | null = this.denial();

    return denial === null ? { status: 'anonymous' } : { status: 'denied', reason: denial };
  });

  /**
   * `state` as an observable — created exactly once, and shared.
   *
   * `toObservable` registers its cleanup on the injector's `DestroyRef`, not on
   * unsubscribe. Calling it per guard run and per `signIn()` / `signOut()` — as
   * this file and `auth.guard.ts` both used to — leaves one live effect behind
   * every time, none of which are released before the page is closed. On a root
   * service one instance means one effect, and the guards read it from here
   * rather than building their own.
   */
  public readonly state$: Observable<SessionState> = toObservable(this.state);

  /**
   * Opens the Google sign-in popup. Rejects when the popup is blocked or
   * dismissed — the caller renders that; it is not a denial of access and must
   * not be folded into `DenialReason`.
   */
  public async signIn(): Promise<void> {
    this.denial.set(null);

    await this.authGateway.signInWithGoogle();
    await this.settledOnce((state: SessionState) => state.status !== 'anonymous');
  }

  public async signOut(): Promise<void> {
    this.denial.set(null);

    await this.authGateway.signOut();
    await this.settledOnce((state: SessionState) => state.status !== 'authorized');
  }

  /**
   * Resolves once the state stops describing the session we just left.
   *
   * Firebase resolves `signInWithPopup` and `signOut` independently of the auth
   * stream's emission, so for a moment afterwards this signal still reports the
   * previous session. A caller that navigates in that window hands the guards a
   * stale answer and they undo the transition — `signInGuard` reading a stale
   * "authorized" after a sign-out sends the user straight back to the shell
   * they were leaving. Sign-in has the same race and merely tends to win it.
   */
  private async settledOnce(isSettled: (state: SessionState) => boolean): Promise<void> {
    await firstValueFrom(this.state$.pipe(filter(isSettled)));
  }

  private async resolveAccount(user: User | null): Promise<AuthorizedAccount | null> {
    // Refused rather than returned as a bare `null`: without a denial the state
    // collapses to plain `anonymous`, which would describe a signed-in Firebase
    // user as signed out — no message, a bounce to the sign-in screen, and a
    // chooser that silently re-picks the same account, with the credential
    // still on disk. Google always supplies `email`, so this is defence in
    // depth rather than a reachable path today.
    if (!user?.email) {
      return this.refuse('not-allowlisted');
    }

    const email: string = user.email;
    let entry: AllowlistEntry | null;

    try {
      entry = await this.allowlistGateway.lookup(email);
    } catch (error: unknown) {
      console.error('Allowlist lookup failed', error);

      return this.refuse('lookup-failed');
    }

    if (entry === null) {
      return this.refuse('not-allowlisted');
    }

    this.denial.set(null);

    return { email, role: entry.role };
  }

  private async refuse(reason: DenialReason): Promise<null> {
    this.denial.set(reason);

    // A failed sign-out must still yield the denial. Letting this reject would
    // error the stream above and latch `state()` into a permanent throw — see
    // the `catchError` there. The credential outliving the refusal is the
    // lesser problem, and the next auth emission re-runs this path.
    try {
      await this.authGateway.signOut();
    } catch (error: unknown) {
      console.error('Sign-out after a refusal failed', error);
    }

    return null;
  }
}
