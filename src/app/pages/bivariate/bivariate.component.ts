import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KorelasiDTO, KorelasiService } from '../../services/korelasi.service';

import * as XLSX from 'xlsx';

@Component({
  selector: 'app-bivariate',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bivariate.component.html',
  styleUrls: ['./bivariate.component.scss']
})
export class BivariateComponent {
  inputMethod = '';
  selectedFile: File | null = null;

  xValues: number[] = [];
  yValues: number[] = [];

  formData: Partial<KorelasiDTO> = {
    namaKasus: '',
    namaVarX: '',
    namaVarY: '',
    alpha: 0.05,
    inputMethod: ''
  };

  constructor(
    private korelasiService: KorelasiService,
    private router: Router
  ) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        this.xValues = [];
        this.yValues = [];

        for (let i = 1; i < json.length; i++) {
          const row = json[i] as any[];
          const x = parseFloat(row[0]);
          const y = parseFloat(row[1]);

          if (!isNaN(x) && !isNaN(y)) {
            this.xValues.push(x);
            this.yValues.push(y);
          }
        }
      };

      reader.readAsArrayBuffer(this.selectedFile);
    }
  }

  tambahNilaiX() {
    this.xValues.push(0);
  }

  tambahNilaiY() {
    this.yValues.push(0);
  }

  hapusNilaiX(i: number) {
    this.xValues.splice(i, 1);
  }

  hapusNilaiY(i: number) {
    this.yValues.splice(i, 1);
  }

  ubahNilaiX(i: number, value: any) {
    const val = parseFloat(value);
    this.xValues[i] = isNaN(val) ? 0 : val;
  }

  ubahNilaiY(i: number, value: any) {
    const val = parseFloat(value);
    this.yValues[i] = isNaN(val) ? 0 : val;
  }

  onSubmit() {
    if (this.xValues.length !== this.yValues.length) {
      alert('Jumlah nilai X dan Y harus sama.');
      return;
    }

    const data: KorelasiDTO = {
      namaKasus: this.formData.namaKasus || '',
      namaVarX: this.formData.namaVarX || '',
      namaVarY: this.formData.namaVarY || '',
      alpha: this.formData.alpha || 0.05,
      inputMethod: this.inputMethod,
      xValues: this.xValues,
      yValues: this.yValues
    };

    this.korelasiService.simpanKorelasi(data).subscribe((res: any) => {
      const id = res?.idKorelasi;
      this.korelasiService.getKorelasiById(id).subscribe((hasil) => {
        this.korelasiService.currentResult = hasil;
        this.router.navigate(['/result-bivariate']);
      });
    });
  }
}