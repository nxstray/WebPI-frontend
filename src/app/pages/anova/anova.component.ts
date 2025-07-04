import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnovaDTO, AnovaService } from '../../services/anova.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-anova',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './anova.component.html',
  styleUrls: ['./anova.component.scss']
})
export class AnovaComponent {
  anovaInputMethod: string = '';
  selectedAnovaFile: File | null = null;

  formData: Partial<AnovaDTO> = {
    namaKasus: '',
    namaVariabelDependen: '',
    alpha: 0.05,
    inputMethod: ''
  };

  manualGroups = [
    { nama: '', values: [null, null, null] }
  ];

  grupsFromExcel: { grup: string; nilai: number }[] = [];

  constructor(
    private anovaService: AnovaService,
    private router: Router
  ) {}

  addGroup() {
    this.manualGroups.push({ nama: '', values: [null, null, null] });
  }

  onAnovaFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedAnovaFile = input.files[0];

      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        this.grupsFromExcel = [];

        for (let i = 1; i < json.length; i++) {
          const row = json[i] as any[];
          const grup = row[0];
          const nilai = parseFloat(row[1]);

          if (typeof grup === 'string' && !isNaN(nilai)) {
            this.grupsFromExcel.push({ grup, nilai });
          }
        }
      };

      reader.readAsArrayBuffer(this.selectedAnovaFile);
    }
  }

  onSubmit() {
    const inputMethod = this.anovaInputMethod;

    if (inputMethod === 'excel') {
      if (this.grupsFromExcel.length === 0) {
        alert('Pastikan file Excel sudah diunggah dan valid.');
        return;
      }

      const grupMap = new Map<string, number[]>();
      for (const item of this.grupsFromExcel) {
        if (!grupMap.has(item.grup)) {
          grupMap.set(item.grup, []);
        }
        grupMap.get(item.grup)!.push(item.nilai);
      }

      const namaGrup: string[] = [];
      const nilaiGrup: number[][] = [];

      grupMap.forEach((nilai, nama) => {
        namaGrup.push(nama);
        nilaiGrup.push(nilai);
      });

      const data: AnovaDTO = {
        namaKasus: this.formData.namaKasus || '',
        namaVariabelDependen: this.formData.namaVariabelDependen || '',
        alpha: this.formData.alpha || 0.05,
        inputMethod,
        namaGrup,
        nilaiGrup
      };

      this.anovaService.simpanAnova(data).subscribe((res: any) => {
        const id = res?.idAnova;
        this.anovaService.getAnovaById(id).subscribe((hasil) => {
          this.anovaService.currentResult = hasil;
          this.router.navigate(['/result-anova']);
        });
      });

    } else if (inputMethod === 'manual') {
      const namaGrup: string[] = [];
      const nilaiGrup: number[][] = [];

      for (const grup of this.manualGroups) {
        if (!grup.nama || grup.values.some(v => v === null || isNaN(v))) {
          alert('Pastikan semua nama grup dan nilai terisi.');
          return;
        }
        namaGrup.push(grup.nama);
        nilaiGrup.push(grup.values.map(v => parseFloat(String(v))));
      }

      const data: AnovaDTO = {
        namaKasus: this.formData.namaKasus || '',
        namaVariabelDependen: this.formData.namaVariabelDependen || '',
        alpha: this.formData.alpha || 0.05,
        inputMethod,
        namaGrup,
        nilaiGrup
      };

      this.anovaService.simpanAnova(data).subscribe((res: any) => {
        const id = res?.idAnova;
        this.anovaService.getAnovaById(id).subscribe((hasil) => {
          this.anovaService.currentResult = hasil;
          this.router.navigate(['/result-anova']);
        });
      });

    } else {
      alert('Pilih metode input terlebih dahulu.');
    }
  }
}