import { Component, OnInit, AfterViewChecked, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnovaService, AnovaResponseDTO } from '../../services/anova.service';
import { jStat } from 'jstat';
import { BoxPlotComponent } from '../box-plot/box-plot.component';

// Deklarasi global untuk MathJax (digunakan untuk merender rumus matematika)
declare var MathJax: any;

@Component({
  selector: 'app-anova-result',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BoxPlotComponent
  ],
  templateUrl: './anova-result.component.html',
  styleUrls: ['./anova-result.component.scss']
})
export class AnovaResultComponent implements OnInit, AfterViewChecked {
  // Menyimpan hasil uji ANOVA dari service
  hasil: AnovaResponseDTO | null = null;

  // Data mentah: nilai dari tiap grup
  data: { grup: string; nilai: number }[] = [];

  // Sum of Squares
  ssTotal = 0;   // Total Variasi
  ssAntar = 0;   // Variasi antar kelompok (between)
  ssDalam = 0;   // Variasi dalam kelompok (within)

  // Derajat bebas (Degrees of Freedom)
  dfTotal = 0;
  dfAntar = 0;
  dfDalam = 0;

  // Mean Square (rata-rata variasi)
  msAntar = 0;
  msDalam = 0;

  // Statistik uji F
  fHitung = 0;
  fTabel = 0;
  pValue = 0;

  // Rata-rata keseluruhan
  grandMean = 0;

  constructor(
    private anovaService: AnovaService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Ambil hasil dari service
    this.hasil = this.anovaService.currentResult;

    // Validasi apakah hasil tersedia dan memiliki data grup
    if (!this.hasil || !this.hasil.grups || this.hasil.grups.length === 0) return;

    // Simpan data ke dalam array
    this.data = this.hasil.grups;

    // Kelompokkan nilai berdasarkan nama grup
    const grupMap = new Map<string, number[]>();
    for (const row of this.data) {
      if (!grupMap.has(row.grup)) {
        grupMap.set(row.grup, []);
      }
      grupMap.get(row.grup)!.push(row.nilai);
    }

    // Hitung rata-rata keseluruhan (grand mean)
    const allNilai = this.data.map(d => d.nilai);
    this.grandMean = this.rataRata(allNilai);

    // Hitung total variasi (SS Total)
    this.ssTotal = allNilai.reduce(
      (sum, val) => sum + Math.pow(val - this.grandMean, 2),
      0
    );

    // Hitung variasi antar kelompok (SS Between)
    this.ssAntar = 0;
    for (const [, nilaiGrup] of grupMap) {
      const mean = this.rataRata(nilaiGrup);
      this.ssAntar += nilaiGrup.length * Math.pow(mean - this.grandMean, 2);
    }

    // Hitung variasi dalam kelompok (SS Within)
    this.ssDalam = this.ssTotal - this.ssAntar;

    // Hitung derajat bebas
    const k = grupMap.size;        // jumlah kelompok
    const n = allNilai.length;     // jumlah data
    this.dfTotal = n - 1;
    this.dfAntar = k - 1;
    this.dfDalam = n - k;

    // Hitung Mean Square (rata-rata variasi)
    this.msAntar = this.ssAntar / this.dfAntar;
    this.msDalam = this.ssDalam / this.dfDalam;

    // Hitung nilai F
    this.fHitung = parseFloat((this.msAntar / this.msDalam).toFixed(3));

    // Ambil alpha (level of significance), default 0.05
    const alpha = this.hasil.alpha ?? 0.05;

    // Hitung nilai F tabel dan p-value menggunakan jStat
    if (this.dfAntar > 0 && this.dfDalam > 0) {
      this.fTabel = parseFloat(
        jStat.centralF.inv(1 - alpha, this.dfAntar, this.dfDalam).toFixed(3)
      );
      this.pValue = parseFloat(
        (1 - jStat.centralF.cdf(this.fHitung, this.dfAntar, this.dfDalam)).toFixed(4)
      );
    }
  }

  ngAfterViewChecked(): void {
    // Pastikan MathJax merender ulang setelah view diperbarui
    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise();
    }
  }

  // Fungsi untuk menghitung rata-rata dari array nilai
  private rataRata(data: number[]): number {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  // Hipotesis nol (tidak ada perbedaan rata-rata antar grup)
  get hoText(): string {
    return 'Semua rata-rata antar kelompok adalah sama';
  }

  // Hipotesis alternatif (minimal ada satu perbedaan rata-rata)
  get haText(): string {
    const grups = [...new Set(this.data.map(d => d.grup))];
    return `Terdapat perbedaan rata-rata minimal satu kelompok dari ${grups.join(', ')}`;
  }

  // Tampilkan rumus dan hasil perhitungan Sum of Squares (SS)
  get rumusSS(): string {
    return `
      \\[
      SS_{Total} = \\sum_{i=1}^{n} (X_i - \\bar{X})^2 = ${this.ssTotal.toFixed(2)}
      \\]
      \\[
      SS_{Between} = \\sum_{j=1}^{k} n_j (\\bar{X}_j - \\bar{X})^2 = ${this.ssAntar.toFixed(2)}
      \\]
      \\[
      SS_{Within} = SS_{Total} - SS_{Between} = ${this.ssTotal.toFixed(2)} - ${this.ssAntar.toFixed(2)} = ${this.ssDalam.toFixed(2)}
      \\]
    `;
  }

  // Tampilkan rumus dan hasil perhitungan derajat bebas (df)
  get rumusDF(): string {
    return `
      \\[
      df_{Total} = n - 1 = ${this.dfTotal + 1} - 1 = ${this.dfTotal}
      \\]
      \\[
      df_{Between} = k - 1 = ${this.dfAntar + 1} - 1 = ${this.dfAntar}
      \\]
      \\[
      df_{Within} = n - k = ${this.dfTotal + 1} - ${this.dfAntar + 1} = ${this.dfDalam}
      \\]
    `;
  }

  // Tampilkan rumus dan hasil perhitungan Mean Square (MS)
  get rumusMS(): string {
    return `
      \\[
      MS_{Between} = \\frac{SS_{Between}}{df_{Between}} = \\frac{${this.ssAntar.toFixed(2)}}{${this.dfAntar}} = ${this.msAntar.toFixed(3)}
      \\]
      \\[
      MS_{Within} = \\frac{SS_{Within}}{df_{Within}} = \\frac{${this.ssDalam.toFixed(2)}}{${this.dfDalam}} = ${this.msDalam.toFixed(3)}
      \\]
    `;
  }

  // Tampilkan rumus dan hasil perhitungan F Hitung
  get rumusF(): string {
    return `
      \\[
      F = \\frac{MS_{Between}}{MS_{Within}} = \\frac{${this.msAntar.toFixed(3)}}{${this.msDalam.toFixed(3)}} = ${this.fHitung}
      \\]
    `;
  }

  // Tampilkan rumus dan hasil perhitungan p-value
  get rumusPValue(): string {
    return `
      \\[
      p = P(F_{${this.dfAntar}, ${this.dfDalam}} > ${this.fHitung}) = 1 - F_{\\text{cdf}}(${this.fHitung}, ${this.dfAntar}, ${this.dfDalam}) = ${this.pValue}
      \\]
    `;
  }
}
