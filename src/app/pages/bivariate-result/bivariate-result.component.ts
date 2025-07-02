import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KorelasiService, KorelasiResponseDTO } from '../../services/korelasi.service';

declare var MathJax: any;

@Component({
  selector: 'app-bivariate-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './bivariate-result.component.html',
  styleUrls: ['./bivariate-result.component.scss']
})
export class BivariateResultComponent implements OnInit, AfterViewChecked {
  hasil: KorelasiResponseDTO | null = null;

  data = [
    { x: 45, y: 35240 },
    { x: 50, y: 36000 },
    { x: 45, y: 35600 },
    { x: 60, y: 41000 },
    { x: 70, y: 43000 },
    { x: 60, y: 42300 },
    { x: 50, y: 37500 },
    { x: 40, y: 32000 },
    { x: 60, y: 41500 },
    { x: 60, y: 41500 }
  ];

  sumX = 0;
  sumY = 0;
  sumX2 = 0;
  sumY2 = 0;
  sumXY = 0;
  r = 0;
  tHitung = 0;

  constructor(private korelasiService: KorelasiService) {}

  ngOnInit(): void {
    const n = this.data.length;

    this.data = this.data.map(d => {
      const x2 = d.x * d.x;
      const y2 = d.y * d.y;
      const xy = d.x * d.y;
      this.sumX += d.x;
      this.sumY += d.y;
      this.sumX2 += x2;
      this.sumY2 += y2;
      this.sumXY += xy;
      return { ...d, x2, y2, xy };
    });

    const numerator = n * this.sumXY - this.sumX * this.sumY;
    const denominator = Math.sqrt(
      (n * this.sumX2 - this.sumX ** 2) *
      (n * this.sumY2 - this.sumY ** 2)
    );
    this.r = parseFloat((numerator / denominator).toFixed(3));

    const df = n - 2;
    this.tHitung = this.r * Math.sqrt(df) / Math.sqrt(1 - this.r * this.r);

    this.hasil = this.korelasiService.currentResult || {
      idKorelasi: 0,
      namaKasus: 'Durasi Pengiklanan terhadap Penjualan',
      namaVarX: 'Durasi Pengiklanan',
      namaVarY: 'Penjualan Barang',
      ho: 'Tidak terdapat hubungan yang signifikan',
      ha: 'Terdapat hubungan yang signifikan',
      alpha: 0.05,
      n,
      xvalues: this.data.map(d => d.x),
      yvalues: this.data.map(d => d.y)
    };
  }

  ngAfterViewChecked(): void {
    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise();
    }
  }

  get rumusR(): string {
    const n = this.hasil?.n ?? 0;
    return `\\[
      r = \\frac{${n} \\times ${this.sumXY} - ${this.sumX} \\times ${this.sumY}}
      {\\sqrt{(${n} \\times ${this.sumX2} - ${this.sumX}^2)(${n} \\times ${this.sumY2} - ${this.sumY}^2)}}
      = ${this.r}
    \\]`;
  }

  get rumusT(): string {
    const n = this.hasil?.n ?? 0;
    const df = n - 2;
    return `\\[
      t = \\frac{${this.r} \\times \\sqrt{${df}}}{\\sqrt{1 - ${this.r}^2}} = ${this.tHitung.toFixed(3)}
    \\]`;
  }

  get rumusR2(): string {
    const r2 = this.r * this.r;
    return `\\[
      R^2 = ${this.r}^2 = ${r2.toFixed(3)} \\Rightarrow ${(r2 * 100).toFixed(1)}\\%
    \\]`;
  }
}