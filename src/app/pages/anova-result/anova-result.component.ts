import { Component, OnInit, AfterViewChecked, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AnovaService, AnovaResponseDTO } from '../../services/anova.service';
import { jStat } from 'jstat';
import { BoxPlotComponent } from '../box-plot/box-plot.component';

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
  hasil: AnovaResponseDTO | null = null;
  data: { grup: string; nilai: number }[] = [];

  ssTotal = 0;
  ssAntar = 0;
  ssDalam = 0;

  dfTotal = 0;
  dfAntar = 0;
  dfDalam = 0;

  msAntar = 0;
  msDalam = 0;

  fHitung = 0;
  fTabel = 0;
  pValue = 0;

  grandMean = 0;

  constructor(private anovaService: AnovaService, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.hasil = this.anovaService.currentResult;

    if (!this.hasil || !this.hasil.grups || this.hasil.grups.length === 0) return;

    this.data = this.hasil.grups;

    const grupMap = new Map<string, number[]>();
    for (const row of this.data) {
      if (!grupMap.has(row.grup)) {
        grupMap.set(row.grup, []);
      }
      grupMap.get(row.grup)!.push(row.nilai);
    }

    const allNilai = this.data.map(d => d.nilai);
    this.grandMean = this.rataRata(allNilai);
    this.ssTotal = allNilai.reduce((sum, val) => sum + Math.pow(val - this.grandMean, 2), 0);

    this.ssAntar = 0;
    for (const [, nilaiGrup] of grupMap) {
      const mean = this.rataRata(nilaiGrup);
      this.ssAntar += nilaiGrup.length * Math.pow(mean - this.grandMean, 2);
    }

    this.ssDalam = this.ssTotal - this.ssAntar;

    const k = grupMap.size;
    const n = allNilai.length;
    this.dfTotal = n - 1;
    this.dfAntar = k - 1;
    this.dfDalam = n - k;

    this.msAntar = this.ssAntar / this.dfAntar;
    this.msDalam = this.ssDalam / this.dfDalam;
    this.fHitung = parseFloat((this.msAntar / this.msDalam).toFixed(3));

    const alpha = this.hasil.alpha ?? 0.05;
    if (this.dfAntar > 0 && this.dfDalam > 0) {
      this.fTabel = parseFloat(jStat.centralF.inv(1 - alpha, this.dfAntar, this.dfDalam).toFixed(3));
      this.pValue = parseFloat((1 - jStat.centralF.cdf(this.fHitung, this.dfAntar, this.dfDalam)).toFixed(4));
    }
  }

  ngAfterViewChecked(): void {
    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise();
    }
  }

  private rataRata(data: number[]): number {
    return data.reduce((a, b) => a + b, 0) / data.length;
  }

  get hoText(): string {
    return 'Semua rata-rata antar kelompok adalah sama';
  }

  get haText(): string {
    const grups = [...new Set(this.data.map(d => d.grup))];
    return `Terdapat perbedaan rata-rata minimal satu kelompok dari ${grups.join(', ')}`;
  }

  get rumusSS(): string {
    return `
      \\[
      SS_{Total} = \\sum_{i=1}^{n} (X_i - \\bar{X})^2 = ${this.ssTotal.toFixed(2)}
      \\]
      \\[
      SS_{Antar} = \\sum_{j=1}^{k} n_j (\\bar{X}_j - \\bar{X})^2 = ${this.ssAntar.toFixed(2)}
      \\]
      \\[
      SS_{Dalam} = SS_{Total} - SS_{Antar} = ${this.ssTotal.toFixed(2)} - ${this.ssAntar.toFixed(2)} = ${this.ssDalam.toFixed(2)}
      \\]
    `;
  }

  get rumusDF(): string {
    return `
      \\[
      df_{Total} = n - 1 = ${this.dfTotal + 1} - 1 = ${this.dfTotal}
      \\]
      \\[
      df_{Antar} = k - 1 = ${this.dfAntar + 1} - 1 = ${this.dfAntar}
      \\]
      \\[
      df_{Dalam} = n - k = ${this.dfTotal + 1} - ${this.dfAntar + 1} = ${this.dfDalam}
      \\]
    `;
  }

  get rumusMS(): string {
    return `
      \\[
      MS_{Antar} = \\frac{SS_{Antar}}{df_{Antar}} = \\frac{${this.ssAntar.toFixed(2)}}{${this.dfAntar}} = ${this.msAntar.toFixed(3)}
      \\]
      \\[
      MS_{Dalam} = \\frac{SS_{Dalam}}{df_{Dalam}} = \\frac{${this.ssDalam.toFixed(2)}}{${this.dfDalam}} = ${this.msDalam.toFixed(3)}
      \\]
    `;
  }

  get rumusF(): string {
    return `
      \\[
      F = \\frac{MS_{Antar}}{MS_{Dalam}} = \\frac{${this.msAntar.toFixed(3)}}{${this.msDalam.toFixed(3)}} = ${this.fHitung}
      \\]
    `;
  }
}