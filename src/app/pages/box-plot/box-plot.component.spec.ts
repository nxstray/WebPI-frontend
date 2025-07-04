import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoxPlotComponent } from './box-plot.component';

describe('BoxPlotComponent', () => {
  let component: BoxPlotComponent;
  let fixture: ComponentFixture<BoxPlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoxPlotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoxPlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
