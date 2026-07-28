import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { SessionState } from '../../model/auth.interface';
import { translateTestingImports } from '../../shared/testing/translate-testing';
import { SessionService } from '../session.service';
import { SignInComponent } from './sign-in.component';

describe('SignInComponent', () => {
  let state: WritableSignal<SessionState>;
  let signIn: jasmine.Spy;
  let navigate: jasmine.Spy;
  let fixture: ComponentFixture<SignInComponent>;

  const errorTexts = (): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.sign-in-error')).map((element) =>
      (element as HTMLElement).textContent!.trim(),
    );

  beforeEach(async () => {
    state = signal<SessionState>({ status: 'anonymous' });
    signIn = jasmine.createSpy('signIn').and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [SignInComponent, ...translateTestingImports],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: SessionService, useValue: { state, signIn } },
      ],
    }).compileComponents();

    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(SignInComponent);
    fixture.detectChanges();
  });

  it('renders with no error message for an anonymous visitor', () => {
    expect(fixture.nativeElement.querySelector('button')).toBeTruthy();
    expect(errorTexts()).toEqual([]);
  });

  it('starts a sign-in when the button is pressed', () => {
    fixture.nativeElement.querySelector('button').click();

    expect(signIn).toHaveBeenCalled();
  });

  it('leaves the sign-in route once the sign-in completes', async () => {
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    // Guards only run on activation, so without this navigation a successful
    // sign-in leaves the user sitting on the sign-in screen.
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('stays put when the sign-in never completes', async () => {
    signIn.and.rejectWith({ code: 'auth/popup-blocked' });
    spyOn(console, 'error');

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('shows the no-access message for an account that is not on the allowlist', () => {
    state.set({ status: 'denied', reason: 'not-allowlisted' });
    fixture.detectChanges();

    expect(errorTexts()).toEqual(['auth.noAccess']);
  });

  it('shows the verification-failed message when the lookup itself failed', () => {
    state.set({ status: 'denied', reason: 'lookup-failed' });
    fixture.detectChanges();

    expect(errorTexts()).toEqual(['auth.verificationFailed']);
  });

  it('shows the blocked-popup message when the popup never opened', async () => {
    signIn.and.rejectWith({ code: 'auth/popup-blocked' });
    spyOn(console, 'error');

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(errorTexts()).toEqual(['auth.popupBlocked']);
  });

  it('stays silent when the user simply closes the popup', async () => {
    signIn.and.rejectWith({ code: 'auth/popup-closed-by-user' });

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(errorTexts()).toEqual([]);
  });
});
