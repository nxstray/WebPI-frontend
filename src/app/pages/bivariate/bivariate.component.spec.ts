import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BivariateComponent } from './bivariate.component';

describe('BivariateComponent', () => {
  let component: BivariateComponent;
  let fixture: ComponentFixture<BivariateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BivariateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BivariateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
