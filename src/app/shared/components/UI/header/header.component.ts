import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgOptimizedImage } from '@angular/common';
import { MatSlideToggle } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-header',
  imports: [NgOptimizedImage, MatSlideToggle],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit {
  private translateService: TranslateService = inject(TranslateService);

  public defaultLanguage = true;

  protected readonly title: string = 'Britannia Reports';

  ngOnInit(): void {
    this.translateService.setDefaultLang('pl');
  }

  public switchLanguage(): void {
    this.defaultLanguage = !this.defaultLanguage;
    this.translateService.use(this.defaultLanguage ? 'pl' : 'en');
  }
}
