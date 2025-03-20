import { Component, OnInit } from '@angular/core';
import { Tab } from '../../../model/tab.interface';
import { TranslateModule } from '@ngx-translate/core';
import { TabData } from '../../static-data/tab-data';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-tab-group',
  imports: [TranslateModule, NgClass],
  templateUrl: './tab-group.component.html',
  styleUrl: './tab-group.component.scss',
})
export class TabGroupComponent implements OnInit {
  protected readonly tabs: Tab[] = TabData.tabs;

  ngOnInit(): void {
    this.initDefaultActiveTab();
  }

  private initDefaultActiveTab(): void {
    this.tabs.forEach((tab: Tab): void => {
      tab.defaultActive ? tab.isActive = true : false;
    });
  }
}
