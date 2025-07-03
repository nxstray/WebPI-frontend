import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AnovaDTO, AnovaService } from '../../services/anova.service';

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
    ho: '',
    ha: '',
    alpha: 0.05,
    inputMethod: ''
  };

  manualGroups = [
    { nama: '', values: [null, null, null] }
  ];

  constructor(
    private anovaService: AnovaService,
    private router: Router
  ) {}

  addGroup() {
    this.manualGroups.push({ nama: '', values: [null, null, null] });
  }

  onAnovaFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedAnovaFile = file;
    }
  }

  onSubmit() {
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
      ho: this.formData.ho || '',
      ha: this.formData.ha || '',
      alpha: this.formData.alpha || 0.05,
      inputMethod: this.anovaInputMethod,
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
  }
}