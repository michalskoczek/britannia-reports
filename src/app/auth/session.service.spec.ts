import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { User } from '@angular/fire/auth';
import { Subject } from 'rxjs';
import { AllowlistEntry } from '../model/auth.interface';
import { AllowlistGateway } from './allowlist.gateway';
import { AuthGateway } from './auth.gateway';
import { SessionService } from './session.service';

/**
 * With the emulator suite deferred to S-02/S-03, this spec is the gate's
 * primary automated barrier. It drives the state machine through both gateways
 * as fakes — which is the whole reason those gateways exist.
 *
 * The service is constructed inside each test rather than in `beforeEach`:
 * `toSignal` subscribes on construction, and the first auth emission resolves
 * through a promise. Built outside the `fakeAsync` zone, that microtask belongs
 * to the root zone and `tick()` never flushes it.
 */
describe('SessionService', () => {
  const allowlistedUser = { email: 'anna.kowalska@britannia.pl' } as User;
  const email: string = allowlistedUser.email!;

  let authGateway: {
    user$: Subject<User | null>;
    signInWithGoogle: jasmine.Spy;
    signOut: jasmine.Spy;
  };
  let allowlistGateway: { lookup: jasmine.Spy };

  const createService = (): SessionService => TestBed.inject(SessionService);

  beforeEach(() => {
    authGateway = {
      user$: new Subject<User | null>(),
      signInWithGoogle: jasmine.createSpy('signInWithGoogle').and.resolveTo(),
      // A plain Subject, not a BehaviorSubject: the real `authState` emits
      // nothing until Firebase has restored (or failed to restore) a session,
      // and that gap is the whole reason the service starts out resolving.
      //
      // The real sign-out ends the session, so the fake must push the stream
      // back to null — the denial cases depend on that follow-up emission.
      signOut: jasmine.createSpy('signOut').and.callFake(async () => {
        authGateway.user$.next(null);
      }),
    };

    allowlistGateway = {
      lookup: jasmine.createSpy('lookup').and.resolveTo(null),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthGateway, useValue: authGateway },
        { provide: AllowlistGateway, useValue: allowlistGateway },
      ],
    });
  });

  it('starts out resolving, before the first auth emission arrives', () => {
    const service: SessionService = createService();

    expect(service.state()).toEqual({ status: 'resolving' });
  });

  it('resolves to anonymous when nobody is signed in', fakeAsync(() => {
    const service: SessionService = createService();

    authGateway.user$.next(null);
    tick();

    expect(service.state()).toEqual({ status: 'anonymous' });
    expect(allowlistGateway.lookup).not.toHaveBeenCalled();
  }));

  it('goes back to resolving while the allowlist lookup is in flight', fakeAsync(() => {
    allowlistGateway.lookup.and.resolveTo({ role: 'teacher' });

    const service: SessionService = createService();

    authGateway.user$.next(null);
    tick();
    expect(service.state()).toEqual({ status: 'anonymous' });

    authGateway.user$.next(allowlistedUser);

    // A guard consulted here must not be told "anonymous" — the lookup has not
    // answered yet, and a stale answer sends the user back to the sign-in
    // screen with nothing left to bring them off it.
    expect(service.state()).toEqual({ status: 'resolving' });

    tick();
    expect(service.state().status).toBe('authorized');
  }));

  it('resolves to authorized, carrying the email and the role, for an allowlisted account', fakeAsync(() => {
    const entry: AllowlistEntry = { role: 'director' };
    allowlistGateway.lookup.and.resolveTo(entry);

    const service: SessionService = createService();

    authGateway.user$.next(allowlistedUser);
    tick();

    expect(allowlistGateway.lookup).toHaveBeenCalledWith(email);
    expect(service.state()).toEqual({ status: 'authorized', email, role: 'director' });
  }));

  it('denies and signs out an account that is not on the allowlist', fakeAsync(() => {
    allowlistGateway.lookup.and.resolveTo(null);

    const service: SessionService = createService();

    authGateway.user$.next(allowlistedUser);
    tick();

    expect(authGateway.signOut).toHaveBeenCalled();
    expect(service.state()).toEqual({ status: 'denied', reason: 'not-allowlisted' });
  }));

  it('denies with the technical reason when the lookup itself fails', fakeAsync(() => {
    spyOn(console, 'error');
    allowlistGateway.lookup.and.rejectWith(new Error('permission-denied'));

    const service: SessionService = createService();

    authGateway.user$.next(allowlistedUser);
    tick();

    expect(authGateway.signOut).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
    expect(service.state()).toEqual({ status: 'denied', reason: 'lookup-failed' });
  }));

  it('keeps the denial reason through the sign-out it triggers', fakeAsync(() => {
    allowlistGateway.lookup.and.resolveTo(null);

    const service: SessionService = createService();

    authGateway.user$.next(allowlistedUser);
    tick();
    // The forced sign-out pushes the auth stream back to null; without a
    // separate denial signal the state would collapse to plain anonymous here.
    tick();

    expect(service.state()).toEqual({ status: 'denied', reason: 'not-allowlisted' });
  }));

  it('does not finish signing out until the state stops saying authorized', fakeAsync(() => {
    allowlistGateway.lookup.and.resolveTo({ role: 'teacher' });
    // Firebase resolves its own promise without waiting for the auth stream,
    // so this fake deliberately does not push the follow-up emission.
    authGateway.signOut.and.resolveTo();

    const service: SessionService = createService();

    authGateway.user$.next(allowlistedUser);
    tick();
    expect(service.state().status).toBe('authorized');

    let finished = false;
    void service.signOut().then(() => (finished = true));
    tick();

    // Navigating here would hand signInGuard a stale "authorized" and bounce
    // the user back into the shell they are leaving.
    expect(finished).toBeFalse();

    authGateway.user$.next(null);
    tick();

    expect(finished).toBeTrue();
    expect(service.state()).toEqual({ status: 'anonymous' });
  }));

  it('clears the denial reason when a new sign-in attempt starts', fakeAsync(() => {
    allowlistGateway.lookup.and.resolveTo(null);

    const service: SessionService = createService();

    authGateway.user$.next(allowlistedUser);
    tick();

    void service.signIn();
    tick();

    expect(authGateway.signInWithGoogle).toHaveBeenCalled();
    expect(service.state()).toEqual({ status: 'anonymous' });
  }));

  it('clears the denial reason on an explicit sign-out', fakeAsync(() => {
    spyOn(console, 'error');
    allowlistGateway.lookup.and.rejectWith(new Error('offline'));

    const service: SessionService = createService();

    authGateway.user$.next(allowlistedUser);
    tick();

    void service.signOut();
    tick();

    expect(service.state()).toEqual({ status: 'anonymous' });
  }));
});
