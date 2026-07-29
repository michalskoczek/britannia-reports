import { signal, WritableSignal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { SessionState } from '../model/auth.interface';
import { authGuard, signInGuard } from './auth.guard';
import { SessionService } from './session.service';

describe('auth guards', () => {
  let state: WritableSignal<SessionState>;

  const run = (guard: CanActivateFn): Observable<boolean | UrlTree> =>
    TestBed.runInInjectionContext(
      () => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot) as Observable<boolean | UrlTree>,
    );

  /** Subscribes and reports the single decision, or `undefined` if none came. */
  const decide = (guard: CanActivateFn): (() => boolean | UrlTree | undefined) => {
    let decision: boolean | UrlTree | undefined;

    run(guard).subscribe((value: boolean | UrlTree) => (decision = value));

    return () => decision;
  };

  beforeEach(() => {
    state = signal<SessionState>({ status: 'resolving' });

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // `useFactory`, not `useValue`: `toObservable` needs an injection
        // context, and the guards now read `state$` rather than building their
        // own stream from the signal.
        { provide: SessionService, useFactory: () => ({ state, state$: toObservable(state) }) },
      ],
    });
  });

  it('holds the navigation while the session is still resolving', fakeAsync(() => {
    const decision = decide(authGuard);

    tick();

    expect(decision()).toBeUndefined();
  }));

  it('lets an authorized user through', fakeAsync(() => {
    const decision = decide(authGuard);

    state.set({ status: 'authorized', email: 'anna@britannia.pl', role: 'teacher' });
    tick();

    expect(decision()).toBeTrue();
  }));

  it('sends an anonymous visitor to the sign-in screen', fakeAsync(() => {
    const decision = decide(authGuard);

    state.set({ status: 'anonymous' });
    tick();

    expect(decision()?.toString()).toBe('/sign-in');
  }));

  it('sends a refused account to the sign-in screen, for either reason', fakeAsync(() => {
    const notAllowlisted = decide(authGuard);

    state.set({ status: 'denied', reason: 'not-allowlisted' });
    tick();

    expect(notAllowlisted()?.toString()).toBe('/sign-in');

    const lookupFailed = decide(authGuard);

    state.set({ status: 'denied', reason: 'lookup-failed' });
    tick();

    expect(lookupFailed()?.toString()).toBe('/sign-in');
  }));

  it('keeps a signed-in user off the sign-in screen', fakeAsync(() => {
    const decision = decide(signInGuard);

    state.set({ status: 'authorized', email: 'anna@britannia.pl', role: 'director' });
    tick();

    expect(decision()?.toString()).toBe('/');
  }));

  it('lets everyone else onto the sign-in screen', fakeAsync(() => {
    const decision = decide(signInGuard);

    state.set({ status: 'denied', reason: 'not-allowlisted' });
    tick();

    expect(decision()).toBeTrue();
  }));
});
