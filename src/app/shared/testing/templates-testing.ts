import { Provider, signal } from '@angular/core';
import { SessionService } from '../../auth/session.service';
import { SessionState } from '../../model/auth.interface';
import { TemplatesGateway } from '../../templates/templates.gateway';

/**
 * What a spec needs to render a component that mounts `app-template-panel`.
 *
 * The panel reaches Firebase through `TemplatesGateway` and the session through
 * `SessionService`; both inject SDK handles (`Firestore`, `Auth`) that no
 * `TestBed` provides. Any spec that renders `SemestrReportComponent` therefore
 * needs these two stubs even when it has nothing to say about templates —
 * `semestr-report.component.spec.ts` and the PDF capture harness both do.
 *
 * The session is `anonymous` on purpose: the panel then loads nothing, renders
 * its "not signed in" line, and stays out of the way of whatever the spec is
 * actually about. A spec that wants the panel's own behaviour should use
 * `template-panel.component.spec.ts`'s fakes instead, which model the store.
 */
export const templatePanelTestingProviders = (): Provider[] => [
  {
    provide: TemplatesGateway,
    useValue: {
      list: () => Promise.resolve([]),
      create: () => Promise.resolve(),
      remove: () => Promise.resolve(),
    },
  },
  {
    provide: SessionService,
    useValue: { state: signal<SessionState>({ status: 'anonymous' }) },
  },
];
