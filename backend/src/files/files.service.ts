import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { FilesRepository } from './files.repository';
import { StorageService } from '../storage/storage.service';
import { AcademicFile } from './entities/academic-file.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { QueryFilesDto } from './dto/query-files.dto';
import { UpdateFileDto } from './dto/update-file.dto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Da formato legible al peso en bytes (ej. "3.4 MB" o "450 KB")
   */
  private formatearTamano(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Sube físicamente un archivo y registra sus metadatos
   */
  async subirArchivo(
    file: Express.Multer.File,
    dto: UploadFileDto,
  ): Promise<AcademicFile> {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo para subir.');
    }

    // 1. Guardar archivo físico en uploads/{carrera}/semestre-{semestre}/
    const stored = await this.storageService.guardarArchivo(
      file,
      dto.carreraId,
      dto.semestre,
    );

    // 2. Construir el registro de metadatos del documento
    const ahora = new Date().toISOString();
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
      autorNombre: dto.autorNombre?.trim() || 'Comunidad Académica UAQ',
      autorRol: dto.autorRol?.trim() || 'Profesor',
      descargas: 0,
      fechaSubida: ahora,
      fechaActualizacion: ahora,
    };

    // 3. Persistir en el repositorio
    await this.filesRepository.guardar(nuevoDocumento);
    this.logger.log(`Documento registrado: ${nuevoDocumento.titulo} (${nuevoDocumento.id})`);

    return nuevoDocumento;
  }

  /**
   * Consulta documentos aplicando filtros opcionales de búsqueda
   */
  async listarArchivos(filtros: QueryFilesDto): Promise<AcademicFile[]> {
    let archivos = await this.filesRepository.obtenerTodos();

    // Filtro por carrera
    if (filtros.carreraId && filtros.carreraId !== 'Todas') {
      const carreraBuscada = filtros.carreraId.toLowerCase();
      archivos = archivos.filter(
        (a) => a.carreraId.toLowerCase() === carreraBuscada,
      );
    }

    // Filtro por materia
    if (filtros.materia && filtros.materia !== 'Todas') {
      const materiaBuscada = filtros.materia.toLowerCase();
      archivos = archivos.filter(
        (a) => a.materia.toLowerCase() === materiaBuscada,
      );
    }

    // Filtro por semestre
    if (filtros.semestre) {
      const sem = Number(filtros.semestre);
      archivos = archivos.filter((a) => a.semestre === sem);
    }

    // Filtro por categoría (Guías, Apuntes, Prácticas, Proyectos)
    if (filtros.categoria && filtros.categoria !== 'Todas') {
      archivos = archivos.filter((a) => a.categoria === filtros.categoria);
    }

    // Filtro por texto de búsqueda (busca en título, materia y autor)
    if (filtros.busqueda && filtros.busqueda.trim()) {
      const query = filtros.busqueda.trim().toLowerCase();
      archivos = archivos.filter((a) => {
        const textoCompleto = `${a.titulo} ${a.materia} ${a.descripcion} ${a.autorNombre}`.toLowerCase();
        return textoCompleto.includes(query);
      });
    }

    return archivos;
  }

  /**
   * Obtiene un documento por su ID o lanza NotFoundException
   */
  async obtenerPorId(id: string): Promise<AcademicFile> {
    const archivo = await this.filesRepository.obtenerPorId(id);
    if (!archivo) {
      throw new NotFoundException(`El documento con ID "${id}" no existe.`);
    }
    return archivo;
  }

  /**
   * Prepara el archivo para previsualización o descarga
   */
  async obtenerParaDescarga(
    id: string,
    esDescarga = false,
  ): Promise<{ metadata: AcademicFile; rutaAbsoluta: string }> {
    const metadata = await this.obtenerPorId(id);
    const rutaAbsoluta = await this.storageService.obtenerRutaFisica(
      metadata.rutaRelativa,
    );

    if (esDescarga) {
      await this.filesRepository.incrementarDescargas(id);
      metadata.descargas = (metadata.descargas || 0) + 1;
    }

    return { metadata, rutaAbsoluta };
  }

  /**
   * Actualiza los metadatos de un archivo
   */
  async actualizar(id: string, dto: UpdateFileDto): Promise<AcademicFile> {
    await this.obtenerPorId(id); // Valida que exista

    const actualizado = await this.filesRepository.actualizar(id, {
      ...(dto.titulo && { titulo: dto.titulo.trim() }),
      ...(dto.descripcion !== undefined && { descripcion: dto.descripcion.trim() }),
      ...(dto.categoria && { categoria: dto.categoria }),
    });

    return actualizado;
  }

  /**
   * Elimina el archivo físico de disco y su registro de metadatos
   */
  async eliminar(id: string): Promise<{ mensaje: string }> {
    const doc = await this.obtenerPorId(id);

    // 1. Eliminar archivo físico de la carpeta uploads/
    await this.storageService.eliminarArchivoFisico(doc.rutaRelativa);

    // 2. Eliminar registro del JSON local
    await this.filesRepository.eliminar(id);

    this.logger.log(`Documento eliminado completamente: ${doc.titulo} (${id})`);
    return { mensaje: `Documento "${doc.titulo}" eliminado con éxito.` };
  }
}
