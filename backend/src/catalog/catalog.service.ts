import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene las 7 carreras oficiales de la facultad
   */
  async getCarreras() {
    return this.prisma.carrera.findMany({
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Obtiene las 12 áreas de conocimiento oficiales
   */
  async getAreas() {
    return this.prisma.areaConocimiento.findMany({
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Consulta materias con filtros opcionales por carrera, semestre, área y texto
   */
  async getMaterias(filtros: {
    carrera?: string;
    semestre?: number;
    areaId?: number;
    q?: string;
  }) {
    const where: any = { activa: true };

    if (filtros.areaId) {
      where.area_id = Number(filtros.areaId);
    }

    if (filtros.q && filtros.q.trim()) {
      const busqueda = filtros.q.trim();
      where.OR = [
        { clave: { contains: busqueda, mode: 'insensitive' } },
        { nombre: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    if (filtros.carrera || filtros.semestre) {
      where.materias_carreras = {
        some: {
          ...(filtros.carrera && {
            carrera: { clave: filtros.carrera.trim().toUpperCase() },
          }),
          ...(filtros.semestre && {
            semestre: Number(filtros.semestre),
          }),
        },
      };
    }

    const materias = await this.prisma.materia.findMany({
      where,
      include: {
        area: true,
        materias_carreras: {
          include: { carrera: true },
          orderBy: { semestre: 'asc' },
        },
        materias_profesores: {
          include: {
            profesor: {
              select: { id: true, nombre: true, apellidos: true, correo: true },
            },
            periodo: true,
          },
        },
      },
      orderBy: { clave: 'asc' },
    });

    return materias.map((m) => ({
      id: m.id,
      clave: m.clave,
      nombre: m.nombre,
      descripcion: m.descripcion,
      area: m.area?.nombre || 'General',
      areaId: m.area_id,
      carreras: m.materias_carreras.map((mc) => ({
        carreraClave: mc.carrera.clave,
        carreraNombre: mc.carrera.nombre,
        semestre: mc.semestre,
      })),
      profesores: m.materias_profesores.map((mp) => ({
        id: mp.profesor.id,
        nombreCompleto: `${mp.profesor.nombre} ${mp.profesor.apellidos}`.trim(),
        correo: mp.profesor.correo,
        periodo: mp.periodo.nombre,
      })),
    }));
  }

  /**
   * Obtiene el detalle completo de una materia por ID
   */
  async getMateriaById(id: number) {
    const materia = await this.prisma.materia.findUnique({
      where: { id },
      include: {
        area: true,
        materias_carreras: {
          include: { carrera: true },
          orderBy: { semestre: 'asc' },
        },
        materias_profesores: {
          include: {
            profesor: {
              select: { id: true, nombre: true, apellidos: true, correo: true },
            },
            periodo: true,
          },
        },
        carpetas: {
          where: { padre_id: null },
          include: {
            propietario: {
              select: { id: true, nombre: true, apellidos: true },
            },
            subcarpetas: true,
            archivos: {
              select: { id: true, titulo: true, nombre_original: true, tamano_bytes: true, descargas: true },
            },
          },
        },
        archivos: {
          where: { carpeta_id: null },
          select: { id: true, titulo: true, nombre_original: true, tamano_bytes: true, descargas: true, docente_id: true },
        },
      },
    });

    if (!materia) {
      throw new NotFoundException(`La materia con ID ${id} no existe.`);
    }

    return materia;
  }
}
