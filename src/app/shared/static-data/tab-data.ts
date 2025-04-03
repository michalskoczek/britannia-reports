import { Tab } from '../../model/tab.interface';
import { TeddyEddieReportComponent } from '../../teddy-eddie-report/teddy-eddie-report.component';
import { SemestrReportComponent } from '../../semestr-report/semestr-report.component';
import { YearReportComponent } from '../../year-report/year-report.component';
import { CambridgeReportComponent } from '../../cambridge-report/cambridge-report.component';

export class TabData {
  static tabs: Tab[] = [
    {
      id: 'semester-report',
      name: 'tab.semesterReport',
      defaultActive: true,
      isActive: false,
      component: SemestrReportComponent,
    },
    {
      id: 'end-of-year-report',
      name: 'tab.endOfYearReport',
      defaultActive: false,
      isActive: false,
      component: YearReportComponent,
    },
    {
      id: 'cambridge',
      name: 'tab.cambridge',
      defaultActive: false,
      isActive: false,
      component: CambridgeReportComponent,
    },
    {
      id: 'teddy-eddie-report',
      name: 'tab.teddyEddieReport',
      defaultActive: false,
      isActive: false,
      component: TeddyEddieReportComponent,
    },
  ];
}
