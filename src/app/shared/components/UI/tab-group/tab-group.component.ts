import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Tab } from '../../../../model/tab.interface';
import { TranslateModule } from '@ngx-translate/core';
import { TabData } from '../../../static-data/tab-data';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-tab-group',
  imports: [TranslateModule, NgClass],
  standalone: true,
  templateUrl: './tab-group.component.html',
  styleUrl: './tab-group.component.scss',
})
export class TabGroupComponent implements OnInit {
  @Output() clickTabEvent = new EventEmitter<Tab>();

  protected readonly tabs: Tab[] = TabData.tabs;

  ngOnInit(): void {
    this.initDefaultActiveTab();
  }

  public onClick(tab: Tab): void {
    if (tab.isActive) return;

    this.changeActiveTab(tab);

    this.clickTabEvent.emit(tab);
  }

  /**
   * Puts the bar back to "default tab selected", clearing every other flag.
   *
   * Authoritative rather than additive, and that is the whole point.
   * `TabData.tabs` is a static array, so `isActive` outlives the component that
   * wrote it: mounting used to only *set* the default and leave whatever the
   * previous mount had marked. That was unreachable while the shell was the one
   * routed surface a signed-in teacher could be on. `S-03`'s `/students` route
   * made leaving and returning ordinary, and two tabs then carried `isActive` at
   * once — the moving pill is a single `::after` positioned from
   * `:has(.tab:nth-child(N).active)`, so it lands on one of them while BOTH get
   * the active tab's white text. The other one reads as an empty slot in the
   * bar.
   *
   * Resetting to the default is the right answer and not merely the cheap one:
   * `ShellComponent` independently starts from `defaultActive` on every mount,
   * so anything else here would put the bar and the rendered report out of
   * agreement.
   */
  private initDefaultActiveTab(): void {
    this.tabs.forEach((tab: Tab): void => {
      tab.isActive = tab.defaultActive;
    });
  }

  private changeActiveTab(clickedTab: Tab): void {
    this.tabs.forEach((tab: Tab): void => {
      tab.isActive = false;
      if (tab.id === clickedTab.id) {
        tab.isActive = true;
      }
    });
  }
}
