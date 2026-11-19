import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicFile } from './entities/academic-file.entity';

/**
 * FilesRepository — Acceso a datos de documentos académicos.
 *
 * Implementación con Prisma ORM sobre la tabla "archivos" (PostgreSQL 16).
 * Se adapta al diseño relacional institucional de 17 tablas:
 * - Tabla principal: "archivos"
 * - Relaciones: "materias", "materias_carreras", "carreras", "usuarios", "roles"
 *
 * Mantiene compatibilidad con la interfaz AcademicFile para no romper
 * la comunicación con el frontend Angular.
 */
@Injectable()
export class FilesRepository {
  private readonly logger = new Logger(FilesRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: formatea bytes a texto legible (ej. "3.4 MB")
   */
  private formatearTamano(bytes: number): string {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Helper: mapea un registro relacional de Prisma al contrato AcademicFile
   */
  private mapToEntity(record: any): AcademicFile {
    const carreraRel = record.materia?.materias_carreras?.[0];
    const carreraClave = carreraRel?.carrera?.clave || 'GENERAL';
    const semestre = carreraRel?.semestre || 1;
    const docenteNombre = record.docente
      ? `${record.docente.nombre} ${record.docente.apellidos}`.trim()
      : 'Comunidad Académica UAQ';
    const docenteRol = record.docente?.rol?.nombre || 'Profesor';
    const tamanoNum = Number(record.tamano_bytes);

    const nombreFisico = record.ruta_almacen
      ? record.ruta_almacen.replace(/\\/g, '/').split('/').pop() || record.nombre_original
      : record.nombre_original;

    const extension = record.nombre_original
      ? '.' + (record.nombre_original.split('.').pop() || 'pdf').toLowerCase()
      : '.pdf';

    return {
      id: String(record.id),
      titulo: record.titulo,
      descripcion: record.materia?.descripcion || record.titulo,
      nombreOriginal: record.nombre_original,
      nombreFisico,
      rutaRelativa: record.ruta_almacen,
      extension,
      mimeType: record.mime_type || 'application/pdf',
      tamanoBytes: tamanoNum,
      tamanoFormateado: this.formatearTamano(tamanoNum),
      carreraId: carreraClave,
      materia: record.materia?.nombre || 'General',
      semestre,
      categoria: record.tema || 'Guías',
      autorNombre: docenteNombre,
      autorRol: docenteRol,
      descargas: record.descargas || 0,
      fechaSubida: record.creado_en instanceof Date
        ? record.creado_en.toISOString()
        : String(record.creado_en),
      fechaActualizacion: record.actualizado_en instanceof Date
        ? record.actualizado_en.toISOString()
        : String(record.actualizado_en),
    };
  }

  /**
   * Resuelve o crea la materia en base a su nombre y clave de carrera
   */
  private async resolverMateriaId(
    nombreMateria: string,
    carreraClave: string,
    semestre: number,
  ): Promise<number> {
    const nombreLimpio = nombreMateria.trim();
    const carreraLimpia = carreraClave.trim().toUpperCase();

    // 1. Buscar materia por coincidencia exacta de nombre
    let materia = await this.prisma.materia.findFirst({
      where: {
        nombre: { equals: nombreLimpio, mode: 'insensitive' },
      },
    });

    // 2. Si no existe, crear la materia en el catálogo
    if (!materia) {
      const prefijo = carreraLimpia.replace(/[0-9]/g, '').slice(0, 3) || 'MAT';
      const claveUnica = `${prefijo}-${Date.now().toString().slice(-4)}`;
      materia = await this.prisma.materia.create({
        data: {
          clave: claveUnica,
          nombre: nombreLimpio,
          descripcion: `Materia académica de ${nombreLimpio}`,
          activa: true,
        },
      });
      this.logger.log(`Nueva materia registrada en BD: "${nombreLimpio}" (${materia.clave})`);
    }

    // 3. Vincular con la carrera y semestre si aún no existe la relación
    const carrera = await this.prisma.carrera.findUnique({
      where: { clave: carreraLimpia },
    });

    if (carrera) {
      await this.prisma.materiasCarrera.upsert({
        where: {
          materia_id_carrera_id: {
            materia_id: materia.id,
            carrera_id: carrera.id,
          },
        },
        update: { semestre },
        create: {
          materia_id: materia.id,
          carrera_id: carrera.id,
          semestre,
        },
      }).catch(() => {});
    }

    return materia.id;
  }

  /**
   * Resuelve o asigna el ID del docente propietario
   */
  private async resolverDocenteId(autorNombre?: string): Promise<number> {
    // 1. Si se especificó nombre, intentar ubicar al usuario existente
    if (autorNombre && autorNombre.trim()) {
      const partes = autorNombre.trim().split(' ');
      const primerNombre = partes[0];
      const usuario = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { nombre: { contains: primerNombre, mode: 'insensitive' } },
            { apellidos: { contains: primerNombre, mode: 'insensitive' } },
          ],
        },
      });
      if (usuario) {
        return usuario.id;
      }
    }

    // 2. Docente profesor por defecto (Carlos Ramírez Peña del seed)
    const profesorDefault = await this.prisma.usuario.findFirst({
      where: { rol_id: 2 }, // Profesor
    });

    if (profesorDefault) {
      return profesorDefault.id;
    }

    // 3. Si no hay docentes, obtener el primer usuario disponible
    const primerUsuario = await this.prisma.usuario.findFirst();
    if (!primerUsuario) {
      throw new Error('No existen usuarios en la base de datos para asignar como propietario del archivo.');
    }
    return primerUsuario.id;
  }

  /**
   * Obtiene todos los archivos académicos con sus relaciones
   */
  async obtenerTodos(): Promise<AcademicFile[]> {
    try {
      const registros = await this.prisma.archivo.findMany({
        include: {
          materia: {
            include: {
              materias_carreras: {
                include: { carrera: true },
              },
            },
          },
          docente: {
            include: { rol: true },
          },
        },
        orderBy: { creado_en: 'desc' },
      });
      return registros.map((r) => this.mapToEntity(r));
    } catch (error) {
      this.logger.error('Error al obtener todos los archivos', error);
      return [];
    }
  }

  /**
   * Busca un archivo académico por ID
   */
  async obtenerPorId(id: string): Promise<AcademicFile | null> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return null;
    }

    try {
      const registro = await this.prisma.archivo.findUnique({
        where: { id: numId },
        include: {
          materia: {
            include: {
              materias_carreras: {
                include: { carrera: true },
              },
            },
          },
          docente: {
            include: { rol: true },
          },
        },
      });
      return registro ? this.mapToEntity(registro) : null;
    } catch (error) {
      this.logger.error(`Error al buscar archivo con id ${id}`, error);
      return null;
    }
  }

  /**
   * Guarda un nuevo archivo en PostgreSQL resolviendo materia y docente
   */
  async guardar(nuevo: AcademicFile): Promise<AcademicFile> {
    const materiaId = await this.resolverMateriaId(
      nuevo.materia,
      nuevo.carreraId,
      nuevo.semestre,
    );

    const docenteId = await this.resolverDocenteId(nuevo.autorNombre);

    const registro = await this.prisma.archivo.create({
      data: {
        titulo: nuevo.titulo,
        tema: nuevo.categoria,
        nombre_original: nuevo.nombreOriginal,
        ruta_almacen: nuevo.rutaRelativa,
        tamano_bytes: BigInt(nuevo.tamanoBytes),
        mime_type: nuevo.mimeType || 'application/pdf',
        materia_id: materiaId,
        docente_id: docenteId,
        descargas: 0,
      },
      include: {
        materia: {
          include: {
            materias_carreras: {
              include: { carrera: true },
            },
          },
        },
        docente: {
          include: { rol: true },
        },
      },
    });

    this.logger.log(`Documento registrado en PostgreSQL: "${registro.titulo}" (ID: ${registro.id})`);
    return this.mapToEntity(registro);
  }

  /**
   * Actualiza metadatos de un archivo existente
   */
  async actualizar(id: string, datos: Partial<AcademicFile>): Promise<AcademicFile | null> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return null;
    }

    try {
      const updateData: any = {};
      if (datos.titulo) updateData.titulo = datos.titulo;
      if (datos.categoria) updateData.tema = datos.categoria;

      const registro = await this.prisma.archivo.update({
        where: { id: numId },
        data: updateData,
        include: {
          materia: {
            include: {
              materias_carreras: {
                include: { carrera: true },
              },
            },
          },
          docente: {
            include: { rol: true },
          },
        },
      });

      return this.mapToEntity(registro);
    } catch (error) {
      this.logger.warn(`No se pudo actualizar el archivo ${id}: ${error}`);
      return null;
    }
  }

  /**
   * Incrementa el contador de descargas
   */
  async incrementarDescargas(id: string): Promise<void> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return;
    }

    try {
      await this.prisma.archivo.update({
        where: { id: numId },
        data: { descargas: { increment: 1 } },
      });
    } catch (error) {
      this.logger.warn(`Error al incrementar descargas para archivo ${id}: ${error}`);
    }
  }

  /**
   * Elimina un archivo de la base de datos
   */
  async eliminar(id: string): Promise<boolean> {
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return false;
    }

    try {
      await this.prisma.archivo.delete({
        where: { id: numId },
      });
      return true;
    } catch (error) {
      this.logger.warn(`Error al eliminar archivo ${id}: ${error}`);
      return false;
    }
  }
}
