import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { Student, StudentDraft, StudentIdentity } from '../../model/student.interface';
import { Sex } from '../../shared/enum/sex.enum';
import { translateTestingImports } from '../../shared/testing/translate-testing';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../templates/confirm-dialog/confirm-dialog.component';
import { STUDENT_IDENTITY_DEFAULTS } from '../student-domain';
import { StudentsFailure, StudentsResult, StudentsService } from '../students.service';
import { StudentRosterComponent } from './student-roster.component';

/**
 * Driven against a fake `StudentsService`.
 *
 * The service's own decisions — sort order, the cache guarded on uid, error
 * classification — are covered against a fake gateway in
 * `students.service.spec.ts`. What is left for this file is the half a teacher
 * can actually reach: which method a press calls, what the form does afterwards,
 * and whether a destructive action waits for a yes.
 *
 * The fake keeps `validate` real, because the component calls it before writing
 * and a fake that always said "fine" would hide exactly that pre-check.
 *
 * `MatDialog.open` is spied rather than rendered: `confirm-dialog.component.spec.ts`
 * owns the dialog's behaviour, and what matters here is which question the
 * roster asks and whether it acts only on a yes.
 */
describe('StudentRosterComponent', () => {
  let listed: WritableSignal<readonly Student[]>;
  let service: {
    students: WritableSignal<readonly Student[]>;
    validate: (identity: StudentIdentity) => StudentsFailure | null;
    load: jasmine.Spy;
    create: jasmine.Spy;
    update: jasmine.Spy;
    remove: jasmine.Spy;
  };
  let snackBar: { open: jasmine.Spy };
  let dialogOpen: jasmine.Spy;
  let fixture: ComponentFixture<StudentRosterComponent>;

  const identity = (overrides: Partial<StudentIdentity> = {}): StudentIdentity => ({
    ...STUDENT_IDENTITY_DEFAULTS,
    studentName: 'Jan Kowalski',
    sex: Sex.MALE,
    ...overrides,
  });

  const student = (id: string, overrides: Partial<StudentIdentity> = {}): Student => ({
    id,
    identity: identity(overrides),
    createdAt: null,
  });

  const ok = <T>(value: T): StudentsResult<T> => ({ ok: true, value });
  const failed = <T>(failure: StudentsFailure): StudentsResult<T> => ({ ok: false, failure });

  /** Escape and a backdrop click close with `undefined`; only `true` is a yes. */
  const dialogClosingWith = (result: boolean | undefined): MatDialogRef<ConfirmDialogComponent, boolean> =>
    ({ afterClosed: () => of(result) }) as unknown as MatDialogRef<ConfirmDialogComponent, boolean>;

  const settle = async (): Promise<void> => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const render = async (): Promise<void> => {
    fixture = TestBed.createComponent(StudentRosterComponent);
    fixture.detectChanges();

    // The list load starts in `ngOnInit`; without settling it every assertion
    // below would see the loading state.
    await settle();
  };

  const field = (control: 'studentName' | 'name'): HTMLInputElement =>
    fixture.nativeElement.querySelector(`app-input-text[formControlName="${control}"] input`) as HTMLInputElement;

  const type = (control: 'studentName' | 'name', value: string): void => {
    const input: HTMLInputElement = field(control);

    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  /**
   * Picks an option the way a teacher does: open the panel, click the entry.
   *
   * `optionKey` is the option's translate key, because that is what an untranslated
   * `mat-option` renders — `TranslateModule.forRoot()` loads no bundle. Going
   * through the overlay rather than setting the control directly is what proves
   * `app-select`'s value accessor is actually wired to this form; a `setValue`
   * would pass even if the control were never bound.
   */
  const choose = async (control: 'sex' | 'class', optionKey: string): Promise<void> => {
    const trigger: HTMLElement = fixture.nativeElement.querySelector(
      `app-select[formControlName="${control}"] .mat-mdc-select-trigger`,
    ) as HTMLElement;

    trigger.click();
    await settle();

    // The panel renders into the overlay container, outside the fixture.
    const options: HTMLElement[] = Array.from(document.querySelectorAll('mat-option'));
    const option: HTMLElement | undefined = options.find(
      (entry: HTMLElement) => entry.textContent!.trim() === optionKey,
    );

    if (option === undefined) {
      throw new Error(`No option "${optionKey}" in the ${control} select`);
    }

    option.click();
    await settle();
  };

  const submit = (): void => {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
  };

  const submitLabel = (): string =>
    (fixture.nativeElement.querySelector('.student-roster-submit button') as HTMLButtonElement).textContent!.trim();

  const rows = (): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll('.student-roster-item'));

  const listedNames = (): string[] =>
    rows().map((row) => row.querySelector('.student-roster-item-name')!.textContent!.trim());

  const rowButton = (index: number, action: 'edit' | 'delete'): HTMLButtonElement => {
    const buttons: NodeListOf<HTMLButtonElement> = rows()[index].querySelectorAll('button');

    return buttons[action === 'edit' ? 0 : 1];
  };

  const text = (selector: string): string | null => {
    const element: HTMLElement | null = fixture.nativeElement.querySelector(selector);

    return element === null ? null : element.textContent!.trim();
  };

  const snackBarMessages = (): string[] => snackBar.open.calls.all().map((call) => call.args[0] as string);

  const dialogData = (): ConfirmDialogData => dialogOpen.calls.mostRecent().args[1].data as ConfirmDialogData;

  beforeEach(async () => {
    listed = signal<readonly Student[]>([]);

    service = {
      students: listed,
      // Kept real. The component pre-validates before writing, and a fake that
      // always agreed would hide exactly that check. `validate` reads nothing
      // off `this`, so borrowing it off the prototype is safe.
      validate: StudentsService.prototype.validate,
      load: jasmine.createSpy('load').and.callFake(async () => ok(listed())),
      create: jasmine.createSpy('create').and.callFake(async (draft: StudentDraft) => {
        const created: Student = { id: 'generated-id', identity: draft.identity, createdAt: null };

        listed.set([...listed(), created]);

        return ok(created);
      }),
      update: jasmine.createSpy('update').and.callFake(async (id: string, draft: StudentDraft) => {
        const updated: Student = { id, identity: draft.identity, createdAt: null };

        listed.set(listed().map((entry: Student) => (entry.id === id ? updated : entry)));

        return ok(updated);
      }),
      remove: jasmine.createSpy('remove').and.callFake(async (id: string) => {
        listed.set(listed().filter((entry: Student) => entry.id !== id));

        return ok(undefined);
      }),
    };

    snackBar = { open: jasmine.createSpy('open') };

    await TestBed.configureTestingModule({
      imports: [StudentRosterComponent, ...translateTestingImports],
      providers: [
        provideNoopAnimations(),
        { provide: StudentsService, useValue: service },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    dialogOpen = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue(dialogClosingWith(true));
  });

  describe('the list', () => {
    it('explains an empty list instead of leaving a blank area', async () => {
      await render();

      expect(text('.student-roster-note')).toBe('students.empty');
      expect(rows()).toEqual([]);
    });

    it('renders what the service holds, in the order it holds it', async () => {
      listed.set([student('a', { studentName: 'Anna Nowak' }), student('b', { studentName: 'Jan Kowalski' })]);

      await render();

      expect(listedNames()).toEqual(['Anna Nowak', 'Jan Kowalski']);
    });

    it('renders the optional fields a student carries', async () => {
      listed.set([
        student('a', { studentName: 'Anna Nowak', name: 'Ania', sex: Sex.FEMALE, class: 'Klasa 5 szkoły podstawowej' }),
      ]);

      await render();

      const details: string = rows()[0].querySelector('.student-roster-item-details')!.textContent!;

      expect(details).toContain('Ania');
      expect(details).toContain('female');
      // The stored value is the Polish label; the row renders its translate key
      // so the English roster is not half-Polish.
      expect(details).toContain('grade5PrimarySchool');
    });

    it('reports a failed load inline with a retry, not in a snackbar', async () => {
      service.load.and.resolveTo(failed('offline'));

      await render();

      // A snackbar disappears; the area it was explaining stays empty.
      expect(text('.student-roster-failure')).toContain('students.errors.offline');
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('loads the list again when the retry is pressed', async () => {
      service.load.and.resolveTo(failed('offline'));

      await render();

      listed.set([student('a', { studentName: 'Anna Nowak' })]);
      service.load.and.callFake(async () => ok(listed()));

      (fixture.nativeElement.querySelector('.student-roster-failure button') as HTMLButtonElement).click();
      await settle();

      expect(fixture.nativeElement.querySelector('.student-roster-failure')).toBeNull();
      expect(listedNames()).toEqual(['Anna Nowak']);
    });
  });

  describe('add', () => {
    it('never reaches the store with a student that has no name', async () => {
      await render();

      type('studentName', '   ');
      await choose('sex', Sex.MALE);
      submit();
      await settle();

      expect(service.create).not.toHaveBeenCalled();
      expect(text('.student-roster-error')).toBe('students.errors.nameRequired');
    });

    it('never reaches the store with a student that has no sex', async () => {
      await render();

      type('studentName', 'Jan Kowalski');
      submit();
      await settle();

      expect(service.create).not.toHaveBeenCalled();
      expect(text('.student-roster-error')).toBe('students.errors.sexRequired');
    });

    it('adds the student and clears the form', async () => {
      await render();

      type('studentName', 'Jan Kowalski');
      type('name', 'Jaś');
      await choose('sex', Sex.MALE);
      await choose('class', 'grade5PrimarySchool');
      submit();
      await settle();

      expect(service.create).toHaveBeenCalledWith({
        identity: {
          studentName: 'Jan Kowalski',
          name: 'Jaś',
          sex: Sex.MALE,
          class: 'Klasa 5 szkoły podstawowej',
        },
      });
      expect(snackBarMessages()).toEqual(['students.saved']);
      expect(field('studentName').value).toBe('');
      expect(field('name').value).toBe('');
      expect(listedNames()).toEqual(['Jan Kowalski']);
    });

    it('reports a rejected add in the snackbar and keeps what was typed', async () => {
      service.create.and.resolveTo(failed('permission-denied'));

      await render();

      type('studentName', 'Jan Kowalski');
      await choose('sex', Sex.MALE);
      submit();
      await settle();

      expect(snackBarMessages()).toEqual(['students.errors.permissionDenied']);
      expect(field('studentName').value).toBe('Jan Kowalski');
    });
  });

  describe('edit', () => {
    it('patches the form and switches the button from add to save', async () => {
      listed.set([student('a', { studentName: 'Anna Nowak', name: 'Ania', sex: Sex.FEMALE })]);

      await render();

      expect(submitLabel()).toContain('students.add');

      rowButton(0, 'edit').click();
      await settle();

      expect(field('studentName').value).toBe('Anna Nowak');
      expect(field('name').value).toBe('Ania');
      expect(submitLabel()).toContain('students.saveChanges');
    });

    it('updates that student rather than adding a second one', async () => {
      listed.set([student('a', { studentName: 'Anna Nowak', sex: Sex.FEMALE })]);

      await render();

      rowButton(0, 'edit').click();
      await settle();

      type('studentName', 'Anna Nowak-Kowalska');
      submit();
      await settle();

      expect(service.create).not.toHaveBeenCalled();
      expect(service.update).toHaveBeenCalledWith('a', {
        identity: { studentName: 'Anna Nowak-Kowalska', name: '', sex: Sex.FEMALE, class: null },
      });
      expect(snackBarMessages()).toEqual(['students.updated']);
      expect(listedNames()).toEqual(['Anna Nowak-Kowalska']);
      expect(submitLabel()).toContain('students.add');
    });

    it('returns to add mode on cancel without writing anything', async () => {
      listed.set([student('a', { studentName: 'Anna Nowak', sex: Sex.FEMALE })]);

      await render();

      rowButton(0, 'edit').click();
      await settle();

      (fixture.nativeElement.querySelector('.student-roster-cancel button') as HTMLButtonElement).click();
      await settle();

      expect(service.update).not.toHaveBeenCalled();
      expect(field('studentName').value).toBe('');
      expect(submitLabel()).toContain('students.add');
      expect(fixture.nativeElement.querySelector('.student-roster-cancel')).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes only after the prompt is confirmed', async () => {
      listed.set([student('a', { studentName: 'Anna Nowak' }), student('b', { studentName: 'Jan Kowalski' })]);

      await render();

      rowButton(0, 'delete').click();
      await settle();

      expect(dialogData().confirmVariant).toBe('danger');
      expect(dialogData().messageParams).toEqual({ name: 'Anna Nowak' });
      expect(service.remove).toHaveBeenCalledWith('a');
      expect(snackBarMessages()).toEqual(['students.deleted']);
      expect(listedNames()).toEqual(['Jan Kowalski']);
    });

    it('keeps the student when the prompt is cancelled', async () => {
      dialogOpen.and.returnValue(dialogClosingWith(false));
      listed.set([student('a', { studentName: 'Anna Nowak' })]);

      await render();

      rowButton(0, 'delete').click();
      await settle();

      expect(service.remove).not.toHaveBeenCalled();
      expect(listedNames()).toEqual(['Anna Nowak']);
    });

    it('keeps the student when the prompt is dismissed rather than answered', async () => {
      // Escape and a backdrop click both close with `undefined`.
      dialogOpen.and.returnValue(dialogClosingWith(undefined));
      listed.set([student('a', { studentName: 'Anna Nowak' })]);

      await render();

      rowButton(0, 'delete').click();
      await settle();

      expect(service.remove).not.toHaveBeenCalled();
      expect(listedNames()).toEqual(['Anna Nowak']);
    });

    it('leaves edit mode when the student being edited is deleted', async () => {
      // Otherwise the form still points at a document that no longer exists and
      // the next save is an update against nothing.
      listed.set([student('a', { studentName: 'Anna Nowak', sex: Sex.FEMALE })]);

      await render();

      rowButton(0, 'edit').click();
      await settle();

      rowButton(0, 'delete').click();
      await settle();

      expect(service.remove).toHaveBeenCalledWith('a');
      expect(field('studentName').value).toBe('');
      expect(submitLabel()).toContain('students.add');
    });

    it('reports a rejected delete and keeps the row', async () => {
      service.remove.and.resolveTo(failed('offline'));
      listed.set([student('a', { studentName: 'Anna Nowak' })]);

      await render();

      rowButton(0, 'delete').click();
      await settle();

      expect(snackBarMessages()).toEqual(['students.errors.offline']);
      expect(listedNames()).toEqual(['Anna Nowak']);
    });
  });
});
