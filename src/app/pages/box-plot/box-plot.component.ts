import { Component, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-box-plot',
  standalone: true,
  template: `<div #boxPlotContainer></div>`,
})
export class BoxPlotComponent implements AfterViewInit {
  @Input() data: { grup: string; nilai: number }[] = [];
  @Input() yAxisLabel: string = 'Nilai';

  @ViewChild('boxPlotContainer', { static: false }) boxPlotContainer!: ElementRef;

  async ngAfterViewInit() {
    if (typeof window === 'undefined') return;

    const Plotly = (await import('plotly.js-dist-min')).default;

    const grouped = new Map<string, number[]>();
    for (const d of this.data) {
      if (!grouped.has(d.grup)) grouped.set(d.grup, []);
      grouped.get(d.grup)!.push(d.nilai);
    }

    const traces = Array.from(grouped.entries()).map(([grup, nilai]) => ({
      y: nilai,
      type: 'box',
      name: grup,
      boxpoints: 'all',
      jitter: 0.5,
      whiskerwidth: 0.2,
      marker: { size: 6 },
      line: { width: 1 }
    }));

    const layout = {
      title: 'Box Plot ANOVA',
      yaxis: { title: this.yAxisLabel },
      plot_bgcolor: 'rgba(255, 255, 255, 0.95)',
      paper_bgcolor: 'rgba(255, 255, 255, 0.95)',
    };

    Plotly.newPlot(this.boxPlotContainer.nativeElement, traces, layout, { responsive: true });
  }
}