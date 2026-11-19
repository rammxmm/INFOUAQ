import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CarpetaItem {
  id: number;
  nombre: string;
  materia_id: number;
  propietario_id: number;
  padre_id: number | null;
  creado_en: string;
  subcarpetas?: CarpetaItem[];
  archivos?: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class FolderService {
  private readonly apiUrl = 'http://localhost:3000/api/folders';

  constructor(private readonly http: HttpClient) {}

  getCarpetasMateria(materiaId: number): Observable<ApiResponse<CarpetaItem[]>> {
    return this.http.get<ApiResponse<CarpetaItem[]>>(
      `${this.apiUrl}/materia/${materiaId}`,
    );
  }

  crearCarpeta(dto: {
    nombre: string;
    materia_id: number;
    padre_id?: number;
  }): Observable<ApiResponse<CarpetaItem>> {
    return this.http.post<ApiResponse<CarpetaItem>>(this.apiUrl, dto);
  }

  actualizarCarpeta(
    id: number,
    dto: { nombre: string },
  ): Observable<ApiResponse<CarpetaItem>> {
    return this.http.patch<ApiResponse<CarpetaItem>>(`${this.apiUrl}/${id}`, dto);
  }

  eliminarCarpeta(id: number): Observable<ApiResponse<{ mensaje: string }>> {
    return this.http.delete<ApiResponse<{ mensaje: string }>>(
      `${this.apiUrl}/${id}`,
    );
  }
}
