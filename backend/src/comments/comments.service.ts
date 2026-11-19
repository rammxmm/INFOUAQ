import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ReportCommentDto } from './dto/report-comment.dto';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Formatea fecha legible en español (ej. "03 oct. 2026, 09:15")
   */
  private formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Resuelve el ID del usuario autor basándose en autorId o autorNombre
   */
  private async resolverAutorId(
    autorId?: number,
    autorNombre?: string,
    autorRol?: string,
  ): Promise<number> {
    if (autorId) {
      const user = await this.prisma.usuario.findUnique({ where: { id: autorId } });
      if (user) return user.id;
    }

    if (autorNombre && autorNombre.trim()) {
      const primerNombre = autorNombre.trim().split(' ')[0];
      const user = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { nombre: { contains: primerNombre, mode: 'insensitive' } },
            { apellidos: { contains: primerNombre, mode: 'insensitive' } },
          ],
        },
      });
      if (user) return user.id;
    }

    // Por rol sugerido
    if (autorRol?.toLowerCase().includes('profesor') || autorRol?.toLowerCase().includes('docente')) {
      const profe = await this.prisma.usuario.findFirst({ where: { rol_id: 2 } });
      if (profe) return profe.id;
    }

    // Estudiante por defecto (Ana Martínez Delgado)
    const primerEstudiante = await this.prisma.usuario.findFirst({ where: { rol_id: 1 } });
    if (primerEstudiante) return primerEstudiante.id;

    // Cualquier usuario en la base de datos
    const userFallback = await this.prisma.usuario.findFirst();
    if (!userFallback) {
      throw new NotFoundException('No hay usuarios en la base de datos para atribuir el comentario.');
    }
    return userFallback.id;
  }

  /**
   * Mapea el registro relacional al formato DocumentComment esperado por el frontend
   */
  private mapToDocumentComment(c: any, currentUserId?: number): any {
    const nombreCompleto = c.autor
      ? `${c.autor.nombre} ${c.autor.apellidos}`.trim()
      : 'Usuario UAQ';

    const initials = c.autor
      ? `${c.autor.nombre?.[0] || ''}${c.autor.apellidos?.[0] || ''}`.toUpperCase()
      : 'UQ';

    const expediente = c.autor?.id
      ? c.autor.rol_id === 2
        ? `DOC-${1000 + c.autor.id}`
        : c.autor.rol_id === 3
        ? `ADM-${100 + c.autor.id}`
        : `${298400 + c.autor.id}`
      : '298412';

    const likesCount = c.likes ? c.likes.length : 0;
    const userLiked = currentUserId
      ? (c.likes || []).some((l: any) => l.usuario_id === currentUserId)
      : false;

    const replies = (c.respuestas || []).map((r: any) =>
      this.mapToDocumentComment(r, currentUserId),
    );

    return {
      id: String(c.id),
      authorName: nombreCompleto,
      authorInitials: initials,
      authorRole: c.autor?.rol?.nombre || 'Estudiante',
      authorExpediente: expediente,
      timestamp: this.formatearFecha(c.creado_en),
      content: c.contenido,
      likes: likesCount,
      userLiked,
      isEdited: c.editado,
      isDeleted: c.estado === 'ELIMINADO',
      isReported: (c.reportes && c.reportes.length > 0) || false,
      replies,
    };
  }

  /**
   * Obtiene todos los comentarios en árbol para un documento académico
   */
  async obtenerPorArchivo(archivoId: number, usuarioId?: number): Promise<any[]> {
    const comentarios = await this.prisma.comentario.findMany({
      where: {
        archivo_id: archivoId,
        padre_id: null, // Solo comentarios raíz
      },
      include: {
        autor: { include: { rol: true } },
        likes: true,
        reportes: true,
        respuestas: {
          include: {
            autor: { include: { rol: true } },
            likes: true,
            reportes: true,
          },
          orderBy: { creado_en: 'asc' },
        },
      },
      orderBy: { creado_en: 'asc' },
    });

    return comentarios.map((c) => this.mapToDocumentComment(c, usuarioId));
  }

  /**
   * Crea un nuevo comentario o respuesta dentro de un documento
   */
  async crearComentario(archivoId: number, dto: CreateCommentDto): Promise<any> {
    const autorId = await this.resolverAutorId(
      dto.autorId,
      dto.autorNombre,
      dto.autorRol,
    );

    const comentario = await this.prisma.comentario.create({
      data: {
        archivo_id: archivoId,
        autor_id: autorId,
        padre_id: dto.padreId ? Number(dto.padreId) : null,
        contenido: dto.contenido.trim(),
      },
      include: {
        autor: { include: { rol: true } },
        likes: true,
        reportes: true,
        respuestas: true,
      },
    });

    this.logger.log(`Comentario creado en archivo ${archivoId} por usuario ${autorId}`);
    return this.mapToDocumentComment(comentario, autorId);
  }

  /**
   * Edita el texto de un comentario
   */
  async editarComentario(comentarioId: number, contenido: string): Promise<any> {
    const comentario = await this.prisma.comentario.update({
      where: { id: comentarioId },
      data: {
        contenido: contenido.trim(),
        editado: true,
      },
      include: {
        autor: { include: { rol: true } },
        likes: true,
        reportes: true,
        respuestas: true,
      },
    });

    return this.mapToDocumentComment(comentario);
  }

  /**
   * Elimina lógicamente un comentario
   */
  async eliminarComentario(comentarioId: number): Promise<{ mensaje: string }> {
    await this.prisma.comentario.update({
      where: { id: comentarioId },
      data: {
        estado: 'ELIMINADO',
        contenido: '[Comentario eliminado por el autor]',
      },
    });

    return { mensaje: 'Comentario eliminado.' };
  }

  /**
   * Alterna Like (dar o quitar like)
   */
  async toggleLike(
    comentarioId: number,
    usuarioId?: number,
  ): Promise<{ likes: number; userLiked: boolean }> {
    const uid = usuarioId || (await this.resolverAutorId());

    const likeExistente = await this.prisma.comentarioLike.findUnique({
      where: {
        comentario_id_usuario_id: {
          comentario_id: comentarioId,
          usuario_id: uid,
        },
      },
    });

    if (likeExistente) {
      await this.prisma.comentarioLike.delete({
        where: {
          comentario_id_usuario_id: {
            comentario_id: comentarioId,
            usuario_id: uid,
          },
        },
      });
    } else {
      await this.prisma.comentarioLike.create({
        data: {
          comentario_id: comentarioId,
          usuario_id: uid,
        },
      });
    }

    const totalLikes = await this.prisma.comentarioLike.count({
      where: { comentario_id: comentarioId },
    });

    return {
      likes: totalLikes,
      userLiked: !likeExistente,
    };
  }

  /**
   * Reporta un comentario para moderación
   */
  async reportarComentario(
    comentarioId: number,
    dto: ReportCommentDto,
  ): Promise<{ success: boolean; message: string }> {
    const reportanteId = await this.resolverAutorId(dto.reportanteId, dto.reportanteNombre);

    await this.prisma.reporteComentario.create({
      data: {
        comentario_id: comentarioId,
        reportante_id: reportanteId,
        motivo: dto.motivo.trim(),
        estado: 'PENDIENTE',
      },
    });

    this.logger.warn(`Comentario ${comentarioId} reportado por usuario ${reportanteId}`);
    return {
      success: true,
      message: 'Comentario reportado para moderación académica.',
    };
  }
}
