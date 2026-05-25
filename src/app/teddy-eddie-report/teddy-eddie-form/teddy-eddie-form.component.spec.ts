import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeddyEddieFormComponent } from './teddy-eddie-form.component';

describe('TeddyEddieFormComponent', () => {
  let component: TeddyEddieFormComponent;
  let fixture: ComponentFixture<TeddyEddieFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeddyEddieFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeddyEddieFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
