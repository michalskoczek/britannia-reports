import { Component, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { SessionService } from '../session.service';
import { SessionState } from '../../model/auth.interface';

/**
 * Firebase reports a dismissed popup the same way it reports a failure. Closing
 * the chooser on purpose is not an error worth a message.
 */
const CANCELLED_BY_USER: readonly string[] = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/user-cancelled',
];

/**
 * The only codes that actually mean the browser refused to open the window.
 *
 * Everything else that is not a cancellation — `auth/unauthorized-domain` on a
 * fresh deploy, a network failure, an App Check refusal, a malformed key — is a
 * configuration or connectivity problem, and telling the user to allow pop-ups
 * sends whoever debugs it in the wrong direction.
 */
const POPUP_BLOCKED: readonly string[] = ['auth/popup-blocked', 'auth/popup-blocked-by-browser'];

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
  standalone: true,
  imports: [ButtonComponent, TranslateModule],
})
export class SignInComponent {
  private readonly session: SessionService = inject(SessionService);
  private readonly router: Router = inject(Router);

  /**
   * Why the last sign-in *attempt* failed, as a translate key, or `null`.
   *
   * Distinct from `denialKey`: that is the allowlist refusing an established
   * session, this is the sign-in never completing in the first place.
   */
  private readonly attemptFailure: WritableSignal<string | null> = signal(null);

  /**
   * The translate key for why the last attempt was refused, or `null`.
   *
   * Computed here rather than branched in the template: narrowing a
   * discriminated union across `@if` blocks is exactly the kind of thing that
   * compiles today and stops compiling after someone adds a state.
   */
  protected readonly denialKey: Signal<string | null> = computed(() => {
    const state: SessionState = this.session.state();

    if (state.status !== 'denied') {
      return null;
    }

    return state.reason === 'not-allowlisted' ? 'auth.noAccess' : 'auth.verificationFailed';
  });

  protected readonly attemptFailureKey: Signal<string | null> = this.attemptFailure.asReadonly();

  /**
   * True while an attempt is in flight.
   *
   * The chain behind the button — popup, allowlist round-trip, settle, navigate
   * — can take a visible moment, and without this the screen is indistinguishable
   * from idle, so the natural response is to click again and open a second popup.
   */
  protected readonly pending: WritableSignal<boolean> = signal(false);

  protected async signIn(): Promise<void> {
    this.attemptFailure.set(null);
    this.pending.set(true);

    try {
      await this.session.signIn();

      // Guards run on activation, not when the session changes — so signing in
      // while already on this route needs an explicit navigation. `authGuard`
      // then holds it until the allowlist lookup settles, and bounces straight
      // back here with a message if the account is refused.
      await this.router.navigate(['/']);
    } catch (error: unknown) {
      const code: string | undefined = (error as { code?: string })?.code;

      if (code !== undefined && CANCELLED_BY_USER.includes(code)) {
        return;
      }

      console.error('Google sign-in did not complete', error);

      this.attemptFailure.set(
        code !== undefined && POPUP_BLOCKED.includes(code)
          ? 'auth.popupBlocked'
          : 'auth.verificationFailed',
      );
    } finally {
      this.pending.set(false);
    }
  }
}
