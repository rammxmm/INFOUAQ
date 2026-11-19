import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminMateriaDto {
  clave: string;
  nombre: string;
  descripcion?: string;
  creditos?: number;
  area_id?: number;
  carreras?: { carrera_id: number; semestre: number }[];
}

export interface AdminUsuario {
  id: number;
  nombre: string;
  apellidos: string;
  nombreCompleto: string;
  correo: string;
  rolId: number;
  rolNombre: string;
  estado: 'ACTIVA' | 'SUSPENDIDA' | 'INACTIVA';
  carreraId?: number;
  carreraClave?: string;
  carreraNombre?: string;
  semestre?: number;
  expediente: string;
  ultimoAcceso?: string;
  creadoEn: string;
}

export interface AdminReporte {
  id: number;
  comentarioId: number;
  comentarioContenido: string;
  comentarioAutor: string;
  comentarioAutorRol: string;
  archivoId: number;
  archivoTitulo: string;
  reportante: string;
  reportanteCorreo: string;
  motivo: string;
  estado: 'PENDIENTE' | 'DESCARTADO' | 'CONFIRMADO';
  creadoEn: string;
}

export interface AdminAuditoriaLog {
  id: number;
  usuarioId?: number;
  usuarioNombre: string;
  usuarioRol: string;
  accion: string;
  entidad: string;
  entidadId?: number;
  detalle?: any;
  ip?: string;
  creadoEn: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = 'http://localhost:3000/api/admin';

  constructor(private readonly http: HttpClient) {}

  // Materias
  crearMateria(dto: AdminMateriaDto): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/materias`, dto);
  }

  actualizarMateria(id: number, dto: Partial<AdminMateriaDto>): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/materias/${id}`, dto);
  }

  eliminarMateria(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/materias/${id}`);
  }

  // Profesores / Materias
  asignarProfesor(
    materiaId: number,
    profesorId: number,
    periodoId?: number,
  ): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/materias/${materiaId}/profesores`,
      { profesor_id: profesorId, periodo_id: periodoId },
    );
  }

  eliminarAsignacionProfesor(
    materiaId: number,
    profesorId: number,
    periodoId?: number,
  ): Observable<any> {
    let params = new HttpParams();
    if (periodoId) params = params.set('periodoId', periodoId.toString());
    return this.http.delete(
      `${this.apiUrl}/materias/${materiaId}/profesores/${profesorId}`,
      { params },
    );
  }

  // Usuarios
  listarUsuarios(filtros?: {
    rolId?: number;
    estado?: string;
    carreraId?: number;
    busqueda?: string;
  }): Observable<ApiResponse<AdminUsuario[]>> {
    let params = new HttpParams();
    if (filtros) {
      if (filtros.rolId) params = params.set('rolId', filtros.rolId.toString());
      if (filtros.estado) params = params.set('estado', filtros.estado);
      if (filtros.carreraId) params = params.set('carreraId', filtros.carreraId.toString());
      if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda.trim());
    }
    return this.http.get<ApiResponse<AdminUsuario[]>>(`${this.apiUrl}/usuarios`, {
      params,
    });
  }

  actualizarRolUsuario(
    usuarioId: number,
    rolId: number,
  ): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(
      `${this.apiUrl}/usuarios/${usuarioId}/rol`,
      { rol_id: rolId },
    );
  }

  actualizarEstadoUsuario(
    usuarioId: number,
    estado: 'ACTIVA' | 'SUSPENDIDA' | 'INACTIVA',
  ): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(
      `${this.apiUrl}/usuarios/${usuarioId}/estado`,
      { estado },
    );
  }

  // Moderación de Reportes
  listarReportes(estado?: string): Observable<ApiResponse<AdminReporte[]>> {
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<ApiResponse<AdminReporte[]>>(`${this.apiUrl}/reportes`, {
      params,
    });
  }

  descartarReporte(reporteId: number, moderadorId?: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/reportes/${reporteId}/descartar`, {
      moderadorId,
    });
  }

  eliminarComentarioReportado(
    reporteId: number,
    moderadorId?: number,
  ): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/reportes/${reporteId}/eliminar-comentario`,
      { body: { moderadorId } },
    );
  }

  // Auditoría
  listarAuditoria(limit = 100): Observable<ApiResponse<AdminAuditoriaLog[]>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ApiResponse<AdminAuditoriaLog[]>>(
      `${this.apiUrl}/auditoria`,
      { params },
    );
  }
}
