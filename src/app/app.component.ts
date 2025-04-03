import { Component } from '@angular/core';
import { Tab } from './model/tab.interface';
import { TabData } from './shared/static-data/tab-data';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  public activeTab: Tab | undefined = TabData.tabs.find(
    (tab: Tab) => tab.defaultActive
  );

  public emitTab(tab: Tab): void {
    this.activeTab = tab;
  }
}
