import { Component } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Tab } from '../model/tab.interface';
import { TabData } from '../shared/static-data/tab-data';
import { TabGroupComponent } from '../shared/components/UI/tab-group/tab-group.component';

/**
 * The signed-in surface: the four report types, composed exactly as they were
 * before the gate existed.
 *
 * This is `AppComponent`'s former body, moved unchanged so that `AppComponent`
 * could become the router host. The tab registry is untouched.
 */
@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  standalone: true,
  imports: [TabGroupComponent, NgComponentOutlet],
})
export class ShellComponent {
  public activeTab: Tab | undefined = TabData.tabs.find((tab: Tab) => tab.defaultActive);

  public emitTab(tab: Tab): void {
    this.activeTab = tab;
  }
}
