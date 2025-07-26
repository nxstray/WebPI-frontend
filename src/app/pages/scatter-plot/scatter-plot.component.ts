import { Component, Input, ElementRef, ViewChild, AfterViewInit, isDevMode } from '@angular/core';

// Komponen Angular untuk menampilkan scatter plot menggunakan Plotly
@Component({
  selector: 'app-scatter-plot',
  standalone: true,
  template: `<div #scatterPlot></div>`, // Template HTML sederhana dengan referensi ke elemen div
})
export class ScatterPlotComponent implements AfterViewInit {
  // Input property untuk nilai-nilai pada sumbu X
  @Input() xValues: number[] = [];

  // Input property untuk nilai-nilai pada sumbu Y
  @Input() yValues: number[] = [];

  // ViewChild untuk mengakses elemen div scatterPlot dari template
  @ViewChild('scatterPlot', { static: false }) scatterPlot!: ElementRef;

  async ngAfterViewInit() {
    // Pastikan hanya dijalankan jika berada di lingkungan browser
    if (typeof window !== 'undefined') {
      // Import dinamis library Plotly (versi minified)
      const Plotly = (await import('plotly.js-dist-min')).default;

      // Objek trace untuk mendefinisikan data titik-titik pada scatter plot
      const trace = {
        x: this.xValues,               // Data untuk sumbu X
        y: this.yValues,               // Data untuk sumbu Y
        mode: 'markers',               // Mode tampilan: titik-titik
        type: 'scatter',               // Jenis grafik: scatter plot
        marker: {                      // Konfigurasi marker (titik)
          color: '#7e57c2',            
          size: 8                      
        },
      };

      // Objek layout untuk mendefinisikan tata letak dan tampilan chart
      const layout = {
        title: 'Scatter Plot Korelasi Bivariate',
        xaxis: { title: 'X' },                    // Label sumbu X
        yaxis: { title: 'Y' },                    // Label sumbu Y
        plot_bgcolor: 'rgba(255, 255, 255, 0.95)', // Warna latar belakang area plot
        paper_bgcolor: 'rgba(255,255,255,0.95)',   // Warna latar belakang keseluruhan
      };

      // Render chart ke dalam elemen scatterPlot menggunakan Plotly
      Plotly.newPlot(this.scatterPlot.nativeElement, [trace], layout);
    }
  }
}