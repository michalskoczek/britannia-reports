import { Component } from '@angular/core';
import { Tab } from './model/tab.interface';
import { TabData } from './shared/static-data/tab-data';
import { HeaderComponent } from './shared/components/UI/header/header.component';
import { TabGroupComponent } from './shared/components/UI/tab-group/tab-group.component';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [HeaderComponent, TabGroupComponent, NgComponentOutlet],
})
export class AppComponent {
  public activeTab: Tab | undefined = TabData.tabs.find((tab: Tab) => tab.defaultActive);

  public emitTab(tab: Tab): void {
    this.activeTab = tab;
  }
}
