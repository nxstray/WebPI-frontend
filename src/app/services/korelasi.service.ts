import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Struktur data untuk mengirim permintaan analisis korelasi.
 */
export interface KorelasiDTO {
  namaKasus: string;
  namaVarX: string;
  namaVarY: string;
  alpha: number;
  inputMethod: string;
  xValues: number[];
  yValues: number[];
}

/**
 * Struktur data respons dari backend setelah analisis korelasi.
 */
export interface KorelasiResponseDTO {
  idKorelasi: number;
  namaKasus: string;
  namaVarX: string;
  namaVarY: string;
  alpha: number;
  n: number;
  xValues: number[];
  yValues: number[];
}

/**
 * Service untuk melakukan komunikasi HTTP terkait analisis korelasi.
 */
@Injectable({ providedIn: 'root' })
export class KorelasiService {
  private apiUrl = `${environment.apiUrl}/korelasi`;  // Base URL untuk endpoint korelasi
  currentResult: KorelasiResponseDTO | null = null;    // Menyimpan hasil korelasi terakhir (jika ada)

  constructor(private http: HttpClient) {}

  /**
   * Mengirim data korelasi secara manual dalam format JSON ke endpoint /manual.
   */
  simpanKorelasiManual(data: KorelasiDTO): Observable<any> {
    console.log('Service: Data yang akan dikirim:', data);
    
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    return this.http.post(`${this.apiUrl}/manual`, data, { headers });
  }

  /**
   * Mengirim data korelasi dari file Excel dalam bentuk FormData ke endpoint /excel.
   */
  simpanKorelasiExcel(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/excel`, formData);
  }

  /**
   * Mengambil hasil analisis korelasi berdasarkan ID tertentu.
   */
  getKorelasiById(id: number): Observable<KorelasiResponseDTO> {
    return this.http.get<KorelasiResponseDTO>(`${this.apiUrl}/${id}`);
  }
}