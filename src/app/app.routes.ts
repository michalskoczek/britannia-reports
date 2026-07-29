import { Routes } from '@angular/router';
import { authGuard, signInGuard } from './auth/auth.guard';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { ShellComponent } from './shell/shell.component';

/**
 * The whole routing surface: a sign-in address and a guarded everything-else.
 *
 * Routing stops at the shell deliberately. Inside it, the four report types are
 * still composed by `TabData.tabs` through `NgComponentOutlet` — a route per
 * report type would rewrite that registry, which is not what this change is for.
 *
 * No lazy loading: the app is a single bundle and chunk boundaries here buy
 * nothing.
 */
export const routes: Routes = [
  { path: 'sign-in', component: SignInComponent, canActivate: [signInGuard] },
  { path: '', pathMatch: 'full', component: ShellComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
