import { Component, Input, ElementRef, ViewChild, AfterViewInit, isDevMode } from '@angular/core';

@Component({
  selector: 'app-scatter-plot',
  standalone: true,
  template: `<div #scatterPlot></div>`,
})
export class ScatterPlotComponent implements AfterViewInit {
  @Input() xValues: number[] = [];
  @Input() yValues: number[] = [];
  @ViewChild('scatterPlot', { static: false }) scatterPlot!: ElementRef;

  async ngAfterViewInit() {
    if (typeof window !== 'undefined') {
      const Plotly = (await import('plotly.js-dist-min')).default;

      const trace = {
        x: this.xValues,
        y: this.yValues,
        mode: 'markers',
        type: 'scatter',
        marker: { color: '#7e57c2', size: 8 },
      };

      const layout = {
        title: 'Scatter Plot Korelasi Bivariate',
        xaxis: { title: 'X' },
        yaxis: { title: 'Y' },
        plot_bgcolor: 'rgba(255, 255, 255, 0.95)',
        paper_bgcolor: 'rgba(255,255,255,0.95)',
      };

      Plotly.newPlot(this.scatterPlot.nativeElement, [trace], layout);
    }
  }
}