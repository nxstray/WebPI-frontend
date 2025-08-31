import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { KorelasiService } from '../../services/korelasi.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-bivariate',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './bivariate.component.html',
  styleUrls: ['./bivariate.component.scss']
})
export class BivariateComponent {
  // Menyimpan metode input yang dipilih user (manual/excel)
  inputMethod: string = '';

  // File excel yang di-upload user
  selectedFile: File | null = null;

  // Pesan notifikasi untuk user
  notifMessage: string = '';

  // Tipe notifikasi, bisa 'success' atau 'error'
  notifType: 'success' | 'error' = 'error';

  // Nilai variabel X dan Y
  xValues: number[] = [];
  yValues: number[] = [];

  formData: any = {
    namaKasus: '',
    namaVarX: '',
    namaVarY: '',
    alpha: 0.05,
  };

  constructor(
    private korelasiService: KorelasiService,
    private router: Router
  ) {}

  // Tampilkan notif ke layar dan hilangkan setelah 3 detik
  showNotif(message: string, type: 'success' | 'error' = 'error') {
    this.notifMessage = message;
    this.notifType = type;
    setTimeout(() => (this.notifMessage = ''), 3000);
  }

  tambahNilaiX() {
    this.xValues.push(null as any);
  }

  tambahNilaiY() {
    this.yValues.push(null as any);
  }

  hapusNilaiX(i: number) {
    this.xValues.splice(i, 1);
  }

  hapusNilaiY(i: number) {
    this.yValues.splice(i, 1);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (!file.name.endsWith('.xlsx')) {
        this.showNotif('File harus berformat .xlsx ya!');
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        //Reset values
        this.xValues = [];
        this.yValues = [];

        //Parse nama case dan variabel dari header Excel jika ada
        if (json.length > 0) {
          const headerRow = json[0] as any[];
          
          //Cek nama case dari cell A1 (jika bukan "No")
          if (headerRow[0] && typeof headerRow[0] === 'string' && headerRow[0].trim() !== 'No') {
            this.formData.namaKasus = headerRow[0].trim();
          }
          
          //Cek nama variabel X dari cell B1
          if (headerRow[1] && typeof headerRow[1] === 'string') {
            this.formData.namaVarX = headerRow[1].trim();
          }
          
          //Cek nama variabel Y dari cell C1
          if (headerRow[2] && typeof headerRow[2] === 'string') {
            this.formData.namaVarY = headerRow[2].trim();
          }
        }

        //Parse data dari kolom yang benar
        for (let i = 1; i < json.length; i++) {
          const row = json[i] as any[];
          
          const xRaw = row[1]; //Kolom B
          const yRaw = row[2]; //Kolom C
          
          //Skip jika cell kosong
          if (xRaw == null || yRaw == null) continue;
          
          //Parse nilai dengan handling string dan number
          let x: number, y: number;
          
          try {
            x = typeof xRaw === 'string' ? 
                parseFloat(xRaw.replace(',', '.')) : 
                parseFloat(xRaw.toString());
          } catch (e) {
            console.warn(`Failed to parse X value at row ${i + 1}:`, xRaw);
            continue;
          }
          
          try {
            y = typeof yRaw === 'string' ? 
                parseFloat(yRaw.replace(',', '.')) : 
                parseFloat(yRaw.toString());
          } catch (e) {
            console.warn(`Failed to parse Y value at row ${i + 1}:`, yRaw);
            continue;
          }
          
          //Validasi hasil parsing
          if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
            this.xValues.push(x);
            this.yValues.push(y);
          } else {
            console.warn(`Invalid values at row ${i + 1}: X=${x}, Y=${y}`);
          }
        }

        //LOG: Debug info
        console.log('=== EXCEL PARSING RESULT ===');
        console.log('Parsed case name:', this.formData.namaKasus);
        console.log('Parsed var X name:', this.formData.namaVarX);
        console.log('Parsed var Y name:', this.formData.namaVarY);
        console.log('X values:', this.xValues);
        console.log('Y values:', this.yValues);
        console.log('Data count:', this.xValues.length);
        console.log('============================');

        //Cek apakah data berhasil diparsing
        if (this.xValues.length === 0) {
          this.showNotif('Tidak ada data valid yang bisa diparsing dari Excel. Pastikan data X di kolom B dan Y di kolom C!');
          return;
        }

        //Tampilkan info berhasil parsing
        this.showNotif(`Berhasil memuat ${this.xValues.length} pasang data dari Excel!`, 'success');
      };

      reader.readAsArrayBuffer(file);
    }
  }

  onSubmit() {
    const { namaKasus, namaVarX, namaVarY, alpha } = this.formData;

    // Validasi 1 & 2: Jika semua input kosong atau tidak lengkap
    if (!namaKasus || !namaVarX || !namaVarY || alpha == null) {
      this.showNotif('Eits, pastikan semua field terisi dengan benar ya!');
      return;
    }

    // Validasi 3: Jika belum memilih input method
    if (!this.inputMethod) {
      this.showNotif('Eits, pilih metode input data dulu ya!');
      return;
    }

    // Validasi fungsi bersama untuk manual & excel
    const validateXandY = (xVals: number[], yVals: number[]): string | null => {
      if (xVals.length < 5 || yVals.length < 5) {
        return 'Minimal harus ada 5 input untuk variabel X dan Y.';
      }

      if (xVals.length !== yVals.length) {
        return 'Jumlah data nilai X dan Y harus sama ya.';
      }

      // Validasi untuk input manual - cek apakah ada nilai yang kosong/null/undefined
      if (this.inputMethod === 'manual') {
        console.log('=== MANUAL INPUT VALIDATION DEBUG ===');
        console.log('Input method:', this.inputMethod);
        console.log('X Values array:', this.xValues);
        console.log('Y Values array:', this.yValues);
        console.log('X Values length:', this.xValues.length);
        console.log('Y Values length:', this.yValues.length);
        console.log('X Values types:', this.xValues.map((val, idx) => `[${idx}]: ${typeof val} = "${val}"`));
        console.log('Y Values types:', this.yValues.map((val, idx) => `[${idx}]: ${typeof val} = "${val}"`));
        
        for (let i = 0; i < xVals.length; i++) {
          console.log(`--- Checking index ${i} ---`);
          console.log(`xVals[${i}]:`, xVals[i], `(type: ${typeof xVals[i]})`);
          console.log(`yVals[${i}]:`, yVals[i], `(type: ${typeof yVals[i]})`);
          
          // Check null/undefined
          const xIsNull = xVals[i] == null;
          const xIsUndefined = xVals[i] === undefined;
          const yIsNull = yVals[i] == null;
          const yIsUndefined = yVals[i] === undefined;
          
          console.log(`xVals[${i}] == null:`, xIsNull);
          console.log(`xVals[${i}] === undefined:`, xIsUndefined);
          console.log(`yVals[${i}] == null:`, yIsNull);
          console.log(`yVals[${i}] === undefined:`, yIsUndefined);
          
          if (xVals[i] == null || xVals[i] === undefined || 
              yVals[i] == null || yVals[i] === undefined) {
            console.error(`NULL/UNDEFINED VALIDATION FAILED at index ${i}`);
            console.error(`X value: ${xVals[i]} (null: ${xIsNull}, undefined: ${xIsUndefined})`);
            console.error(`Y value: ${yVals[i]} (null: ${yIsNull}, undefined: ${yIsUndefined})`);
            console.log('=====================================');
            return 'Pastikan nilai X dan Y tidak ada yang kosong ya.';
          }
          
          // Cek jika nilai tidak valid (NaN)
          const xNumber = Number(xVals[i]);
          const yNumber = Number(yVals[i]);
          const xIsNaN = isNaN(xNumber);
          const yIsNaN = isNaN(yNumber);
          
          console.log(`Number(xVals[${i}]):`, xNumber, `(isNaN: ${xIsNaN})`);
          console.log(`Number(yVals[${i}]):`, yNumber, `(isNaN: ${yIsNaN})`);
          
          if (isNaN(Number(xVals[i])) || isNaN(Number(yVals[i]))) {
            console.error(`NaN VALIDATION FAILED at index ${i}`);
            console.error(`X original: ${xVals[i]} -> Number: ${xNumber} (isNaN: ${xIsNaN})`);
            console.error(`Y original: ${yVals[i]} -> Number: ${yNumber} (isNaN: ${yIsNaN})`);
            console.log('=====================================');
            return 'Pastikan nilai X dan Y tidak ada yang kosong ya.';
          }
          
          console.log(`Index ${i} validation passed`);
        }
        
        console.log('All manual input validation passed');
        console.log('=====================================');
      }

      // Validasi variansi - cek apakah semua nilai sama (tidak ada variansi)
      const uniqueX = [...new Set(xVals)];
      const uniqueY = [...new Set(yVals)];
      
      if (uniqueX.length === 1) {
        return 'Nilai X tidak boleh sama semua ya.';
      }
      if (uniqueY.length === 1) {
        return 'Nilai Y tidak boleh sama semua ya.';
      }

      return null;
    };

    if (this.inputMethod === 'manual') {
      const validationMsg = validateXandY(this.xValues, this.yValues);
      if (validationMsg) {
        this.showNotif(validationMsg);
        return;
      }

      // Lanjut proses jika valid
      const data = {
        namaKasus,
        namaVarX,
        namaVarY,
        alpha: Number(alpha),
        inputMethod: this.inputMethod,
        xValues: this.xValues.map(x => Number(x)),
        yValues: this.yValues.map(y => Number(y))
      };

      console.log('Data yang akan dikirim:', JSON.stringify(data, null, 2));

      this.korelasiService.simpanKorelasiManual(data).subscribe({
        next: (res: any) => this.handleResponse(res),
        error: (err) => this.handleError(err)
      });

    } else if (this.inputMethod === 'excel') {
      if (!this.selectedFile) {
        this.showNotif('Pilih file Excel yang valid ya!');
        return;
      }

      const validationMsg = validateXandY(this.xValues, this.yValues);
      if (validationMsg) {
        this.showNotif(validationMsg);
        return;
      }

      // Validasi variasi sudah dicek di validateXandY, tidak perlu lagi di sini

      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('data', JSON.stringify({
        namaKasus,
        namaVarX,
        namaVarY,
        alpha: Number(alpha),
        inputMethod: this.inputMethod
      }));

      this.korelasiService.simpanKorelasiExcel(formData).subscribe({
        next: (res: any) => this.handleResponse(res),
        error: (err) => this.handleError(err)
      });
    }
  }

  private handleResponse(res: any) {
    const id = res?.idKorelasi;
    if (!id) {
      this.showNotif('ID hasil tidak ditemukan!');
      return;
    }

    //NAVIGATE: Ambil hasil dan navigasi ke halaman result
    this.korelasiService.getKorelasiById(id).subscribe((hasil) => {
      this.korelasiService.currentResult = hasil;
      this.router.navigate(['/result-bivariate']);
    });
  }

  private handleError(err: any) {
    //ERROR HANDLING
    const msg = err?.error?.message || 'Terjadi kesalahan saat menyimpan data.';
    this.showNotif(msg);
    console.error('Korelasi error:', err);
  } 
}