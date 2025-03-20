import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('pl');
  }

  public defaultLanguage: boolean = true;

  protected readonly title: string = 'Britannia Reports';

  public switchLanguage(language: string): void {
    this.defaultLanguage = !this.defaultLanguage;
    this.translate.use(language);
  }
}
