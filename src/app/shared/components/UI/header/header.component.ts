import { Component, computed, inject, OnInit, Signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgOptimizedImage } from '@angular/common';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonComponent } from '../../button/button.component';
import { SessionService } from '../../../../auth/session.service';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, MatSlideToggle, ButtonComponent, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private translateService: TranslateService = inject(TranslateService);
  private readonly session: SessionService = inject(SessionService);
  private readonly router: Router = inject(Router);

  public defaultLanguage = true;

  protected readonly title: string = 'Britannia Reports';

  /**
   * The signed-in address, or `null` on every other state — so the sign-in
   * screen keeps only the language toggle.
   *
   * Showing the address is not decoration: two Google accounts in one browser
   * is the ordinary case, and from S-02 onward this is what tells a teacher
   * whose students and templates are on screen.
   */
  protected readonly email: Signal<string | null> = computed(() => {
    const state = this.session.state();

    return state.status === 'authorized' ? state.email : null;
  });

  ngOnInit(): void {
    this.translateService.setDefaultLang('pl');
  }

  public switchLanguage(): void {
    this.defaultLanguage = !this.defaultLanguage;
    this.translateService.use(this.defaultLanguage ? 'pl' : 'en');
  }

  /**
   * The shell is already activated, so dropping the session does not by itself
   * move the user off it — the navigation has to be explicit, exactly as it
   * does after signing in.
   */
  protected async signOut(): Promise<void> {
    // Navigate whatever happens. By the time this rejects the local session is
    // already gone or unreadable, so leaving the user parked inside the shell
    // is the worse outcome — `authGuard` re-checks on the way back in.
    try {
      await this.session.signOut();
    } catch (error: unknown) {
      console.error('Sign-out did not complete cleanly', error);
    }

    await this.router.navigate(['/sign-in']);
  }
}
