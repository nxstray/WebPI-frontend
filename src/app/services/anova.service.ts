import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AnovaDTO {
  namaKasus: string;
  namaVariabelDependen: string;
  alpha: number;
  inputMethod: string;
  namaGrup: string[];
  nilaiGrup: number[][];
}

export interface GrupDTO {
  grup: string;
  nilai: number;
}

export interface AnovaResponseDTO {
  idAnova: number;
  namaKasus: string;
  namaVarY: string;
  alpha: number;
  inputMethod: string;
  grups: GrupDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class AnovaService {
  private apiUrl = 'http://localhost:6060/api/anova';

  currentResult: AnovaResponseDTO | null = null;

  constructor(private http: HttpClient) {}

  simpanAnova(data: AnovaDTO): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getAnovaById(id: number): Observable<AnovaResponseDTO> {
    return this.http.get<AnovaResponseDTO>(`${this.apiUrl}/${id}`);
  }
}