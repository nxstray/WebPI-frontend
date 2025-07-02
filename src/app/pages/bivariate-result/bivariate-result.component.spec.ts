import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BivariateResultComponent } from './bivariate-result.component';

describe('BivariateResultComponent', () => {
  let component: BivariateResultComponent;
  let fixture: ComponentFixture<BivariateResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BivariateResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BivariateResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
