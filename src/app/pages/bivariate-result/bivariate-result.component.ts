import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { KorelasiService, KorelasiResponseDTO } from '../../services/korelasi.service';
import { ScatterPlotComponent } from '../scatter-plot/scatter-plot.component';

declare var MathJax: any;

@Component({
  selector: 'app-bivariate-result',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ScatterPlotComponent
  ],
  templateUrl: './bivariate-result.component.html',
  styleUrls: ['./bivariate-result.component.scss']
})
export class BivariateResultComponent implements OnInit, AfterViewChecked {
  hasil: KorelasiResponseDTO | null = null;

  data: { x: number; y: number; x2: number; y2: number; xy: number }[] = [];

  sumX = 0;
  sumY = 0;
  sumX2 = 0;
  sumY2 = 0;
  sumXY = 0;

  r = 0;
  tHitung = 0;
  tTabel = 0;

  varX = 'X';
  varY = 'Y';

  constructor(private korelasiService: KorelasiService) {}

  ngOnInit(): void {
    this.hasil = this.korelasiService.currentResult;

    if (!this.hasil || !this.hasil.xvalues || !this.hasil.yvalues || this.hasil.xvalues.length !== this.hasil.yvalues.length) {
      console.error('Data tidak valid atau belum diisi.');
      return;
    }

    const n = this.hasil.xvalues.length;
    this.data = [];

    for (let i = 0; i < n; i++) {
      const x = this.hasil.xvalues[i];
      const y = this.hasil.yvalues[i];
      const x2 = x * x;
      const y2 = y * y;
      const xy = x * y;

      this.sumX += x;
      this.sumY += y;
      this.sumX2 += x2;
      this.sumY2 += y2;
      this.sumXY += xy;

      this.data.push({ x, y, x2, y2, xy });
    }

    const numerator = n * this.sumXY - this.sumX * this.sumY;
    const denominator = Math.sqrt(
      (n * this.sumX2 - this.sumX ** 2) *
      (n * this.sumY2 - this.sumY ** 2)
    );

    this.r = parseFloat((numerator / denominator).toFixed(3));

    const df = n - 2;
    this.tHitung = parseFloat((this.r * Math.sqrt(df) / Math.sqrt(1 - this.r * this.r)).toFixed(3));
    this.tTabel = this.lookupTTable(df);

    this.setNamaVariabel();
  }

  ngAfterViewChecked(): void {
    if (typeof MathJax !== 'undefined') {
      MathJax.typesetPromise();
    }
  }

  private setNamaVariabel(): void {
    const x = this.hasil?.namaVarX?.trim().toLowerCase() || 'X';
    const y = this.hasil?.namaVarY?.trim().toLowerCase() || 'Y';
    this.varX = x;
    this.varY = y;
  }

  private lookupTTable(df: number): number {
    const tTable: { [key: number]: number } = {
      1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365,
      8: 2.306, 9: 2.262, 10: 2.228, 11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145,
      15: 2.131, 16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086, 21: 2.080,
      22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060, 26: 2.056, 27: 2.052, 28: 2.048,
      29: 2.045, 30: 2.042
    };
    return df <= 30 ? tTable[df] : 1.96;
  }

  get rumusR(): string {
    const n = this.hasil?.n ?? 0;
    return `\\[
      r = \\frac{n \\cdot \\sum XY - \\sum X \\cdot \\sum Y}
      {\\sqrt{(n \\cdot \\sum X^2 - (\\sum X)^2)(n \\cdot \\sum Y^2 - (\\sum Y)^2)}}
    \\]
    \\[
      r = \\frac{${n} \\cdot ${this.sumXY} - ${this.sumX} \\cdot ${this.sumY}}
      {\\sqrt{(${n} \\cdot ${this.sumX2} - ${this.sumX}^2)(${n} \\cdot ${this.sumY2} - ${this.sumY}^2)}} = ${this.r}
    \\]`;
  }

  get rumusT(): string {
    const n = this.hasil?.n ?? 0;
    const df = n - 2;
    return `\\[
      t = \\frac{r \\cdot \\sqrt{n - 2}}{\\sqrt{1 - r^2}}
    \\]
    \\[
      t = \\frac{${this.r} \\cdot \\sqrt{${df}}}{\\sqrt{1 - ${this.r}^2}} = ${this.tHitung}
    \\]`;
  }

  get rumusR2(): string {
    const r2 = this.r * this.r;
    return `\\[
      R^2 = ${this.r}^2 = ${r2.toFixed(3)} = ${(r2 * 100).toFixed(1)}\\%
    \\]`;
  }

  get xValues(): number[] {
    return this.data.map(d => d.x);
  }

  get yValues(): number[] {
    return this.data.map(d => d.y);
  }

  get hoText(): string {
    return `Tidak terdapat hubungan yang signifikan antara ${this.varX} dan ${this.varY}`;
  }

  get haText(): string {
    return `Terdapat hubungan yang signifikan antara ${this.varX} dan ${this.varY}`;
  }
}