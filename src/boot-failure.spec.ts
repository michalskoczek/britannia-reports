import { describeBootFailure, renderBootFailure } from './boot-failure';

/**
 * The boot handler is the one piece of this app that runs when nothing else
 * works, so the spec drives it through plain DOM rather than `TestBed` — a
 * fixture would prove it works in exactly the conditions it never runs in.
 *
 * The retry button's click is deliberately never dispatched: it calls
 * `location.reload()`, which would restart the Karma runner mid-suite.
 */
describe('boot failure', () => {
  let host: HTMLElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.append(host);
  });

  afterEach(() => host.remove());

  describe('describeBootFailure', () => {
    it('names the error and its message', () => {
      expect(describeBootFailure(new TypeError('cls is not a constructor'))).toBe(
        'TypeError: cls is not a constructor'
      );
    });

    it('falls back to the name when an Error carries no message', () => {
      expect(describeBootFailure(new Error(''))).toBe('Error');
    });

    it('serializes a thrown object rather than reporting [object Object]', () => {
      expect(describeBootFailure({ code: 'auth/invalid-api-key' })).toBe('{"code":"auth/invalid-api-key"}');
    });

    it('survives a value JSON cannot serialize', () => {
      const circular: Record<string, unknown> = {};

      circular['self'] = circular;

      expect(() => describeBootFailure(circular)).not.toThrow();
    });

    it('describes a non-object rejection', () => {
      expect(describeBootFailure('boom')).toBe('boom');
    });
  });

  describe('renderBootFailure', () => {
    it('puts the reason and a retry in front of the user', () => {
      renderBootFailure(new Error('Firebase: Error (auth/invalid-api-key)'), host);

      expect(host.textContent).toContain('Nie udało się uruchomić aplikacji');
      expect(host.textContent).toContain('The application failed to start');
      expect(host.textContent).toContain('auth/invalid-api-key');
      expect(host.querySelector('button')).not.toBeNull();
    });

    it('announces itself to a screen reader', () => {
      renderBootFailure(new Error('boom'), host);

      expect(host.querySelector('[role="alert"]')).not.toBeNull();
    });

    it('renders the message as text, never as markup', () => {
      renderBootFailure(new Error('<img src=x onerror="alert(1)">'), host);

      expect(host.querySelector('img')).toBeNull();
      expect(host.textContent).toContain('<img src=x onerror="alert(1)">');
    });

    it('replaces a previous panel instead of stacking a second one', () => {
      renderBootFailure(new Error('first'), host);
      renderBootFailure(new Error('second'), host);

      expect(host.querySelectorAll('[role="alert"]').length).toBe(1);
      expect(host.textContent).toContain('second');
      expect(host.textContent).not.toContain('first');
    });
  });
});
