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
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { QueryFilesDto } from './dto/query-files.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * POST /api/files/upload
   * Sube un archivo físico y registra sus metadatos académicos
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async subirArchivo(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
  ) {
    const documento = await this.filesService.subirArchivo(file, dto);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      data: documento,
      message: 'Archivo subido y registrado exitosamente.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/files
   * Lista documentos con filtros opcionales (carrera, materia, semestre, categoría, búsqueda)
   */
  @Get()
  async listarArchivos(@Query() query: QueryFilesDto) {
    const documentos = await this.filesService.listarArchivos(query);
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
  async obtenerPorId(@Param('id') id: string) {
    const documento = await this.filesService.obtenerPorId(id);
    return {
      success: true,
      data: documento,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/files/:id/preview
   * Visualización directa en el navegador (streaming inline para PDF, imágenes, etc.)
   */
  @Get(':id/preview')
  async previsualizarArchivo(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { metadata, rutaAbsoluta } = await this.filesService.obtenerParaDescarga(
      id,
      false,
    );

    // Indicamos al navegador que muestre el archivo inline (sin forzar descarga)
    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(metadata.nombreOriginal)}"`,
    );

    return res.sendFile(rutaAbsoluta);
  }

  /**
   * GET /api/files/:id/download
   * Descarga el archivo con su nombre original e incrementa el contador de descargas
   */
  @Get(':id/download')
  async descargarArchivo(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { metadata, rutaAbsoluta } = await this.filesService.obtenerParaDescarga(
      id,
      true,
    );

    return res.download(rutaAbsoluta, metadata.nombreOriginal);
  }

  /**
   * PATCH /api/files/:id
   * Actualiza los metadatos de un documento (título, descripción, categoría)
   */
  @Patch(':id')
  async actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateFileDto,
  ) {
    const documento = await this.filesService.actualizar(id, dto);
    return {
      success: true,
      message: 'Documento actualizado con éxito.',
      data: documento,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/files/:id
   * Elimina el archivo del almacenamiento físico y su registro en la base de datos
   */
  @Delete(':id')
  async eliminar(@Param('id') id: string) {
    const resultado = await this.filesService.eliminar(id);
    return {
      success: true,
      message: resultado.mensaje,
      timestamp: new Date().toISOString(),
    };
  }
}
