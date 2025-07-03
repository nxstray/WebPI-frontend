import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnovaResultComponent } from './anova-result.component';

describe('AnovaResultComponent', () => {
  let component: AnovaResultComponent;
  let fixture: ComponentFixture<AnovaResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnovaResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnovaResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
