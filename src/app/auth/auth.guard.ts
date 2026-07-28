import { inject, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { filter, map, Observable, take } from 'rxjs';
import { SessionState } from '../model/auth.interface';
import { SessionService } from './session.service';

/**
 * Emits once, as soon as the session state is no longer `resolving`.
 *
 * Guards return this rather than reading the signal directly so the router
 * holds the navigation pending while the session is still being worked out.
 * Deciding early is what produces a redirect to the sign-in screen followed by
 * an immediate bounce back — the flicker FR-004 users would read as a bug.
 */
const settledState = (): Observable<SessionState> => {
  const session: SessionService = inject(SessionService);
  const injector: Injector = inject(Injector);

  return toObservable(session.state, { injector }).pipe(
    filter((state: SessionState) => state.status !== 'resolving'),
    take(1),
  );
};

/** Lets only an allowlisted, signed-in user through; everyone else goes to the sign-in screen. */
export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const router: Router = inject(Router);
  const settled: Observable<SessionState> = settledState();

  return settled.pipe(
    map((state: SessionState) =>
      state.status === 'authorized' ? true : router.createUrlTree(['/sign-in']),
    ),
  );
};

/** Keeps a signed-in user off the sign-in screen — the mirror of `authGuard`. */
export const signInGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const router: Router = inject(Router);
  const settled: Observable<SessionState> = settledState();

  return settled.pipe(
    map((state: SessionState) => (state.status === 'authorized' ? router.createUrlTree(['/']) : true)),
  );
};
