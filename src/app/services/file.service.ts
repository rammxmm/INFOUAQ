import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AcademicDocument } from '../pages/dashboard/dashboard';

export interface BackendAcademicFile {
  id: string;
  titulo: string;
  descripcion: string;
  nombreOriginal: string;
  nombreFisico: string;
  rutaRelativa: string;
  extension: string;
  mimeType: string;
  tamanoBytes: number;
  tamanoFormateado: string;
  carreraId: string;
  materia: string;
  materiaId?: number;
  semestre: number;
  categoria: string;
  parcial?: number | null;
  carpetaId?: number | null;
  autorNombre: string;
  autorRol: string;
  docenteId?: number;
  descargas: number;
  fechaSubida: string;
  fechaActualizacion: string;
  isBookmarked?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
  timestamp: string;
}

export function mapBackendToFrontendDoc(f: BackendAcademicFile): AcademicDocument {
  const ext = (f.extension || '.pdf').replace('.', '').toUpperCase();
  const type = (['PDF', 'PPTX', 'DOCX', 'ZIP'].includes(ext) ? ext : 'PDF') as
    | 'PDF'
    | 'PPTX'
    | 'DOCX'
    | 'ZIP';

  const dateFormatted = f.fechaSubida
    ? new Date(f.fechaSubida).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Reciente';

  return {
    id: String(f.id),
    name: f.nombreOriginal || f.titulo,
    subject: f.materia || 'General',
    subjectCode: f.carreraId ? `${f.carreraId.slice(0, 3)}-${f.semestre}01` : 'IS-301',
    type,
    date: dateFormatted,
    color: type.toLowerCase(),
    size: f.tamanoFormateado || `${(f.tamanoBytes / (1024 * 1024)).toFixed(1)} MB`,
    unit: f.parcial ? `Parcial ${f.parcial}` : `Semestre ${f.semestre || 1}`,
    category: (f.categoria as any) || 'Guías',
    downloads: f.descargas || 0,
    author: f.autorNombre || 'Comunidad Académica UAQ',
    description: f.descripcion || f.titulo,
    comments: [],
    isBookmarked: Boolean(f.isBookmarked),
  };
}

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly apiUrl = 'http://localhost:3000/api/files';

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene todos los documentos del repositorio con filtros opcionales
   */
  getFiles(filters?: {
    carreraId?: string;
    materia?: string;
    semestre?: number;
    categoria?: string;
    busqueda?: string;
    userId?: number;
  }): Observable<AcademicDocument[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.carreraId && filters.carreraId !== 'Todas') {
        params = params.set('carreraId', filters.carreraId);
      }
      if (filters.materia && filters.materia !== 'Todas') {
        params = params.set('materia', filters.materia);
      }
      if (filters.semestre) {
        params = params.set('semestre', filters.semestre.toString());
      }
      if (filters.categoria && filters.categoria !== 'Todas') {
        params = params.set('categoria', filters.categoria);
      }
      if (filters.busqueda && filters.busqueda.trim()) {
        params = params.set('busqueda', filters.busqueda.trim());
      }
      if (filters.userId) {
        params = params.set('userId', filters.userId.toString());
      }
    }

    return this.http
      .get<ApiResponse<BackendAcademicFile[]>>(this.apiUrl, { params })
      .pipe(map((res) => (res.data || []).map(mapBackendToFrontendDoc)));
  }

  /**
   * Obtiene el detalle de un documento por su ID
   */
  getFileById(id: string, userId?: number): Observable<AcademicDocument> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId.toString());
    return this.http
      .get<ApiResponse<BackendAcademicFile>>(`${this.apiUrl}/${id}`, { params })
      .pipe(map((res) => mapBackendToFrontendDoc(res.data)));
  }

  /**
   * Sube un archivo físico con sus metadatos a la API de NestJS
   */
  uploadFile(
    file: File,
    meta: {
      titulo: string;
      descripcion?: string;
      carreraId: string;
      materia: string;
      materia_id?: number;
      semestre: number;
      categoria: string;
      parcial?: number;
      carpeta_id?: number;
      autorNombre?: string;
      autorRol?: string;
    },
  ): Observable<AcademicDocument> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('titulo', meta.titulo);
    formData.append('carreraId', meta.carreraId);
    formData.append('materia', meta.materia);
    formData.append('semestre', String(meta.semestre));
    formData.append('categoria', meta.categoria);

    if (meta.materia_id) formData.append('materia_id', String(meta.materia_id));
    if (meta.parcial) formData.append('parcial', String(meta.parcial));
    if (meta.carpeta_id) formData.append('carpeta_id', String(meta.carpeta_id));
    if (meta.descripcion) formData.append('descripcion', meta.descripcion);
    if (meta.autorNombre) formData.append('autorNombre', meta.autorNombre);
    if (meta.autorRol) formData.append('autorRol', meta.autorRol);

    return this.http
      .post<ApiResponse<BackendAcademicFile>>(`${this.apiUrl}/upload`, formData)
      .pipe(map((res) => mapBackendToFrontendDoc(res.data)));
  }

  /**
   * Actualiza metadatos y opcionalmente sustituye el archivo
   */
  updateFile(
    id: string,
    meta: {
      titulo?: string;
      descripcion?: string;
      categoria?: string;
      parcial?: number;
      carpeta_id?: number;
    },
    file?: File,
  ): Observable<AcademicDocument> {
    const formData = new FormData();
    if (meta.titulo) formData.append('titulo', meta.titulo);
    if (meta.descripcion) formData.append('descripcion', meta.descripcion);
    if (meta.categoria) formData.append('categoria', meta.categoria);
    if (meta.parcial) formData.append('parcial', String(meta.parcial));
    if (meta.carpeta_id) formData.append('carpeta_id', String(meta.carpeta_id));
    if (file) formData.append('file', file);

    return this.http
      .patch<ApiResponse<BackendAcademicFile>>(`${this.apiUrl}/${id}`, formData)
      .pipe(map((res) => mapBackendToFrontendDoc(res.data)));
  }

  /**
   * Alterna guardado en favoritos de un archivo
   */
  toggleBookmark(id: string, userId?: number): Observable<{ saved: boolean; message: string }> {
    return this.http.post<{ success: boolean; data: { saved: boolean }; message: string }>(
      `${this.apiUrl}/${id}/bookmark`,
      { userId },
    ).pipe(map((res) => ({ saved: res.data?.saved ?? false, message: res.message })));
  }

  /**
   * Obtiene todos los archivos guardados por el estudiante
   */
  getBookmarks(userId?: number): Observable<AcademicDocument[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId.toString());
    return this.http
      .get<ApiResponse<BackendAcademicFile[]>>(`${this.apiUrl}/bookmarks/me`, { params })
      .pipe(map((res) => (res.data || []).map(mapBackendToFrontendDoc)));
  }

  /**
   * Descarga física del archivo desde el backend
   */
  downloadFileBlob(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob',
    });
  }

  /**
   * Descarga directa en el navegador
   */
  triggerDownload(id: string, fileName: string): void {
    this.downloadFileBlob(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        window.open(`${this.apiUrl}/${id}/download`, '_blank');
      },
    });
  }

  /**
   * URL de previsualización en línea
   */
  getPreviewUrl(id: string): string {
    return `${this.apiUrl}/${id}/preview`;
  }

  /**
   * Elimina un archivo física y lógicamente
   */
  deleteFile(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/${id}`,
    );
  }
}
