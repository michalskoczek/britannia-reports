import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { renderBootFailure } from './boot-failure';

/**
 * A failed boot is reported three ways, and it needs all three.
 *
 * `renderBootFailure` is the user-facing one — the equivalent of returning the
 * error rather than swallowing it, since a browser app's "response" is what ends
 * up on screen. `console.error` keeps the full object, stack included, for
 * whoever has devtools open. The re-throw is what propagates: it surfaces as an
 * `unhandledrejection`, which is the only form any error reporting added later
 * can actually see. Catching without re-throwing marks the failure as handled
 * and makes the app look, to every automated observer, as though it started.
 */
bootstrapApplication(AppComponent, appConfig).catch((error: unknown) => {
  console.error('Bootstrapping the application failed', error);

  renderBootFailure(error);

  throw error;
});
