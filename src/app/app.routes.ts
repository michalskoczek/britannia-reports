import { Routes } from '@angular/router';
import { authGuard, signInGuard } from './auth/auth.guard';
import { SignInComponent } from './auth/sign-in/sign-in.component';
import { ShellComponent } from './shell/shell.component';
import { StudentRosterComponent } from './students/student-roster/student-roster.component';

/**
 * The whole routing surface: a sign-in address, the report shell, and the
 * student roster.
 *
 * Routing still stops short of the report types. Inside the shell they are
 * composed by `TabData.tabs` through `NgComponentOutlet` — a route per report
 * type would rewrite that registry for no gain. `/students` is not an exception
 * to that: a roster is neither a report nor a tab, so it gets the router's
 * answer to "which surface am I on" rather than the registry's answer to "which
 * report am I looking at".
 *
 * The consequence is deliberate and recorded: leaving the shell destroys it, so
 * navigating to the roster resets the active tab and drops an unsaved report
 * form. Managing a roster is a before-you-write-reports task, so that is
 * tolerable here; `S-04`'s in-report picker is where it stops being tolerable.
 *
 * No lazy loading: the app is a single bundle and chunk boundaries here buy
 * nothing.
 */
export const routes: Routes = [
  { path: 'sign-in', component: SignInComponent, canActivate: [signInGuard] },
  { path: '', pathMatch: 'full', component: ShellComponent, canActivate: [authGuard] },
  { path: 'students', component: StudentRosterComponent, canActivate: [authGuard] },
  // Must stay last: the wildcard swallows every route declared after it.
  { path: '**', redirectTo: '' },
];
