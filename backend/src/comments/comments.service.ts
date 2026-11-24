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
    if (autorId && typeof autorId === 'number' && autorId < 2000000000) {
      const user = await this.prisma.usuario.findUnique({ where: { id: autorId } });
      if (user) return user.id;
    }

    if (autorNombre && autorNombre.trim()) {
      const trimmed = autorNombre.trim();
      const parts = trimmed.split(' ');
      const primerNombre = parts[0];

      const user = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { nombre: { contains: primerNombre, mode: 'insensitive' } },
            { apellidos: { contains: primerNombre, mode: 'insensitive' } },
            { nombre: { contains: trimmed, mode: 'insensitive' } },
          ],
        },
      });
      if (user) return user.id;

      // Si el estudiante o docente aún no existe en PostgreSQL, lo registramos dinámicamente
      try {
        const nombre = parts[0];
        const apellidos = parts.slice(1).join(' ') || 'UAQ';
        const rolId = (autorRol?.toLowerCase().includes('profesor') || autorRol?.toLowerCase().includes('docente')) ? 2 : 1;
        const emailGenerado = `${nombre.toLowerCase()}.${Date.now()}@alumnos.uaq.mx`;

        const nuevo = await this.prisma.usuario.create({
          data: {
            nombre,
            apellidos,
            correo: emailGenerado,
            password_hash: '$2a$10$placeholderAuthINFOUAQ',
            rol_id: rolId,
            estado: 'ACTIVA',
          },
        });
        return nuevo.id;
      } catch (err) {
        this.logger.warn('No se pudo crear usuario automático para comentario:', err);
      }
    }

    // Por rol sugerido
    if (autorRol?.toLowerCase().includes('profesor') || autorRol?.toLowerCase().includes('docente')) {
      const profe = await this.prisma.usuario.findFirst({ where: { rol_id: 2 } });
      if (profe) return profe.id;
    }

    // Estudiante por defecto (Ana Martínez Delgado)
    const primerEstudiante = await this.prisma.usuario.findFirst({ where: { rol_id: 1 } });
    if (primerEstudiante) return primerEstudiante.id;

    const userFallback = await this.prisma.usuario.findFirst();
    if (!userFallback) {
      throw new NotFoundException('No hay usuarios en la BD para atribuir el comentario.');
    }
    return userFallback.id;
  }

  /**
   * Mapea el registro relacional al formato DocumentComment esperado por el frontend
   */
  private mapToDocumentComment(
    c: any,
    currentUserId?: number,
    docentesTitularesIds: number[] = [],
  ): any {
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

    const isDocenteTitular =
      c.autor?.rol_id === 2 && docentesTitularesIds.includes(c.autor_id);

    const likesCount = c.likes ? c.likes.length : 0;
    const userLiked = currentUserId
      ? (c.likes || []).some((l: any) => l.usuario_id === currentUserId)
      : false;

    const replies = (c.respuestas || []).map((r: any) =>
      this.mapToDocumentComment(r, currentUserId, docentesTitularesIds),
    );

    return {
      id: String(c.id),
      authorName: nombreCompleto,
      authorInitials: initials,
      authorRole: isDocenteTitular
        ? 'Docente Titular'
        : c.autor?.rol?.nombre || 'Estudiante',
      isDocenteTitular,
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
    // 1. Obtener materia del archivo para determinar docentes titulares
    const archivo = await this.prisma.archivo.findUnique({
      where: { id: archivoId },
      select: { materia_id: true },
    });

    let docentesTitularesIds: number[] = [];
    if (archivo) {
      const asignaciones = await this.prisma.materiasProfesor.findMany({
        where: { materia_id: archivo.materia_id },
        select: { profesor_id: true },
      });
      docentesTitularesIds = asignaciones.map((a) => a.profesor_id);
    }

    const comentarios = await this.prisma.comentario.findMany({
      where: {
        archivo_id: archivoId,
        padre_id: null,
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

    return comentarios.map((c) =>
      this.mapToDocumentComment(c, usuarioId, docentesTitularesIds),
    );
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

  /**
   * Obtiene notificaciones de respuestas para un usuario (docentes o compañeros que respondieron)
   */
  async obtenerNotificaciones(usuarioId: number): Promise<any[]> {
    // Respuestas a comentarios donde padre.autor_id == usuarioId y autor_id != usuarioId
    const respuestas = await this.prisma.comentario.findMany({
      where: {
        padre: {
          autor_id: usuarioId,
        },
        autor_id: {
          not: usuarioId,
        },
        estado: 'VISIBLE',
      },
      include: {
        autor: { include: { rol: true } },
        archivo: {
          select: { id: true, titulo: true },
        },
        padre: {
          select: { contenido: true },
        },
      },
      orderBy: { creado_en: 'desc' },
      take: 20,
    });

    return respuestas.map((r) => ({
      id: r.id,
      archivoId: r.archivo_id,
      archivoTitulo: r.archivo.titulo,
      remitenteNombre: `${r.autor.nombre} ${r.autor.apellidos}`.trim(),
      remitenteRol: r.autor.rol.nombre,
      contenidoRespuesta: r.contenido,
      tuComentario: r.padre?.contenido || '',
      fecha: this.formatearFecha(r.creado_en),
    }));
  }
}
