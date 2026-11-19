import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FilesRepository } from './files.repository';
import { StorageService } from '../storage/storage.service';
import { AcademicFile } from './entities/academic-file.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { QueryFilesDto } from './dto/query-files.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly storageService: StorageService,
  ) {}

  private formatearTamano(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Sube físicamente un archivo y registra sus metadatos académicos
   */
  async subirArchivo(
    file: Express.Multer.File,
    dto: UploadFileDto,
    user?: CurrentUserPayload | null,
    ip?: string,
  ): Promise<AcademicFile> {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo para subir.');
    }

    // Validación estricta de rol: Solo profesores y administradores pueden subir archivos
    if (user && user.role) {
      const rolUpper = user.role.toUpperCase();
      if (rolUpper !== 'PROFESOR' && rolUpper !== 'ADMINISTRADOR') {
        throw new ForbiddenException(
          'Solo los profesores y administradores tienen permisos para subir y publicar recursos.',
        );
      }
    }

    // 1. Guardar archivo físico en uploads/{carrera}/semestre-{semestre}/
    const stored = await this.storageService.guardarArchivo(
      file,
      dto.carreraId,
      dto.semestre,
    );

    // 2. Construir entidad base
    const ahora = new Date().toISOString();
    const docenteNombre = user ? user.name : (dto.autorNombre || 'Docente UAQ');
    const docenteRol = user ? user.role : (dto.autorRol || 'Profesor');

    const nuevoDocumento: AcademicFile = {
      id: uuidv4(),
      titulo: dto.titulo.trim(),
      descripcion: (dto.descripcion || '').trim(),
      nombreOriginal: stored.nombreOriginal,
      nombreFisico: stored.nombreGuardado,
      rutaRelativa: stored.rutaRelativa,
      extension: stored.extension,
      mimeType: stored.mimeType,
      tamanoBytes: stored.tamanoBytes,
      tamanoFormateado: this.formatearTamano(stored.tamanoBytes),
      carreraId: dto.carreraId.trim().toUpperCase(),
      materia: dto.materia.trim(),
      semestre: Number(dto.semestre),
      categoria: dto.categoria,
      parcial: dto.parcial ?? null,
      carpetaId: dto.carpeta_id ?? null,
      autorNombre: docenteNombre,
      autorRol: docenteRol,
      descargas: 0,
      fechaSubida: ahora,
      fechaActualizacion: ahora,
    };

    // 3. Persistir en PostgreSQL
    const documentoGuardado = await this.filesRepository.guardar(
      nuevoDocumento,
      dto.materia_id ? Number(dto.materia_id) : undefined,
      user?.id,
      dto.parcial,
      dto.carpeta_id,
    );

    // 4. Registrar en bitácora de auditoría
    await this.filesRepository.registrarAuditoria(
      user?.id || null,
      'SUBIDA_ARCHIVO',
      'archivos',
      Number(documentoGuardado.id),
      {
        titulo: documentoGuardado.titulo,
        materia: dto.materia,
        carrera: dto.carreraId,
        archivo: stored.nombreOriginal,
      },
      ip,
    );

    this.logger.log(`Documento registrado: ${documentoGuardado.titulo} (ID: ${documentoGuardado.id})`);
    return documentoGuardado;
  }

  /**
   * Consulta documentos aplicando filtros opcionales de búsqueda
   */
  async listarArchivos(filtros: QueryFilesDto, userId?: number): Promise<AcademicFile[]> {
    let archivos = await this.filesRepository.obtenerTodos(userId);

    if (filtros.carreraId && filtros.carreraId !== 'Todas') {
      const carreraBuscada = filtros.carreraId.toLowerCase();
      archivos = archivos.filter(
        (a) => a.carreraId.toLowerCase() === carreraBuscada,
      );
    }

    if (filtros.materia && filtros.materia !== 'Todas') {
      const materiaBuscada = filtros.materia.toLowerCase();
      archivos = archivos.filter(
        (a) => a.materia.toLowerCase() === materiaBuscada,
      );
    }

    if (filtros.semestre && Number(filtros.semestre) > 0) {
      const sem = Number(filtros.semestre);
      archivos = archivos.filter((a) => a.semestre === sem);
    }

    if (filtros.categoria && filtros.categoria !== 'Todas') {
      const catBuscada = filtros.categoria.toLowerCase();
      archivos = archivos.filter(
        (a) => a.categoria.toLowerCase() === catBuscada,
      );
    }

    if (filtros.busqueda && filtros.busqueda.trim()) {
      const termino = filtros.busqueda.toLowerCase().trim();
      archivos = archivos.filter(
        (a) =>
          a.titulo.toLowerCase().includes(termino) ||
          a.descripcion.toLowerCase().includes(termino) ||
          a.materia.toLowerCase().includes(termino) ||
          a.nombreOriginal.toLowerCase().includes(termino) ||
          a.autorNombre.toLowerCase().includes(termino),
      );
    }

    return archivos;
  }

  /**
   * Obtiene la información detallada de un archivo por su ID
   */
  async obtenerPorId(id: string, userId?: number): Promise<AcademicFile> {
    const documento = await this.filesRepository.obtenerPorId(id, userId);
    if (!documento) {
      throw new NotFoundException(`No se encontró el documento con ID: "${id}"`);
    }
    return documento;
  }

  /**
   * Prepara el archivo para previsualización o descarga
   */
  async obtenerParaDescarga(
    id: string,
    incrementarDescarga = false,
    user?: CurrentUserPayload | null,
    ip?: string,
  ): Promise<{ metadata: AcademicFile; rutaAbsoluta: string }> {
    const documento = await this.obtenerPorId(id);

    const rutaAbsoluta = await this.storageService.obtenerRutaFisica(
      documento.rutaRelativa,
    );

    if (incrementarDescarga) {
      await this.filesRepository.incrementarDescargas(id);
      await this.filesRepository.registrarAuditoria(
        user?.id || null,
        'DESCARGA_ARCHIVO',
        'archivos',
        Number(id),
        { titulo: documento.titulo },
        ip,
      );
    }

    return { metadata: documento, rutaAbsoluta };
  }

  /**
   * Actualiza los metadatos de un archivo y opcionalmente reemplaza su PDF
   */
  async actualizar(
    id: string,
    dto: UpdateFileDto,
    user?: CurrentUserPayload | null,
    file?: Express.Multer.File,
    ip?: string,
  ): Promise<AcademicFile> {
    const numId = parseInt(id, 10);
    const registroPuro = await this.filesRepository.obtenerRegistroPuro(numId);
    if (!registroPuro) {
      throw new NotFoundException(`No se encontró el documento con ID: "${id}"`);
    }

    // Validación de propietario o administrador
    if (user) {
      const esAdmin = user.role.toUpperCase() === 'ADMINISTRADOR';
      const esDueno = registroPuro.docente_id === user.id;
      if (!esAdmin && !esDueno) {
        throw new ForbiddenException(
          'Solo el docente propietario o un administrador pueden modificar este documento.',
        );
      }
    }

    let datosActualizar: any = {
      titulo: dto.titulo?.trim(),
      categoria: dto.categoria,
      parcial: dto.parcial,
      carpeta_id: dto.carpeta_id,
    };

    // Reemplazo opcional de archivo físico
    if (file) {
      const carreraClave = registroPuro.docente?.rol?.nombre || 'INF18';
      const stored = await this.storageService.guardarArchivo(file, carreraClave, 1);
      datosActualizar = {
        ...datosActualizar,
        nombreOriginal: stored.nombreOriginal,
        rutaRelativa: stored.rutaRelativa,
        tamanoBytes: stored.tamanoBytes,
        mimeType: stored.mimeType,
      };
    }

    const actualizado = await this.filesRepository.actualizar(id, datosActualizar);
    if (!actualizado) {
      throw new NotFoundException(`No se pudo actualizar el documento con ID: "${id}"`);
    }

    await this.filesRepository.registrarAuditoria(
      user?.id || null,
      'ACTUALIZACION_ARCHIVO',
      'archivos',
      numId,
      { cambios: dto, archivoReemplazado: Boolean(file) },
      ip,
    );

    return actualizado;
  }

  /**
   * Elimina un archivo físico y su registro en la BD
   */
  async eliminar(
    id: string,
    user?: CurrentUserPayload | null,
    ip?: string,
  ): Promise<{ mensaje: string }> {
    const numId = parseInt(id, 10);
    const registroPuro = await this.filesRepository.obtenerRegistroPuro(numId);
    if (!registroPuro) {
      throw new NotFoundException(`No se encontró el documento con ID: "${id}"`);
    }

    // Validación de propietario o administrador
    if (user) {
      const esAdmin = user.role.toUpperCase() === 'ADMINISTRADOR';
      const esDueno = registroPuro.docente_id === user.id;
      if (!esAdmin && !esDueno) {
        throw new ForbiddenException(
          'Solo el docente propietario o un administrador pueden eliminar este documento.',
        );
      }
    }

    // 1. Eliminar archivo físico
    await this.storageService.eliminarArchivoFisico(registroPuro.ruta_almacen);

    // 2. Eliminar de la base de datos
    await this.filesRepository.eliminar(id);

    // 3. Auditoría
    await this.filesRepository.registrarAuditoria(
      user?.id || null,
      'ELIMINACION_ARCHIVO',
      'archivos',
      numId,
      { titulo: registroPuro.titulo },
      ip,
    );

    return { mensaje: `Documento "${registroPuro.titulo}" eliminado exitosamente.` };
  }

  /**
   * Alterna el guardado en favoritos de un estudiante
   */
  async toggleBookmark(id: string, usuarioId: number): Promise<{ saved: boolean; message: string }> {
    const numId = parseInt(id, 10);
    const existe = await this.filesRepository.obtenerPorId(id);
    if (!existe) {
      throw new NotFoundException(`Documento con ID ${id} no encontrado.`);
    }

    const res = await this.filesRepository.toggleBookmark(numId, usuarioId);
    return {
      saved: res.saved,
      message: res.saved
        ? 'Documento guardado en tus favoritos.'
        : 'Documento retirado de tus favoritos.',
    };
  }

  /**
   * Obtiene todos los archivos guardados por el estudiante autenticado
   */
  async obtenerGuardados(usuarioId: number): Promise<AcademicFile[]> {
    return this.filesRepository.obtenerGuardadosPorUsuario(usuarioId);
  }
}
