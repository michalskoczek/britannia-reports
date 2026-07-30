import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SessionService } from '../../auth/session.service';
import { SessionState } from '../../model/auth.interface';
import { ReportTemplateFields } from '../../model/report-template.interface';
import { translateTestingImports } from '../../shared/testing/translate-testing';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { TEMPLATE_DOMAIN_DEFAULTS } from '../template-domain';
import { StoredTemplate, TemplatesGateway } from '../templates.gateway';
import { TemplatePanelComponent } from './template-panel.component';

/**
 * Driven against the real `TemplatesService` behind a fake `TemplatesGateway`.
 *
 * Faking the service instead would mean asserting the panel against a fake of the
 * very logic — "is this name taken", "is this template empty", "what would this
 * apply cost" — that decides what the panel does. The gateway is the seam that
 * exists to be faked, so the interesting decisions run for real here and only
 * Firebase is replaced.
 *
 * `MatDialog.open` is spied rather than rendered: `confirm-dialog.component.spec.ts`
 * owns the dialog's own behaviour, and what matters here is which questions the
 * panel asks and whether it acts only on a yes.
 */
describe('TemplatePanelComponent', () => {
  const UID = 'firebase-uid-anna';

  let sessionState: WritableSignal<SessionState>;
  let gateway: { list: jasmine.Spy; create: jasmine.Spy; remove: jasmine.Spy };
  let snackBar: { open: jasmine.Spy };
  let dialogOpen: jasmine.Spy;
  let applied: ReportTemplateFields[];
  let fixture: ComponentFixture<TemplatePanelComponent>;

  const fields = (overrides: Partial<ReportTemplateFields> = {}): ReportTemplateFields => ({
    ...TEMPLATE_DOMAIN_DEFAULTS,
    ...overrides,
  });

  const stored = (id: string, name: string, templateFields: ReportTemplateFields): StoredTemplate => ({
    id,
    data: { name, fields: templateFields },
  });

  const firebaseError = (code: string): Error => Object.assign(new Error(code), { code });

  /** Escape and a backdrop click close with `undefined`; only `true` is a yes. */
  const dialogClosingWith = (result: boolean | undefined): MatDialogRef<ConfirmDialogComponent, boolean> =>
    ({ afterClosed: () => of(result) }) as unknown as MatDialogRef<ConfirmDialogComponent, boolean>;

  const render = async (currentFields: ReportTemplateFields = fields()): Promise<void> => {
    fixture = TestBed.createComponent(TemplatePanelComponent);
    fixture.componentRef.setInput('currentFields', currentFields);

    applied = [];
    fixture.componentInstance.apply.subscribe((payload: ReportTemplateFields) => applied.push(payload));

    fixture.detectChanges();

    // The list load starts in `ngOnInit`; without settling it every assertion
    // below would see the loading state.
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const nameInput = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('.template-panel-name input') as HTMLInputElement;

  const typeName = (value: string): void => {
    const input: HTMLInputElement = nameInput();

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const pressSave = (): void => {
    (fixture.nativeElement.querySelector('.template-panel-save-button button') as HTMLButtonElement).click();
  };

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.template-panel-item'));

  const listedNames = (): string[] =>
    rows().map((row) => row.querySelector('.template-panel-item-name')!.textContent!.trim());

  const rowButton = (index: number, action: 'apply' | 'delete'): HTMLButtonElement => {
    const buttons: NodeListOf<HTMLButtonElement> = rows()[index].querySelectorAll('button');

    return buttons[action === 'apply' ? 0 : 1];
  };

  const text = (selector: string): string | null => {
    const element: HTMLElement | null = fixture.nativeElement.querySelector(selector);

    return element === null ? null : element.textContent!.trim();
  };

  const snackBarMessages = (): string[] => snackBar.open.calls.all().map((call) => call.args[0] as string);

  const dialogData = (): ConfirmDialogData => dialogOpen.calls.mostRecent().args[1].data as ConfirmDialogData;

  beforeEach(async () => {
    sessionState = signal<SessionState>({
      status: 'authorized',
      uid: UID,
      email: 'anna.kowalska@britannia.pl',
      role: 'teacher',
    });

    gateway = {
      list: jasmine.createSpy('list').and.resolveTo([]),
      create: jasmine.createSpy('create').and.resolveTo(),
      remove: jasmine.createSpy('remove').and.resolveTo(),
    };

    snackBar = { open: jasmine.createSpy('open') };

    await TestBed.configureTestingModule({
      imports: [TemplatePanelComponent, ...translateTestingImports],
      providers: [
        provideNoopAnimations(),
        { provide: TemplatesGateway, useValue: gateway },
        { provide: SessionService, useValue: { state: sessionState } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    dialogOpen = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogClosingWith(true));
  });

  describe('the list', () => {
    it('explains an empty list instead of leaving a blank area', async () => {
      await render();

      expect(text('.template-panel-note')).toBe('templates.empty');
      expect(rows()).toEqual([]);
    });

    it('lists the teacher`s templates', async () => {
      gateway.list.and.resolveTo([
        stored('klasa 6', 'Klasa 6', fields({ course: 'B1' })),
        stored('klasa 5', 'Klasa 5', fields({ course: 'A2' })),
      ]);

      await render();

      expect(listedNames()).toEqual(['Klasa 5', 'Klasa 6']);
    });

    it('reports a failed load inline with a retry, not in a snackbar', async () => {
      spyOn(console, 'error');
      gateway.list.and.rejectWith(firebaseError('unavailable'));

      await render();

      // A snackbar disappears; the area it was explaining stays empty.
      expect(text('.template-panel-failure')).toContain('templates.errors.offline');
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('loads the list again when the retry is pressed', async () => {
      spyOn(console, 'error');
      gateway.list.and.rejectWith(firebaseError('unavailable'));

      await render();

      gateway.list.and.resolveTo([stored('klasa 5', 'Klasa 5', fields({ course: 'A2' }))]);
      (fixture.nativeElement.querySelector('.template-panel-failure button') as HTMLButtonElement).click();
      await settle();

      expect(fixture.nativeElement.querySelector('.template-panel-failure')).toBeNull();
      expect(listedNames()).toEqual(['Klasa 5']);
    });
  });

  describe('save', () => {
    it('never reaches the store with an unusable name', async () => {
      await render();

      typeName('   ');
      pressSave();
      await settle();

      expect(gateway.create).not.toHaveBeenCalled();
      expect(text('.template-panel-error')).toBe('templates.errors.nameRequired');
    });

    it('saves the fields the report currently holds and confirms it', async () => {
      await render(fields({ course: 'A2', realizedMaterial: 'Units 1-8' }));

      typeName('  Klasa 5   Semestr  ');
      pressSave();
      await settle();

      expect(gateway.create).toHaveBeenCalledWith(
        UID,
        'klasa 5 semestr',
        jasmine.objectContaining({
          name: 'Klasa 5   Semestr',
          fields: fields({ course: 'A2', realizedMaterial: 'Units 1-8' }),
        })
      );
      expect(snackBarMessages()).toEqual(['templates.saved']);
      expect(listedNames()).toEqual(['Klasa 5   Semestr']);
      expect(nameInput().value).toBe('');
    });

    it('rejects a duplicate name that differs only in case and spacing', async () => {
      gateway.list.and.resolveTo([stored('klasa 5 semestr', 'Klasa 5 semestr', fields({ course: 'A2' }))]);

      await render();

      typeName('KLASA  5   Semestr');
      pressSave();
      await settle();

      expect(gateway.create).not.toHaveBeenCalled();
      expect(text('.template-panel-error')).toBe('templates.errors.nameTaken');
      expect(listedNames()).toEqual(['Klasa 5 semestr']);
    });

    it('clears the name message as soon as the name changes', async () => {
      await render();

      typeName('a/b');
      pressSave();
      await settle();
      expect(text('.template-panel-error')).toBe('templates.errors.nameInvalid');

      typeName('Klasa 5');

      expect(fixture.nativeElement.querySelector('.template-panel-error')).toBeNull();
    });

    it('shows a rejected save in the snackbar and leaves the list unchanged', async () => {
      spyOn(console, 'error');
      gateway.list.and.resolveTo([stored('klasa 5', 'Klasa 5', fields({ course: 'A2' }))]);
      gateway.create.and.rejectWith(firebaseError('permission-denied'));

      await render();

      typeName('Klasa 6');
      pressSave();
      await settle();

      expect(snackBarMessages()).toEqual(['templates.errors.permissionDenied']);
      expect(listedNames()).toEqual(['Klasa 5']);
    });
  });

  describe('apply', () => {
    it('emits nothing for an all-defaults template and says why', async () => {
      // US-01: an empty template applies as a no-op — and no dialog is opened,
      // because there is nothing to ask about.
      gateway.list.and.resolveTo([stored('pusty', 'Pusty', fields())]);

      await render(fields({ course: 'B1' }));

      rowButton(0, 'apply').click();
      await settle();

      expect(applied).toEqual([]);
      expect(dialogOpen).not.toHaveBeenCalled();
      expect(snackBarMessages()).toEqual(['templates.nothingToApply']);
    });

    it('emits without asking when nothing the teacher typed is at stake', async () => {
      gateway.list.and.resolveTo([stored('klasa 5', 'Klasa 5', fields({ course: 'A2' }))]);

      await render();

      rowButton(0, 'apply').click();
      await settle();

      expect(dialogOpen).not.toHaveBeenCalled();
      expect(applied).toEqual([fields({ course: 'A2' })]);
    });

    it('lists overwritten and cleared fields separately before emitting', async () => {
      gateway.list.and.resolveTo([stored('klasa 5', 'Klasa 5', fields({ course: 'A2', realizedMaterial: null }))]);

      await render(fields({ course: 'B1', realizedMaterial: 'Units 1-8' }));

      rowButton(0, 'apply').click();
      await settle();

      expect(dialogOpen).toHaveBeenCalled();
      expect(dialogData().itemGroups).toEqual([
        { titleKey: 'templates.confirmApply.overwritten', items: ['templates.fields.course'] },
        { titleKey: 'templates.confirmApply.cleared', items: ['templates.fields.realizedMaterial'] },
      ]);
      expect(applied).toEqual([fields({ course: 'A2', realizedMaterial: null })]);
    });

    it('emits nothing when the prompt is cancelled', async () => {
      dialogOpen.and.returnValue(dialogClosingWith(false));
      gateway.list.and.resolveTo([stored('klasa 5', 'Klasa 5', fields({ course: 'A2' }))]);

      await render(fields({ course: 'B1' }));

      rowButton(0, 'apply').click();
      await settle();

      expect(applied).toEqual([]);
    });

    it('emits nothing when the prompt is dismissed rather than answered', async () => {
      // Escape and a backdrop click both close with `undefined`.
      dialogOpen.and.returnValue(dialogClosingWith(undefined));
      gateway.list.and.resolveTo([stored('klasa 5', 'Klasa 5', fields({ course: 'A2' }))]);

      await render(fields({ course: 'B1' }));

      rowButton(0, 'apply').click();
      await settle();

      expect(applied).toEqual([]);
    });
  });

  describe('delete', () => {
    it('deletes only after the prompt is confirmed', async () => {
      gateway.list.and.resolveTo([
        stored('klasa 5', 'Klasa 5', fields({ course: 'A2' })),
        stored('klasa 6', 'Klasa 6', fields({ course: 'B1' })),
      ]);

      await render();

      rowButton(0, 'delete').click();
      await settle();

      expect(dialogData().confirmVariant).toBe('danger');
      expect(gateway.remove).toHaveBeenCalledWith(UID, 'klasa 5');
      expect(snackBarMessages()).toEqual(['templates.deleted']);
      expect(listedNames()).toEqual(['Klasa 6']);
    });

    it('keeps the template when the prompt is cancelled', async () => {
      dialogOpen.and.returnValue(dialogClosingWith(false));
      gateway.list.and.resolveTo([stored('klasa 5', 'Klasa 5', fields({ course: 'A2' }))]);

      await render();

      rowButton(0, 'delete').click();
      await settle();

      expect(gateway.remove).not.toHaveBeenCalled();
      expect(listedNames()).toEqual(['Klasa 5']);
    });

    it('reports a rejected delete and keeps the row', async () => {
      spyOn(console, 'error');
      gateway.list.and.resolveTo([stored('klasa 5', 'Klasa 5', fields({ course: 'A2' }))]);
      gateway.remove.and.rejectWith(firebaseError('unavailable'));

      await render();

      rowButton(0, 'delete').click();
      await settle();

      expect(snackBarMessages()).toEqual(['templates.errors.offline']);
      expect(listedNames()).toEqual(['Klasa 5']);
    });
  });
});
