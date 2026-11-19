import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  private readonly logger = new Logger(FoldersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene las carpetas y subcarpetas de una materia agrupadas por docente
   */
  async getFoldersByMateria(materiaId: number) {
    const carpetas = await this.prisma.carpeta.findMany({
      where: { materia_id: materiaId, padre_id: null },
      include: {
        propietario: {
          select: { id: true, nombre: true, apellidos: true, correo: true },
        },
        subcarpetas: {
          include: {
            archivos: {
              select: {
                id: true,
                titulo: true,
                nombre_original: true,
                tamano_bytes: true,
                descargas: true,
              },
            },
          },
        },
        archivos: {
          select: {
            id: true,
            titulo: true,
            nombre_original: true,
            tamano_bytes: true,
            descargas: true,
          },
        },
      },
      orderBy: { creado_en: 'asc' },
    });

    return carpetas;
  }

  /**
   * Crea una carpeta o subcarpeta
   */
  async createFolder(dto: CreateFolderDto, usuarioId?: number) {
    const propietarioId = dto.propietarioId || usuarioId;
    if (!propietarioId) {
      throw new ForbiddenException('Se requiere identificar al docente propietario.');
    }

    // Validar que el usuario exista
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: propietarioId },
      include: { rol: true },
    });

    if (!usuario) {
      throw new NotFoundException('Docente no encontrado.');
    }

    // Si es subcarpeta, validar que la carpeta padre pertenezca a la misma materia
    if (dto.padreId) {
      const padre = await this.prisma.carpeta.findUnique({
        where: { id: dto.padreId },
      });
      if (!padre || padre.materia_id !== dto.materiaId) {
        throw new NotFoundException('La carpeta padre no pertenece a la misma materia.');
      }
    }

    const nueva = await this.prisma.carpeta.create({
      data: {
        nombre: dto.nombre.trim(),
        materia_id: dto.materiaId,
        propietario_id: propietarioId,
        padre_id: dto.padreId ? Number(dto.padreId) : null,
      },
      include: {
        propietario: {
          select: { id: true, nombre: true, apellidos: true },
        },
      },
    });

    this.logger.log(`Carpeta creada: "${nueva.nombre}" en materia ${dto.materiaId} por docente ${propietarioId}`);
    return nueva;
  }

  /**
   * Actualiza el nombre de una carpeta propia
   */
  async updateFolder(id: number, dto: UpdateFolderDto, usuarioId?: number) {
    const carpeta = await this.prisma.carpeta.findUnique({ where: { id } });
    if (!carpeta) {
      throw new NotFoundException(`La carpeta con ID ${id} no existe.`);
    }

    if (usuarioId && carpeta.propietario_id !== usuarioId) {
      throw new ForbiddenException('Solo el docente propietario puede renombrar su carpeta.');
    }

    const actualizada = await this.prisma.carpeta.update({
      where: { id },
      data: { nombre: dto.nombre.trim() },
    });

    return actualizada;
  }

  /**
   * Elimina una carpeta propia (los archivos pasan a carpeta_id = null por onDelete: SetNull)
   */
  async deleteFolder(id: number, usuarioId?: number) {
    const carpeta = await this.prisma.carpeta.findUnique({ where: { id } });
    if (!carpeta) {
      throw new NotFoundException(`La carpeta con ID ${id} no existe.`);
    }

    if (usuarioId && carpeta.propietario_id !== usuarioId) {
      throw new ForbiddenException('Solo el docente propietario puede eliminar su carpeta.');
    }

    await this.prisma.carpeta.delete({ where: { id } });
    return { mensaje: `Carpeta "${carpeta.nombre}" eliminada con éxito.` };
  }
}
