import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { SessionService } from '../../auth/session.service';
import { SessionState } from '../../model/auth.interface';
import { StudentIdentity } from '../../model/student.interface';
import { SelectOptions } from '../../shared/components/form/select/select-options';
import { SelectComponent } from '../../shared/components/form/select/select.component';
import { Sex } from '../../shared/enum/sex.enum';
import { translateTestingImports } from '../../shared/testing/translate-testing';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../templates/confirm-dialog/confirm-dialog.component';
import { STUDENT_IDENTITY_DEFAULTS } from '../student-domain';
import { StoredStudent, StudentsGateway } from '../students.gateway';
import { StudentPickerComponent } from './student-picker.component';

/**
 * Driven against the real `StudentsService` behind a fake `StudentsGateway`, the
 * arrangement `template-panel.component.spec.ts` established.
 *
 * Faking the service would mean asserting the panel against a fake of the very
 * logic — the uid-gated cache, the tolerant read, the error classification — that
 * decides what the panel shows. The gateway is the seam that exists to be faked.
 *
 * `MatDialog.open` is spied rather than rendered: `confirm-dialog.component.spec.ts`
 * owns the dialog's own behaviour, and what matters here is which question the
 * panel asks and whether it acts only on a yes.
 */
describe('StudentPickerComponent', () => {
  const UID = 'firebase-uid-anna';

  let sessionState: WritableSignal<SessionState>;
  let gateway: { list: jasmine.Spy; create: jasmine.Spy; update: jasmine.Spy; remove: jasmine.Spy };
  let snackBar: { open: jasmine.Spy };
  let dialogOpen: jasmine.Spy;
  let applied: StudentIdentity[];
  let fixture: ComponentFixture<StudentPickerComponent>;

  const identity = (overrides: Partial<StudentIdentity> = {}): StudentIdentity => ({
    ...STUDENT_IDENTITY_DEFAULTS,
    ...overrides,
  });

  const JAN: StudentIdentity = identity({
    studentName: 'Jan Kowalski',
    name: 'Jaś',
    sex: Sex.MALE,
    class: 'Klasa 5 szkoły podstawowej',
  });

  const ZOSIA: StudentIdentity = identity({
    studentName: 'Zofia Nowak',
    name: 'Zosia',
    sex: Sex.FEMALE,
    class: 'Klasa 6 szkoły podstawowej',
  });

  const stored = (id: string, studentIdentity: StudentIdentity): StoredStudent => ({
    id,
    data: { schemaVersion: 1, identity: studentIdentity },
  });

  const firebaseError = (code: string): Error => Object.assign(new Error(code), { code });

  /** Escape and a backdrop click close with `undefined`; only `true` is a yes. */
  const dialogClosingWith = (result: boolean | undefined): MatDialogRef<ConfirmDialogComponent, boolean> =>
    ({ afterClosed: () => of(result) }) as unknown as MatDialogRef<ConfirmDialogComponent, boolean>;

  const render = async (currentIdentity: StudentIdentity = identity()): Promise<void> => {
    fixture = TestBed.createComponent(StudentPickerComponent);
    fixture.componentRef.setInput('currentIdentity', currentIdentity);

    applied = [];
    fixture.componentInstance.apply.subscribe((payload: StudentIdentity) => applied.push(payload));

    fixture.detectChanges();

    // The roster load starts in `ngOnInit`; without settling it every assertion
    // below would see the loading state.
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const select = (): SelectComponent => fixture.debugElement.query(By.directive(SelectComponent)).componentInstance;

  /**
   * What the select currently holds, read through the outer control the picker
   * owns — `app-select` is a `ControlValueAccessor`, so `ngControl.value` is the
   * public way to that value.
   */
  const selectedId = (): string | null => (select().ngControl?.value ?? null) as string | null;

  /**
   * One pick, as `mat-select` performs it: the id is written back through the
   * `ControlValueAccessor` first, and only then does `selectionChange` fire.
   *
   * Both halves matter. The panel reacts to the output — but the revert after a
   * dismissed confirmation is about the control, which by that point already
   * holds the new id. Emitting the output alone would leave the control empty and
   * make the revert look like a no-op. Opening the real overlay would test
   * Material rather than the panel.
   */
  const pick = async (studentId: string): Promise<void> => {
    const selectComponent: SelectComponent = select();

    selectComponent.ngControl!.control!.setValue(studentId);
    selectComponent.selectionChange.emit(studentId);

    await settle();
  };

  const optionLabels = (): string[] =>
    (select().itemList() as SelectOptions<string>[]).map((option: SelectOptions<string>) => option.label);

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
      create: jasmine.createSpy('create').and.resolveTo('new-id'),
      update: jasmine.createSpy('update').and.resolveTo(),
      remove: jasmine.createSpy('remove').and.resolveTo(),
    };

    snackBar = { open: jasmine.createSpy('open') };

    await TestBed.configureTestingModule({
      imports: [StudentPickerComponent, ...translateTestingImports],
      providers: [
        provideNoopAnimations(),
        { provide: StudentsGateway, useValue: gateway },
        { provide: SessionService, useValue: { state: sessionState } },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    dialogOpen = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogClosingWith(true));
  });

  describe('the roster', () => {
    it('explains an empty roster instead of offering an empty select', async () => {
      await render();

      expect(text('.student-picker-note')).toBe('students.picker.empty');
      expect(fixture.debugElement.query(By.directive(SelectComponent))).toBeNull();
    });

    it('offers the teacher`s students, sorted by the service', async () => {
      gateway.list.and.resolveTo([stored('zosia', ZOSIA), stored('jan', JAN)]);

      await render();

      expect(optionLabels()).toEqual(['Jan Kowalski', 'Zofia Nowak']);
    });

    it('reports a failed load inline with a retry, not in a snackbar', async () => {
      spyOn(console, 'error');
      gateway.list.and.rejectWith(firebaseError('unavailable'));

      await render();

      // A snackbar disappears; the area it was explaining stays empty.
      expect(text('.student-picker-failure')).toContain('students.errors.offline');
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('loads the roster again when the retry is pressed', async () => {
      spyOn(console, 'error');
      gateway.list.and.rejectWith(firebaseError('unavailable'));

      await render();

      gateway.list.and.resolveTo([stored('jan', JAN)]);
      (fixture.nativeElement.querySelector('.student-picker-failure button') as HTMLButtonElement).click();
      await settle();

      expect(fixture.nativeElement.querySelector('.student-picker-failure')).toBeNull();
      expect(optionLabels()).toEqual(['Jan Kowalski']);
    });

    it('loads on mount even when the roster was already cached', async () => {
      // The recorded call, against the cheaper `hasFreshRoster()` branch the
      // roster uses: a student added at `/students` and then picked in the same
      // sitting has to be on the list, and the tab remounts on every visit.
      gateway.list.and.resolveTo([stored('jan', JAN)]);

      await render();
      expect(gateway.list).toHaveBeenCalledTimes(1);

      await render();
      expect(gateway.list).toHaveBeenCalledTimes(2);
    });
  });

  describe('picking a student', () => {
    beforeEach(() => {
      gateway.list.and.resolveTo([stored('jan', JAN), stored('zosia', ZOSIA)]);
    });

    it('emits without asking when the report holds nothing yet', async () => {
      await render();

      await pick('jan');

      expect(dialogOpen).not.toHaveBeenCalled();
      expect(applied).toEqual([JAN]);
      expect(selectedId()).toBe('jan');
      expect(snackBarMessages()).toEqual(['students.picker.applied']);
    });

    it('lists overwritten and cleared fields separately before emitting', async () => {
      // The report already describes Jan, and this Zosia has no class stored — so
      // three fields are replaced and one is emptied. The dialog has to say which
      // is which: "will be replaced" and "will be cleared" are different promises.
      const zosiaWithoutClass: StudentIdentity = identity({ ...ZOSIA, class: null });

      gateway.list.and.resolveTo([stored('jan', JAN), stored('zosia', zosiaWithoutClass)]);

      await render(JAN);
      await pick('zosia');

      expect(dialogOpen).toHaveBeenCalled();
      expect(dialogData().itemGroups).toEqual([
        {
          titleKey: 'students.picker.confirmApply.overwritten',
          items: ['students.fields.studentName', 'students.fields.name', 'students.fields.sex'],
        },
        { titleKey: 'students.picker.confirmApply.cleared', items: ['students.fields.class'] },
      ]);
      expect(applied).toEqual([zosiaWithoutClass]);
      expect(selectedId()).toBe('zosia');
    });

    it('emits nothing and puts the select back when the prompt is cancelled', async () => {
      await render(identity({ ...JAN }));

      // Land on a student first, so there is a previous selection to revert to.
      await pick('jan');
      expect(selectedId()).toBe('jan');

      dialogOpen.and.returnValue(dialogClosingWith(false));
      await pick('zosia');

      expect(applied).toEqual([JAN]);
      // The select says who the report is about. Leaving it on Zosia while the
      // form still describes Jan would say the wrong thing about the form.
      expect(selectedId()).toBe('jan');
    });

    it('emits nothing when the prompt is dismissed rather than answered', async () => {
      // Escape and a backdrop click both close with `undefined`.
      dialogOpen.and.returnValue(dialogClosingWith(undefined));

      await render(identity({ ...JAN }));

      await pick('zosia');

      expect(applied).toEqual([]);
      expect(selectedId()).toBeNull();
    });

    it('asks nothing when the picked student is the one the report already describes', async () => {
      await render(identity({ ...JAN }));

      await pick('jan');

      expect(dialogOpen).not.toHaveBeenCalled();
      expect(applied).toEqual([JAN]);
    });
  });
});
