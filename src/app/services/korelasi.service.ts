import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface KorelasiDTO {
  namaKasus: string;
  namaVarX: string;
  namaVarY: string;
  alpha: number;
  inputMethod: string;
  xValues: number[];
  yValues: number[];
}

export interface KorelasiResponseDTO {
  idKorelasi: number;
  namaKasus: string;
  namaVarX: string;
  namaVarY: string;
  alpha: number;
  n: number;
  xvalues: number[];
  yvalues: number[];
}

@Injectable({ providedIn: 'root' })
export class KorelasiService {
  private apiUrl = 'http://localhost:6060/api/korelasi';

  currentResult: KorelasiResponseDTO | null = null;

  constructor(private http: HttpClient) {}

  simpanKorelasi(data: KorelasiDTO): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  getKorelasiById(id: number): Observable<KorelasiResponseDTO> {
    return this.http.get<KorelasiResponseDTO>(`${this.apiUrl}/${id}`);
  }
}