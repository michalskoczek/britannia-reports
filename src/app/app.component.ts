import { Component, computed, inject, Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderComponent } from './shared/components/UI/header/header.component';
import { SessionService } from './auth/session.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, MatProgressSpinner, TranslateModule],
})
export class AppComponent {
  private readonly session: SessionService = inject(SessionService);

  /**
   * While this is true the guards are still holding their navigation, so the
   * outlet renders nothing and this indicator is all the user sees.
   *
   * The indicator sits *alongside* `<router-outlet>` rather than wrapping it:
   * removing the outlet from the DOM would make route activation depend on the
   * outlet registering after a pending navigation resolves.
   */
  protected readonly isResolving: Signal<boolean> = computed(
    () => this.session.state().status === 'resolving',
  );
}
