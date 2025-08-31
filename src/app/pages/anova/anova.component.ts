// Import semua modul Angular dan dependensi yang dibutuhkan
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnovaDTO, AnovaService } from '../../services/anova.service';
import * as XLSX from 'xlsx';

// Dekorator komponen Angular
@Component({
  selector: 'app-anova',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './anova.component.html',
  styleUrls: ['./anova.component.scss']
})
export class AnovaComponent {
  // Menyimpan metode input yang dipilih user (manual/excel)
  anovaInputMethod: string = '';

  // File excel yang di-upload user
  selectedAnovaFile: File | null = null;

  // Data form yang akan dikirim ke backend
  formData: Partial<AnovaDTO> = {
    namaKasus: '',
    namaVariableDependen: '',
    namaVariableIndependen: '',
    alpha: 0.05,
    inputMethod: ''
  };

  // List grup untuk input manual
  manualGroups = Array.from({ length: 3 }, () => ({ nama: '', values: [null, null, null] }));

  // Data hasil parsing excel
  grupsFromExcel: { grup: string; nilai: number }[] = [];

  // Pesan notifikasi untuk user
  notifMessage: string = '';

  // Tipe notifikasi, bisa 'success' atau 'error'
  // Defaultnya adalah 'error'
  notifType: 'success' | 'error' = 'error';

  constructor(private anovaService: AnovaService, private router: Router) {}

  // Tampilkan notif ke layar dan hilangkan setelah 3 detik
  showNotif(message: string, type: 'success' | 'error' = 'error') {
    this.notifMessage = message;
    this.notifType = type;
    setTimeout(() => (this.notifMessage = ''), 3000);
  }

  // Tambah grup input manual
  addGroup() {
    this.manualGroups.push({ nama: '', values: [null, null, null] });
  }

  // Hapus grup
  removeGroup(index: number) {
    if (this.manualGroups.length > 3) {
      this.manualGroups.splice(index, 1);
    }
  }

  // Tambah nilai di grup
  addValueInput(groupIndex: number) {
    this.manualGroups[groupIndex].values.push(null);
  }

  // Hapus nilai dari grup
  removeValueInput(groupIndex: number, valueIndex: number) {
    if (this.manualGroups[groupIndex].values.length > 2) {
      this.manualGroups[groupIndex].values.splice(valueIndex, 1);
    }
  }

  // Validasi variance per grup dan antar grup
  validateVariance(): string | null {
    // Kumpulkan data per grup
    const groups: number[][] = [];
    
    for (const group of this.manualGroups) {
      const validValues: number[] = [];
      for (const value of group.values) {
        if (value !== null && !isNaN(Number(value))) {
          validValues.push(Number(value));
        }
      }
      if (validValues.length >= 2) {
        groups.push(validValues);
      }
    }
    
    if (groups.length < 3) {
      return 'Minimal harus ada 3 kelompok yang valid';
    }
    
    // Kumpulkan semua nilai
    const allValues = groups.flat();
    const uniqueValues = new Set(allValues);
    
    // Cek jika semua nilai identik
    if (uniqueValues.size === 1) {
      return 'Semua nilai dalam data identik. ANOVA membutuhkan variasi dalam data untuk dapat dihitung.';
    }
    
    // Hitung mean per grup untuk cek between-group variance
    const groupMeans = groups.map(group => 
      group.reduce((sum, val) => sum + val, 0) / group.length
    );
    
    const uniqueMeans = new Set(groupMeans.map(mean => Math.round(mean * 1000000) / 1000000));
    
    // Cek within-group variance
    const hasWithinGroupVariance = groups.some(group => new Set(group).size > 1);
    
    // Cek between-group variance
    const hasBetweenGroupVariance = uniqueMeans.size > 1;
    
    if (!hasWithinGroupVariance && !hasBetweenGroupVariance) {
      return 'Data tidak memiliki variasi yang cukup untuk analisis ANOVA. Pastikan ada perbedaan nilai dalam grup atau antar grup.';
    }
    
    return null;
  }

  // Validasi nama grup kosong
  validateGroupNames(): string | null {
    // Cek apakah ada nama grup yang kosong atau null
    const hasEmptyName = this.manualGroups.some(group => 
      !group.nama || group.nama.trim() === ''
    );
    
    if (hasEmptyName) {
      return 'Nama grup tidak boleh kosong ya.';
    }
    
    return null;
  }

  // Saat user memilih file Excel
  onAnovaFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      if (!file.name.endsWith('.xlsx')) {
        this.showNotif('Eits, file harus berformat .xlsx ya!');
        return;
      }

      this.selectedAnovaFile = file;
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        this.grupsFromExcel = [];

        // Parsing baris per baris
        for (let i = 1; i < json.length; i++) {
          const row = json[i] as any[];
          const grup = row[0];
          const nilai = parseFloat(row[1]);

          if ((typeof grup === 'string' || typeof grup === 'number') && !isNaN(nilai)) {
            this.grupsFromExcel.push({ 
              grup: grup.toString(), 
              nilai: nilai  // Memperbolehkan nilai negatif, positif, nol, dan desimal
            });
          }
        }

        // Cek apakah parsing menghasilkan data
        if (this.grupsFromExcel.length === 0) {
          this.showNotif('Tidak ada data valid yang berhasil dibaca dari Excel!');
          return;
        }

        // Validasi variance untuk data Excel
        const varianceError = this.validateExcelVariance();
        if (varianceError) {
          this.showNotif(varianceError);
          return;
        }

        // Tampilkan info berhasil parsing
        this.showNotif(`Berhasil memuat ${this.grupsFromExcel.length} data dari Excel!`, 'success');
      };

      reader.readAsArrayBuffer(this.selectedAnovaFile);
    }
  }

  // Validasi variance untuk data Excel
  validateExcelVariance(): string | null {
    if (this.grupsFromExcel.length === 0) return 'Data Excel kosong';
    
    // Group data by grup name
    const grupMap = new Map<string, number[]>();
    for (const item of this.grupsFromExcel) {
      if (!grupMap.has(item.grup)) {
        grupMap.set(item.grup, []);
      }
      grupMap.get(item.grup)!.push(item.nilai);
    }

    if (grupMap.size < 3) {
      return 'Minimal harus ada 3 kelompok!';
    }

    // Kumpulkan semua nilai
    const allValues = this.grupsFromExcel.map(item => item.nilai);
    const uniqueValues = new Set(allValues);
    
    // Cek jika semua nilai identik
    if (uniqueValues.size === 1) {
      return 'Semua nilai dalam data identik. ANOVA membutuhkan variasi dalam data untuk dapat dihitung.';
    }

    return null;
  }

  // Saat form disubmit
  onSubmit() {
    const { namaKasus, namaVariableDependen, namaVariableIndependen, alpha } = this.formData;
    const inputMethod = this.anovaInputMethod;

    // Validasi awal
    if (!inputMethod || !namaKasus || !namaVariableDependen || !namaVariableIndependen || !alpha) {
      this.showNotif('Eits, pastikan semua field terisi dengan benar ya!');
      return;
    }

    let namaGrup: string[] = [];
    let nilaiGrup: number[][] = [];

    // Handle input manual
    if (inputMethod === 'manual') {
      // Validasi nama grup kosong terlebih dahulu
      const nameValidationError = this.validateGroupNames();
      if (nameValidationError) {
        this.showNotif(nameValidationError);
        return;
      }

      // Validasi dasar grup manual - fokus pada nilai kosong/null/undefined
      console.log('=== ANOVA MANUAL INPUT VALIDATION DEBUG ===');
      console.log('Input method:', inputMethod);
      console.log('Manual groups array:', JSON.stringify(this.manualGroups));
      console.log('Manual groups length:', this.manualGroups.length);
      
      // Debug setiap grup
      this.manualGroups.forEach((grup, grupIndex) => {
        console.log(`--- Group ${grupIndex} Debug ---`);
        console.log(`Group name: "${grup.nama}"`);
        console.log(`Group values:`, grup.values);
        console.log(`Group values length:`, grup.values.length);
        console.log(`Group values types:`, grup.values.map((val, idx) => `[${idx}]: ${typeof val} = "${val}"`));
        
        // Debug setiap nilai dalam grup
        grup.values.forEach((value, valueIndex) => {
          console.log(`Group[${grupIndex}].values[${valueIndex}]: value="${value}", type="${typeof value}", isNull=${value == null}, isUndefined=${value === undefined}, isEmpty=${value === ''}, isNaN=${isNaN(Number(value))}`);
        });
      });

      const hasEmptyValues = this.manualGroups.some((grup, grupIndex) => {
        console.log(`--- Checking Group ${grupIndex}: "${grup.nama}" ---`);
        console.log(`Values length: ${grup.values.length}`);
        
        // Cek minimal 2 nilai per grup
        if (grup.values.length < 2) {
          console.error(`Group ${grupIndex} has less than 2 values: ${grup.values.length}`);
          return true;
        }
        
        // Cek setiap nilai dalam grup
        const hasEmpty = grup.values.some((v, valueIndex) => {
          console.log(`Checking Group[${grupIndex}].values[${valueIndex}]: "${v}"`);
          
          const isNull = v === null;
          const isUndefined = v === undefined;
          const isEmpty = v === '';
          const isNaN_check = isNaN(Number(v));
          
          console.log(`Value checks - null: ${isNull}, undefined: ${isUndefined}, empty: ${isEmpty}, isNaN: ${isNaN_check}`);
          
          const isInvalid = isNull || isUndefined || isEmpty || isNaN_check;
          
          if (isInvalid) {
            console.error(`INVALID VALUE FOUND in Group ${grupIndex}, Value ${valueIndex}`);
            console.error(`Value: "${v}", type: ${typeof v}`);
            console.error(`Checks - null: ${isNull}, undefined: ${isUndefined}, empty: ${isEmpty}, isNaN: ${isNaN_check}`);
          } else {
            console.log(`Group[${grupIndex}].values[${valueIndex}] is valid`);
          }
          
          return isInvalid;
        });
        
        console.log(`Group ${grupIndex} has empty values:`, hasEmpty);
        return hasEmpty;
      });

      console.log('Final hasEmptyValues result:', hasEmptyValues);
      console.log('Manual groups length check:', this.manualGroups.length);
      console.log('=====================================');

      if (hasEmptyValues || this.manualGroups.length < 3) {
        console.error('ANOVA MANUAL VALIDATION FAILED');
        console.error('Has empty values:', hasEmptyValues);
        console.error('Groups count:', this.manualGroups.length);
        console.error('Minimum groups required: 3');
        this.showNotif('Pastikan nilai kelompok tidak ada yang kosong ya.');
        return;
      }

      // Validasi variance
      const varianceError = this.validateVariance();
      if (varianceError) {
        this.showNotif(varianceError);
        return;
      }

      namaGrup = this.manualGroups.map(g => g.nama!.trim());
      
      // Cek nama grup duplikat
      const setNama = new Set(namaGrup);
      if (setNama.size !== namaGrup.length) {
        this.showNotif('Nama grup tidak boleh sama!');
        return;
      }

      // Konversi semua nilai ke number (termasuk negatif, nol, desimal)
      nilaiGrup = this.manualGroups.map(g => g.values.map(v => parseFloat(String(v))));

      console.log('Final data to send:');
      console.log('namaGrup:', namaGrup);
      console.log('nilaiGrup:', nilaiGrup);

      // Kirim data manual menggunakan endpoint /manual
      const data: AnovaDTO = {
        namaKasus,
        namaVariableDependen,
        namaVariableIndependen,
        alpha,
        inputMethod,
        namaGrup,
        nilaiGrup
      };

      this.anovaService.simpanAnovaManual(data).subscribe({
        next: (res: any) => {
          const id = res?.idAnova;
          this.anovaService.getAnovaById(id).subscribe((hasil) => {
            this.anovaService.currentResult = hasil;
            this.router.navigate(['/result-anova']);
          });
        },
        error: (err) => {
          const message = err?.error?.message || 'Terjadi kesalahan saat menyimpan data.';
          this.showNotif(message);
          console.error('Anova manual error:', err);
        }
      });

      return;
    }

    // Handle input dari Excel
    if (inputMethod === 'excel') {
      if (!this.selectedAnovaFile || this.grupsFromExcel.length === 0) {
        this.showNotif('Mohon upload file Excel yang valid ya!');
        return;
      }

      // Validasi variance Excel sudah dilakukan saat file di-upload
      const grupMap = new Map<string, number[]>();
      for (const item of this.grupsFromExcel) {
        if (!grupMap.has(item.grup)) {
          grupMap.set(item.grup, []);
        }
        grupMap.get(item.grup)!.push(item.nilai);
      }

      if (grupMap.size < 3) {
        this.showNotif('Minimal harus ada 3 kelompok!');
        return;
      }

      // Cek minimal 2 data per grup
      for (const [grupName, values] of grupMap.entries()) {
        if (values.length < 2) {
          this.showNotif(`Grup ${grupName} harus memiliki minimal 2 data!`);
          return;
        }
      }

      grupMap.forEach((nilai, nama) => {
        namaGrup.push(nama);
        nilaiGrup.push(nilai);
      });

      const data: any = {
        namaKasus,
        namaVariableDependen,
        namaVariableIndependen,
        alpha,
        inputMethod,
        namaGrup,
        nilaiGrup
      };

      // Kirim data Excel menggunakan endpoint /excel
      const payload = new FormData();
      payload.append('data', JSON.stringify(data));
      payload.append('file', this.selectedAnovaFile);

      this.anovaService.simpanAnovaExcel(payload).subscribe({
        next: (res: any) => {
          const id = res?.idAnova;
          this.anovaService.getAnovaById(id).subscribe((hasil) => {
            this.anovaService.currentResult = hasil;
            this.router.navigate(['/result-anova']);
          });
        },
        error: (err) => {
          const message = err?.error?.message || 'Terjadi kesalahan saat menyimpan data.';
          this.showNotif(message);
          console.error('Anova excel error:', err);
        }
      });
    }
  }
}