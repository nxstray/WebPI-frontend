// Mengimpor decorator dan interface dari Angular core
import { Component, Input, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-box-plot',
  standalone: true,
  template: `<div #boxPlotContainer></div>`, // Template HTML: sebuah div sebagai container untuk plot
})
export class BoxPlotComponent implements AfterViewInit {
  // Input properti 'data' berupa array objek dengan atribut 'grup' dan 'nilai'
  @Input() data: { grup: string; nilai: number }[] = [];

  // Label sumbu-Y yang dapat dikustomisasi
  @Input() yAxisLabel: string = 'Nilai';

  // Referensi ke elemen DOM container untuk box plot
  @ViewChild('boxPlotContainer', { static: false }) boxPlotContainer!: ElementRef;

  // Lifecycle hook yang dipanggil setelah view komponen diinisialisasi
  async ngAfterViewInit() {
    // Cegah eksekusi di lingkungan non-browser (misalnya saat rendering di server)
    if (typeof window === 'undefined') return;

    // Import dinamis Plotly secara asynchronous
    const Plotly = (await import('plotly.js-dist-min')).default;

    // Kelompokkan data berdasarkan grup ke dalam Map
    const grouped = new Map<string, number[]>();
    for (const d of this.data) {
      if (!grouped.has(d.grup)) grouped.set(d.grup, []);
      grouped.get(d.grup)!.push(d.nilai);
    }

    // Buat array trace untuk setiap grup sebagai input ke Plotly
    const traces = Array.from(grouped.entries()).map(([grup, nilai]) => ({
      y: nilai, // Data nilai untuk sumbu Y
      type: 'box', // Jenis chart
      name: grup, // Label grup di legend
      boxpoints: 'all', // Tampilkan semua titik data
      jitter: 0.5, // Tambahkan jitter agar titik tidak tumpang tindih
      whiskerwidth: 0.2,
      marker: { size: 6 },
      line: { width: 1 }
    }));

    // Layout pengaturan tampilan box plot
    const layout = {
      title: 'Box Plot ANOVA', // Judul plot
      yaxis: { title: this.yAxisLabel }, // Label sumbu-Y
      plot_bgcolor: 'rgba(255, 255, 255, 0.95)', // Warna latar area plot
      paper_bgcolor: 'rgba(255, 255, 255, 0.95)', // Warna latar kertas
    };

    // Render plot menggunakan Plotly ke elemen yang telah direferensikan
    Plotly.newPlot(this.boxPlotContainer.nativeElement, traces, layout, { responsive: true });
  }
}