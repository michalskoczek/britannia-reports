import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tab } from '../../../../model/tab.interface';
import { TabData } from '../../../static-data/tab-data';
import { translateTestingImports } from '../../../testing/translate-testing';
import { TabGroupComponent } from './tab-group.component';

/**
 * `TabData.tabs` is a static array, so `isActive` outlives every component that
 * writes to it. That was invisible while the shell was the only routed surface a
 * signed-in teacher could be on; `S-03`'s `/students` route made leaving and
 * coming back an ordinary thing to do, and with it made stale flags reachable.
 *
 * These specs mount, destroy and mount again on purpose — a single-mount suite
 * cannot see the defect at all.
 */
describe('TabGroupComponent', () => {
  let fixture: ComponentFixture<TabGroupComponent>;

  /** Restored after every spec: the registry is shared with the whole app. */
  const snapshot: boolean[] = TabData.tabs.map((tab: Tab) => tab.isActive);

  const mount = (): void => {
    fixture = TestBed.createComponent(TabGroupComponent);
    fixture.detectChanges();
  };

  const buttons = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('.tab'));

  const activeIds = (): string[] =>
    buttons()
      .filter((button: HTMLButtonElement) => button.classList.contains('active'))
      .map((button: HTMLButtonElement) => button.id);

  const defaultId = (): string => TabData.tabs.find((tab: Tab) => tab.defaultActive)!.id;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabGroupComponent, ...translateTestingImports],
    }).compileComponents();
  });

  afterEach(() => {
    TabData.tabs.forEach((tab: Tab, index: number) => (tab.isActive = snapshot[index]));
  });

  it('marks the default tab active on a first mount', () => {
    mount();

    expect(activeIds()).toEqual([defaultId()]);
  });

  it('moves the active mark to the clicked tab', () => {
    mount();

    const other: HTMLButtonElement = buttons().find((button: HTMLButtonElement) => button.id !== defaultId())!;

    other.click();
    fixture.detectChanges();

    expect(activeIds()).toEqual([other.id]);
  });

  it('leaves exactly one tab active after leaving the shell and coming back', () => {
    // Two tabs marked active is not a cosmetic double-highlight: the moving pill
    // is a single `::after` positioned from `:has(.tab:nth-child(N).active)`, so
    // it lands on one of them while BOTH get the active tab's white text. The
    // other one reads as an empty slot in the bar.
    mount();

    const other: HTMLButtonElement = buttons().find((button: HTMLButtonElement) => button.id !== defaultId())!;
    const otherId: string = other.id;

    other.click();
    fixture.detectChanges();
    fixture.destroy();

    mount();

    expect(activeIds()).toEqual([defaultId()]);
    expect(activeIds()).not.toContain(otherId);
  });
});
