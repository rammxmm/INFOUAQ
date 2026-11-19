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
  semestre: number;
  categoria: string;
  autorNombre: string;
  autorRol: string;
  descargas: number;
  fechaSubida: string;
  fechaActualizacion: string;
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
    unit: `Semestre ${f.semestre || 1}`,
    category: (f.categoria as any) || 'Guías',
    downloads: f.descargas || 0,
    author: f.autorNombre || 'Comunidad Académica UAQ',
    description: f.descripcion || f.titulo,
    comments: [],
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
    }

    return this.http
      .get<ApiResponse<BackendAcademicFile[]>>(this.apiUrl, { params })
      .pipe(map((res) => (res.data || []).map(mapBackendToFrontendDoc)));
  }

  /**
   * Obtiene el detalle de un documento por su ID
   */
  getFileById(id: string): Observable<AcademicDocument> {
    return this.http
      .get<ApiResponse<BackendAcademicFile>>(`${this.apiUrl}/${id}`)
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
      semestre: number;
      categoria: string;
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

    if (meta.descripcion) {
      formData.append('descripcion', meta.descripcion);
    }
    if (meta.autorNombre) {
      formData.append('autorNombre', meta.autorNombre);
    }
    if (meta.autorRol) {
      formData.append('autorRol', meta.autorRol);
    }

    return this.http
      .post<ApiResponse<BackendAcademicFile>>(`${this.apiUrl}/upload`, formData)
      .pipe(map((res) => mapBackendToFrontendDoc(res.data)));
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
        // Enlace de respaldo directo si falla blob
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
