import { Tab } from '../../model/tab.interface';
import { TeddyEddieReportComponent } from '../../teddy-eddie-report/teddy-eddie-report.component';
import { SemestrReportComponent } from '../../semestr-report/semestr-report.component';
import { YearReportComponent } from '../../year-report/year-report.component';
import { CambridgeReportComponent } from '../../cambridge-report/cambridge-report.component';

export class TabData {
  static tabs: Tab[] = [
    {
      id: 'semester-report',
      name: 'semesterReport',
      defaultActive: false,
      isActive: false,
      component: SemestrReportComponent,
    },
    {
      id: 'end-of-year-report',
      name: 'endOfYearReport',
      defaultActive: false,
      isActive: false,
      component: YearReportComponent,
    },
    {
      id: 'cambridge',
      name: 'cambridge',
      defaultActive: false,
      isActive: false,
      component: CambridgeReportComponent,
    },
    {
      id: 'teddy-eddie-report',
      name: 'teddyEddieReport',
      defaultActive: true,
      isActive: false,
      component: TeddyEddieReportComponent,
    },
  ];
}
