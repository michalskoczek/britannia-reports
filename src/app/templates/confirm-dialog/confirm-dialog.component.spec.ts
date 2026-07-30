import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TranslateService, TranslationObject } from '@ngx-translate/core';
import { translateTestingImports } from '../../shared/testing/translate-testing';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

/**
 * The dialog holds no product decisions — the panel decides whether to open it and
 * what to put in it. What is worth freezing is the contract the panel and `S-03`
 * both compile against: everything renders through `ngx-translate`, the two item
 * groups stay separate, and the boolean it closes with means what the caller
 * assumes it means.
 *
 * `translateTestingImports` loads no translations, so the pipe echoes the key it
 * was given — which is what makes "this string went through the pipe" assertable
 * without pinning a spec to a copy of the bundle. The one case that needs real
 * text is interpolation, and it registers its own.
 */
describe('ConfirmDialogComponent', () => {
  let close: jasmine.Spy;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  const baseData: ConfirmDialogData = {
    titleKey: 'templates.confirmDelete.title',
    messageKey: 'templates.confirmDelete.message',
    confirmKey: 'templates.confirmDelete.confirm',
    cancelKey: 'templates.cancel',
  };

  const render = async (data: ConfirmDialogData, translations?: TranslationObject): Promise<void> => {
    close = jasmine.createSpy('close');

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent, ...translateTestingImports],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: { close } },
      ],
    }).compileComponents();

    // Most cases want the empty bundle, where the pipe echoes its key. Only the
    // interpolation case needs a real translation, because ngx-translate does not
    // interpolate a key it could not resolve.
    if (translations !== undefined) {
      const translate: TranslateService = TestBed.inject(TranslateService);

      translate.setTranslation('pl', translations);
      translate.use('pl');
    }

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
  };

  const text = (selector: string): string | null => {
    const element: HTMLElement | null = fixture.nativeElement.querySelector(selector);

    return element === null ? null : element.textContent!.trim();
  };

  const texts = (selector: string): string[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector)).map((element) =>
      (element as HTMLElement).textContent!.trim()
    );

  const button = (selector: string): HTMLButtonElement =>
    fixture.nativeElement.querySelector(`${selector} button`) as HTMLButtonElement;

  /** One inner array per rendered group, so group boundaries stay assertable. */
  const groupItems = (): string[][] =>
    Array.from(fixture.nativeElement.querySelectorAll('.confirm-dialog-items')).map((list) =>
      Array.from((list as HTMLElement).querySelectorAll('li')).map((item) => item.textContent!.trim())
    );

  it('renders the title, the message and both actions through the translate pipe', async () => {
    await render(baseData);

    expect(text('.confirm-dialog-title')).toBe('templates.confirmDelete.title');
    expect(text('.confirm-dialog-message')).toBe('templates.confirmDelete.message');
    expect(button('.confirm-dialog-cancel').textContent!.trim()).toBe('templates.cancel');
    expect(button('.confirm-dialog-confirm').textContent!.trim()).toBe('templates.confirmDelete.confirm');
  });

  it('interpolates the message parameters into the translated sentence', async () => {
    await render(
      { ...baseData, messageParams: { name: 'Klasa 5 semestr' } },
      { templates: { confirmDelete: { message: '„{{name}}” zostanie trwale usunięty.' } } }
    );

    expect(text('.confirm-dialog-message')).toBe('„Klasa 5 semestr” zostanie trwale usunięty.');
  });

  it('renders no item list when the caller passes none', async () => {
    await render(baseData);

    expect(fixture.nativeElement.querySelector('.confirm-dialog-items')).toBeNull();
  });

  it('keeps the two item groups separate, each under its own heading', async () => {
    await render({
      ...baseData,
      itemGroups: [
        { titleKey: 'templates.confirmApply.overwritten', items: ['templates.fields.course'] },
        {
          titleKey: 'templates.confirmApply.cleared',
          items: ['templates.fields.realizedMaterial', 'templates.fields.signature'],
        },
      ],
    });

    expect(texts('.confirm-dialog-group-title')).toEqual([
      'templates.confirmApply.overwritten',
      'templates.confirmApply.cleared',
    ]);
    expect(groupItems()).toEqual([
      ['templates.fields.course'],
      ['templates.fields.realizedMaterial', 'templates.fields.signature'],
    ]);
  });

  it('drops a group with no items so a caller can pass both unconditionally', async () => {
    await render({
      ...baseData,
      itemGroups: [
        { titleKey: 'templates.confirmApply.overwritten', items: ['templates.fields.course'] },
        { titleKey: 'templates.confirmApply.cleared', items: [] },
      ],
    });

    expect(texts('.confirm-dialog-group-title')).toEqual(['templates.confirmApply.overwritten']);
  });

  it('closes with true when the confirm action is pressed', async () => {
    await render(baseData);

    button('.confirm-dialog-confirm').click();

    expect(close).toHaveBeenCalledWith(true);
  });

  it('closes with false when the cancel action is pressed', async () => {
    await render(baseData);

    button('.confirm-dialog-cancel').click();

    expect(close).toHaveBeenCalledWith(false);
  });
});
