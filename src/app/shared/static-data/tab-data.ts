import { Tab } from '../../model/tab.interface';

export class TabData {
  static tabs: Tab[] = [
    {
      id: 'semester-report',
      name: 'tab.semesterReport',
      defaultActive: true,
      isActive: false,
    },
    {
      id: 'end-of-year-report',
      name: 'tab.endOfYearReport',
      defaultActive: false,
      isActive: false,
    },
    {
      id: 'cambridge',
      name: 'tab.cambridge',
      defaultActive: false,
      isActive: false,
    },
    {
      id: 'teddy-eddie-report',
      name: 'tab.teddyEddieReport',
      defaultActive: false,
      isActive: false,
    },
  ];
}
