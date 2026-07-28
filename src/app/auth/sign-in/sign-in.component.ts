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

  private readonly popupFailed: WritableSignal<boolean> = signal(false);

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

  protected readonly popupKey: Signal<string | null> = computed(() =>
    this.popupFailed() ? 'auth.popupBlocked' : null,
  );

  protected async signIn(): Promise<void> {
    this.popupFailed.set(false);

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
      this.popupFailed.set(true);
    }
  }
}
