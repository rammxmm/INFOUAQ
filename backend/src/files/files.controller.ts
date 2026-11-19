import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
  Req,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { QueryFilesDto } from './dto/query-files.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Helper privado para extraer usuario institucional desde token JWT o query
   */
  private extraerUsuario(req: Request, fallbackUserId?: number) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = this.jwtService.verify(token);
        return {
          id: payload.sub,
          userId: payload.sub,
          email: payload.email,
          name: payload.name,
          role: payload.role,
          carrera_id: payload.carrera_id,
          semestre: payload.semestre,
        };
      } catch {}
    }

    if (fallbackUserId) {
      return {
        id: fallbackUserId,
        userId: fallbackUserId,
        email: '',
        name: '',
        role: 'ESTUDIANTE',
      };
    }

    return null;
  }

  /**
   * POST /api/files/upload
   * Sube un archivo físico y registra sus metadatos académicos
   * Restringido a PROFESOR y ADMINISTRADOR
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async subirArchivo(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Req() req: Request,
  ) {
    const user = this.extraerUsuario(req);
    const ip = req.ip || req.socket.remoteAddress;
    const documento = await this.filesService.subirArchivo(file, dto, user, ip);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: documento,
      message: 'Archivo subido y registrado exitosamente.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/files/bookmarks/me
   * Lista los archivos guardados o favoritos por el estudiante autenticado
   */
  @Get('bookmarks/me')
  async listarGuardados(
    @Req() req: Request,
    @Query('userId') userIdQuery?: string,
  ) {
    const fallbackId = userIdQuery ? parseInt(userIdQuery, 10) : undefined;
    const user = this.extraerUsuario(req, fallbackId);
    const userId = user?.id || fallbackId;

    if (!userId) {
      return {
        success: true,
        total: 0,
        data: [],
        message: 'No se identificó la sesión del estudiante.',
        timestamp: new Date().toISOString(),
      };
    }

    const guardados = await this.filesService.obtenerGuardados(userId);
    return {
      success: true,
      total: guardados.length,
      data: guardados,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/files/:id/bookmark
   * Alterna el guardado en favoritos de un archivo por parte de un estudiante
   */
  @Post(':id/bookmark')
  async toggleBookmark(
    @Param('id') id: string,
    @Req() req: Request,
    @Body('userId') bodyUserId?: number,
  ) {
    const user = this.extraerUsuario(req, bodyUserId);
    const userId = user?.id || bodyUserId;

    if (!userId) {
      return {
        success: false,
        message: 'Se requiere inicio de sesión para guardar materiales.',
      };
    }

    const res = await this.filesService.toggleBookmark(id, userId);
    return {
      success: true,
      data: res,
      message: res.message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/files
   * Lista documentos con filtros opcionales (carrera, materia, semestre, categoría, búsqueda)
   */
  @Get()
  async listarArchivos(
    @Query() query: QueryFilesDto,
    @Req() req: Request,
    @Query('userId') userIdQuery?: string,
  ) {
    const fallbackId = userIdQuery ? parseInt(userIdQuery, 10) : undefined;
    const user = this.extraerUsuario(req, fallbackId);
    const documentos = await this.filesService.listarArchivos(query, user?.id);
    return {
      success: true,
      total: documentos.length,
      data: documentos,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/files/:id
   * Obtiene la información detallada de un documento por su ID
   */
  @Get(':id')
  async obtenerPorId(
    @Param('id') id: string,
    @Req() req: Request,
    @Query('userId') userIdQuery?: string,
  ) {
    const fallbackId = userIdQuery ? parseInt(userIdQuery, 10) : undefined;
    const user = this.extraerUsuario(req, fallbackId);
    const documento = await this.filesService.obtenerPorId(id, user?.id);
    return {
      success: true,
      data: documento,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/files/:id/preview
   * Visualización directa en el navegador (streaming inline para PDF)
   */
  @Get(':id/preview')
  async previsualizarArchivo(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const user = this.extraerUsuario(req);
    const { metadata, rutaAbsoluta } = await this.filesService.obtenerParaDescarga(
      id,
      false,
      user,
      req.ip,
    );

    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(metadata.nombreOriginal)}"`,
    );

    return res.sendFile(rutaAbsoluta);
  }

  /**
   * GET /api/files/:id/download
   * Descarga el archivo e incrementa descargas con registro de auditoría
   */
  @Get(':id/download')
  async descargarArchivo(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const user = this.extraerUsuario(req);
    const { metadata, rutaAbsoluta } = await this.filesService.obtenerParaDescarga(
      id,
      true,
      user,
      req.ip,
    );

    return res.download(rutaAbsoluta, metadata.nombreOriginal);
  }

  /**
   * PATCH /api/files/:id
   * Actualiza los metadatos de un documento y opcionalmente reemplaza el archivo físico
   * Restringido a docente propietario o administrador
   */
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateFileDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const user = this.extraerUsuario(req);
    const documento = await this.filesService.actualizar(
      id,
      dto,
      user,
      file,
      req.ip,
    );
    return {
      success: true,
      message: 'Documento actualizado con éxito.',
      data: documento,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/files/:id
   * Elimina el archivo del almacenamiento físico y de PostgreSQL
   * Restringido a docente propietario o administrador
   */
  @Delete(':id')
  async eliminar(@Param('id') id: string, @Req() req: Request) {
    const user = this.extraerUsuario(req);
    const resultado = await this.filesService.eliminar(id, user, req.ip);
    return {
      success: true,
      message: resultado.mensaje,
      timestamp: new Date().toISOString(),
    };
  }
}
