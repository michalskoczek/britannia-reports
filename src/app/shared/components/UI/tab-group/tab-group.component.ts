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

  private initDefaultActiveTab(): void {
    this.tabs.forEach((tab: Tab): void => {
      tab.defaultActive ? (tab.isActive = true) : false;
    });
  }

  private changeActiveTab(clickedTab: Tab): void {
    this.tabs.forEach((tab: Tab): void => {
      tab.isActive = false;
      tab.id === clickedTab.id ? (tab.isActive = true) : false;
    });
  }
}
