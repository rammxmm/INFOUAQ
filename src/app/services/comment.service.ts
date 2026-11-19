import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DocumentComment } from '../pages/dashboard/dashboard';

export interface CommentApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene la lista de comentarios en árbol para un archivo
   */
  getComments(fileId: string, userId?: string): Observable<DocumentComment[]> {
    let params = new HttpParams();
    if (userId) {
      params = params.set('usuarioId', userId);
    }

    return this.http
      .get<CommentApiResponse<DocumentComment[]>>(
        `${this.baseUrl}/files/${fileId}/comments`,
        { params },
      )
      .pipe(map((res) => res.data || []));
  }

  /**
   * Publica un comentario o respuesta
   */
  addComment(
    fileId: string,
    data: {
      content: string;
      parentId?: number;
      authorId?: number;
      authorName?: string;
      authorRole?: string;
      authorExpediente?: string;
    },
  ): Observable<DocumentComment> {
    return this.http
      .post<CommentApiResponse<DocumentComment>>(
        `${this.baseUrl}/files/${fileId}/comments`,
        {
          contenido: data.content,
          padreId: data.parentId,
          autorId: data.authorId,
          autorNombre: data.authorName,
          autorRol: data.authorRole,
          autorExpediente: data.authorExpediente,
        },
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Edita el texto de un comentario
   */
  editComment(commentId: string, content: string): Observable<DocumentComment> {
    return this.http
      .patch<CommentApiResponse<DocumentComment>>(
        `${this.baseUrl}/comments/${commentId}`,
        { contenido: content },
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Elimina un comentario
   */
  deleteComment(commentId: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/comments/${commentId}`,
    );
  }

  /**
   * Alterna Like
   */
  toggleLike(
    commentId: string,
    userId?: number,
  ): Observable<{ likes: number; userLiked: boolean }> {
    return this.http
      .post<CommentApiResponse<{ likes: number; userLiked: boolean }>>(
        `${this.baseUrl}/comments/${commentId}/like`,
        { usuarioId: userId },
      )
      .pipe(map((res) => res.data));
  }

  /**
   * Reporta un comentario
   */
  reportComment(
    commentId: string,
    reason: string,
    reporterId?: number,
    reporterName?: string,
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.baseUrl}/comments/${commentId}/report`,
      {
        motivo: reason,
        reportanteId: reporterId,
        reportanteNombre: reporterName,
      },
    );
  }
}
