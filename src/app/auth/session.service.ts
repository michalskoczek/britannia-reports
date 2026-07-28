import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';
import { AllowlistEntry, DenialReason, SessionState, UserRole } from '../model/auth.interface';
import { AllowlistGateway } from './allowlist.gateway';
import { AuthGateway } from './auth.gateway';

interface AuthorizedAccount {
  email: string;
  role: UserRole;
}

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

  /** `undefined` while the first auth emission is still being resolved. */
  private readonly account = toSignal(
    this.authGateway.user$.pipe(switchMap((user: User | null) => from(this.resolveAccount(user)))),
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
   * Opens the Google sign-in popup. Rejects when the popup is blocked or
   * dismissed — the caller renders that; it is not a denial of access and must
   * not be folded into `DenialReason`.
   */
  public async signIn(): Promise<void> {
    this.denial.set(null);

    await this.authGateway.signInWithGoogle();
  }

  public async signOut(): Promise<void> {
    this.denial.set(null);

    await this.authGateway.signOut();
  }

  private async resolveAccount(user: User | null): Promise<AuthorizedAccount | null> {
    if (!user?.email) {
      return null;
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

    await this.authGateway.signOut();

    return null;
  }
}
