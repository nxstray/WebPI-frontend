import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Data Transfer Object (DTO) untuk permintaan ANOVA
export interface AnovaDTO {
  namaKasus: string;
  namaVariableDependen: string;
  namaVariableIndependen: string;
  alpha: number;
  inputMethod: string;
  namaGrup: string[];
  nilaiGrup: number[][];
}

// DTO untuk merepresentasikan satu grup dan nilainya
export interface GrupDTO {
  grup: string;
  nilai: number;
}

// DTO untuk respons hasil perhitungan ANOVA
export interface AnovaResponseDTO {
  idAnova: number;
  namaKasus: string;
  namaVariableDependen: string;
  namaVariableIndependen: string;
  alpha: number;
  inputMethod: string;
  n: number;
  k: number;
  grups: GrupDTO[];
}

// Service untuk melakukan komunikasi HTTP terkait analisis ANOVA
@Injectable({ providedIn: 'root' })
export class AnovaService {
  // URL endpoint backend yang digunakan untuk ANOVA
  private apiUrl = `${environment.apiUrl}/anova`;

  // Menyimpan hasil ANOVA yang sedang aktif (bisa digunakan kembali di frontend)
  currentResult: AnovaResponseDTO | null = null;

  // Konstruktor menyuntikkan HttpClient untuk melakukan permintaan HTTP
  constructor(private http: HttpClient) {}

  /**
   * Mengirim data ANOVA secara manual dalam format JSON ke endpoint /manual.
   */
  simpanAnovaManual(data: AnovaDTO): Observable<any> {
    console.log('Service: Data yang akan dikirim:', data);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/manual`, data, { headers });
  }

  /**
   * Mengirim data ANOVA dari file Excel dalam bentuk FormData ke endpoint /excel.
   */
  simpanAnovaExcel(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/excel`, formData);
  }

  /**
   * Mengambil hasil analisis ANOVA berdasarkan ID tertentu.
   */
  getAnovaById(id: number): Observable<AnovaResponseDTO> {
    return this.http.get<AnovaResponseDTO>(`${this.apiUrl}/${id}`);
  }
}