import { Component, inject, OnInit } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  imports: [ButtonComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private translateService: TranslateService = inject(TranslateService);

  public defaultLanguage: boolean = true;

  protected readonly title: string = 'Britannia Reports';

  ngOnInit(): void {
    this.translateService.setDefaultLang('pl');
  }

  public switchLanguage(language: string): void {
    this.defaultLanguage = !this.defaultLanguage;
    this.translateService.use(language);
  }
}
