import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule} from '@angular/forms';

@Component({
  selector: 'app-bivariate',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  standalone: true,
  templateUrl: './bivariate.component.html',
  styleUrls: ['./bivariate.component.scss']
})
export class BivariateComponent {
  inputMethod: string = '';
  selectedFile: File | null = null;

  xValues: (number | null)[] = [null, null, null, null];
  yValues: (number | null)[] = [null, null, null, null];

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }
}
