import { Provider, signal } from '@angular/core';
import { SessionService } from '../../auth/session.service';
import { SessionState } from '../../model/auth.interface';
import { StudentsGateway } from '../../students/students.gateway';
import { TemplatesGateway } from '../../templates/templates.gateway';

/**
 * What a spec needs to render `SemestrReportComponent`.
 *
 * The report mounts two panels that reach Firebase: `app-template-panel` through
 * `TemplatesGateway` (`S-02`) and `app-student-picker` through `StudentsGateway`
 * (`S-04`). Both gateways inject SDK handles (`Firestore`, `Auth`) that no
 * `TestBed` provides, and so does `SessionService` — so any spec that creates the
 * component needs all three stubs even when it has nothing to say about either
 * panel. `semestr-report.component.spec.ts` and the PDF capture harness both do.
 *
 * Widened rather than joined by a second helper on purpose: a spec that spread
 * only one of two lists would fail on a dependency it never mentions, in a file
 * about something else entirely. One list, and mounting a third panel is one
 * edit here.
 *
 * The session is `anonymous` on purpose: both panels then load nothing, render
 * their "not signed in" line, and stay out of the way of whatever the spec is
 * actually about. A spec that wants a panel's own behaviour should use
 * `template-panel.component.spec.ts`'s or `student-picker.component.spec.ts`'s
 * fakes instead, which model the store.
 */
export const semestrReportTestingProviders = (): Provider[] => [
  {
    provide: TemplatesGateway,
    useValue: {
      list: () => Promise.resolve([]),
      create: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    },
  },
  {
    provide: StudentsGateway,
    useValue: {
      list: () => Promise.resolve([]),
      create: () => Promise.resolve('student-id'),
      update: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    },
  },
  {
    provide: SessionService,
    useValue: { state: signal<SessionState>({ status: 'anonymous' }) },
  },
];
