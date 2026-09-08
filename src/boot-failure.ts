/**
 * What the page shows when `bootstrapApplication` rejects.
 *
 * Deliberately free of every Angular, Material and `ngx-translate` import: this
 * runs precisely when the application failed to start, so anything that needs
 * the app to be running is unavailable. Plain DOM and inline styles only — the
 * stylesheet is a separate bundle and may itself be the thing that did not load.
 *
 * The two languages are hard-coded for the same reason. FR-018 puts the PL/EN
 * toggle on every screen, and `ngx-translate` cannot serve this one, so both
 * lines are printed at once with Polish first — the app's default language.
 */

/** So a second failure replaces the panel instead of stacking another one. */
const BOOT_FAILURE_ID = 'boot-failure';

const PANEL_STYLE: string = [
  'font-family: Montserrat, Roboto, system-ui, sans-serif',
  'max-width: 42rem',
  'margin: 4rem auto',
  'padding: 1.5rem',
  'border: 1px solid #d32f2f',
  'border-radius: 8px',
  'color: #1a1a1a',
  'background: #fff',
].join(';');

/**
 * One line of detail a teacher can read out to whoever supports them.
 *
 * `String(error)` on a plain object yields `[object Object]`, which tells nobody
 * anything — so an `Error` is unwrapped by hand and everything else falls back
 * to JSON before it falls back to `String`.
 */
export function describeBootFailure(error: unknown): string {
  if (error instanceof Error) {
    return error.message.length > 0 ? `${error.name}: ${error.message}` : error.name;
  }

  if (typeof error === 'object' && error !== null) {
    try {
      return JSON.stringify(error);
    } catch {
      // A circular or unserializable value. `String` is all that is left, and it
      // is still better than throwing from the failure handler itself.
      return String(error);
    }
  }

  return String(error);
}

/**
 * Replaces the blank page with a readable failure, and says how to retry.
 *
 * Without this the boot rejection reached `console.error` and nothing else:
 * `index.html` renders an empty `<app-root>`, so the teacher sat in front of a
 * white screen with no message, no reason and no next step, while the only
 * record of what went wrong was in a devtools panel they never open.
 */
export function renderBootFailure(error: unknown, host: Element = document.body): void {
  host.querySelector(`#${BOOT_FAILURE_ID}`)?.remove();

  const panel: HTMLDivElement = document.createElement('div');

  panel.id = BOOT_FAILURE_ID;
  panel.setAttribute('role', 'alert');
  panel.setAttribute('style', PANEL_STYLE);

  const heading: HTMLHeadingElement = document.createElement('h1');

  heading.setAttribute('style', 'font-size: 1.25rem; margin: 0 0 0.75rem');
  heading.textContent = 'Nie udało się uruchomić aplikacji / The application failed to start';

  const advice: HTMLParagraphElement = document.createElement('p');

  advice.setAttribute('style', 'margin: 0 0 1rem');
  advice.textContent =
    'Odśwież stronę. Jeśli błąd się powtarza, przekaż poniższy komunikat osobie, ' +
    'która opiekuje się aplikacją. / Reload the page. If this keeps happening, ' +
    'pass the message below to whoever maintains the application.';

  // `<pre>` rather than a paragraph: SDK messages arrive with newlines in them,
  // and a wrapped one-liner is what makes them unreadable when read aloud.
  const detail: HTMLPreElement = document.createElement('pre');

  detail.setAttribute(
    'style',
    'margin: 0 0 1rem; padding: 0.75rem; overflow-x: auto; white-space: pre-wrap; ' +
      'background: #f5f5f5; border-radius: 4px; font-size: 0.875rem',
  );
  // `textContent`, never `innerHTML`. The message can carry anything the failing
  // dependency put in it.
  detail.textContent = describeBootFailure(error);

  const retry: HTMLButtonElement = document.createElement('button');

  retry.type = 'button';
  retry.setAttribute(
    'style',
    'padding: 0.5rem 1.25rem; border: 0; border-radius: 4px; cursor: pointer; ' +
      'background: #1a1a1a; color: #fff; font: inherit',
  );
  retry.textContent = 'Odśwież / Reload';
  retry.addEventListener('click', () => location.reload());

  panel.append(heading, advice, detail, retry);
  host.append(panel);
}
