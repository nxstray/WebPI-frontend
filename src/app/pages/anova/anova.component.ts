import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-anova',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  standalone: true,
  templateUrl: './anova.component.html',
  styleUrls: ['./anova.component.scss']
})
export class AnovaComponent {
  anovaInputMethod: string = '';
  selectedAnovaFile: File | null = null;

  manualGroups = [
    { values: [null, null, null] },
  ];

  addGroup() {
    this.manualGroups.push({ values: [null, null, null] });
  }

  onAnovaFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedAnovaFile = file;
    }
  }
}
