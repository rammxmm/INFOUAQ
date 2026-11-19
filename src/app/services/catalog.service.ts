import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Carrera {
  id: number;
  clave: string;
  nombre: string;
  creditos_totales: number;
  activa: boolean;
}

export interface AreaConocimiento {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

export interface MateriaCatalogo {
  id: number;
  clave: string;
  nombre: string;
  descripcion?: string;
  area_id?: number;
  activa: boolean;
  area?: AreaConocimiento;
  materias_carreras?: {
    semestre: number;
    carrera: Carrera;
  }[];
  materias_profesores?: {
    profesor: {
      id: number;
      nombre: string;
      apellidos: string;
      correo: string;
    };
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly apiUrl = 'http://localhost:3000/api/catalog';

  constructor(private readonly http: HttpClient) {}

  getCarreras(): Observable<ApiResponse<Carrera[]>> {
    return this.http.get<ApiResponse<Carrera[]>>(`${this.apiUrl}/carreras`);
  }

  getAreas(): Observable<ApiResponse<AreaConocimiento[]>> {
    return this.http.get<ApiResponse<AreaConocimiento[]>>(`${this.apiUrl}/areas`);
  }

  getMaterias(filtros?: {
    carreraClave?: string;
    semestre?: number;
    areaId?: number;
    busqueda?: string;
  }): Observable<ApiResponse<MateriaCatalogo[]>> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.carreraClave && filtros.carreraClave !== 'Todas') {
        params = params.set('carreraClave', filtros.carreraClave);
      }
      if (filtros.semestre) {
        params = params.set('semestre', filtros.semestre.toString());
      }
      if (filtros.areaId) {
        params = params.set('areaId', filtros.areaId.toString());
      }
      if (filtros.busqueda && filtros.busqueda.trim()) {
        params = params.set('busqueda', filtros.busqueda.trim());
      }
    }
    return this.http.get<ApiResponse<MateriaCatalogo[]>>(`${this.apiUrl}/materias`, {
      params,
    });
  }

  getMateriasPorCarrera(carreraClave: string): Observable<ApiResponse<MateriaCatalogo[]>> {
    return this.http.get<ApiResponse<MateriaCatalogo[]>>(
      `${this.apiUrl}/materias/carrera/${carreraClave}`,
    );
  }

  getMateriaPorId(id: number): Observable<ApiResponse<MateriaCatalogo>> {
    return this.http.get<ApiResponse<MateriaCatalogo>>(`${this.apiUrl}/materias/${id}`);
  }
}
