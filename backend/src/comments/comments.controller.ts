import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { LikeCommentDto } from './dto/like-comment.dto';
import { ReportCommentDto } from './dto/report-comment.dto';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Obtiene notificaciones de respuestas a comentarios del usuario autenticado
   * GET /api/comments/notifications/me
   */
  @Get('comments/notifications/me')
  async obtenerNotificaciones(
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    const notificaciones = await this.commentsService.obtenerNotificaciones(userId);
    return {
      success: true,
      total: notificaciones.length,
      data: notificaciones,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Obtiene todos los comentarios e hilos de respuestas de un archivo académico
   * GET /api/files/:fileId/comments
   */
  @Get('files/:fileId/comments')
  async obtenerPorArchivo(
    @Param('fileId', ParseIntPipe) fileId: number,
    @Query('usuarioId') usuarioId?: string,
  ) {
    const uid = usuarioId ? parseInt(usuarioId, 10) : undefined;
    const comentarios = await this.commentsService.obtenerPorArchivo(fileId, uid);
    return {
      success: true,
      total: comentarios.length,
      data: comentarios,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Publica un nuevo comentario o respuesta en un archivo académico
   * POST /api/files/:fileId/comments
   */
  @Post('files/:fileId/comments')
  async crearComentario(
    @Param('fileId', ParseIntPipe) fileId: number,
    @Body() dto: CreateCommentDto,
  ) {
    const nuevo = await this.commentsService.crearComentario(fileId, dto);
    return {
      success: true,
      data: nuevo,
      message: 'Comentario publicado exitosamente.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Edita el contenido de un comentario existente
   * PATCH /api/comments/:id
   */
  @Patch('comments/:id')
  async editarComentario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
  ) {
    const editado = await this.commentsService.editarComentario(id, dto.contenido);
    return {
      success: true,
      data: editado,
      message: 'Comentario editado con éxito.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Elimina un comentario (borrado lógico por el autor)
   * DELETE /api/comments/:id
   */
  @Delete('comments/:id')
  async eliminarComentario(@Param('id', ParseIntPipe) id: number) {
    const resultado = await this.commentsService.eliminarComentario(id);
    return {
      success: true,
      message: resultado.mensaje,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Alterna Like (dar o quitar like) en un comentario
   * POST /api/comments/:id/like
   */
  @Post('comments/:id/like')
  async toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LikeCommentDto,
  ) {
    const res = await this.commentsService.toggleLike(id, dto.usuarioId);
    return {
      success: true,
      data: res,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Reporta un comentario inapropiado para moderación
   * POST /api/comments/:id/report
   */
  @Post('comments/:id/report')
  async reportarComentario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReportCommentDto,
  ) {
    const res = await this.commentsService.reportarComentario(id, dto);
    return {
      success: true,
      message: res.message,
      timestamp: new Date().toISOString(),
    };
  }
}
