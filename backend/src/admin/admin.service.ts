import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMateriaDto, UpdateMateriaDto } from './dto/create-materia.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-user.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: obtiene el periodo académico activo (ej. 2026-2)
   */
  private async obtenerPeriodoActivoId(): Promise<number> {
    const periodo = await this.prisma.periodo.findFirst({
      where: { activo: true },
    });
    if (periodo) return periodo.id;

    // Si no hay marcado como activo, tomar el último o crear uno
    const ultimo = await this.prisma.periodo.findFirst({
      orderBy: { id: 'desc' },
    });
    if (ultimo) return ultimo.id;

    const nuevo = await this.prisma.periodo.create({
      data: {
        nombre: '2026-2',
        activo: true,
      },
    });
    return nuevo.id;
  }

  // ─── GESTIÓN DE MATERIAS Y ASIGNACIONES ──────────────────────

  async crearMateria(dto: CreateMateriaDto) {
    const existente = await this.prisma.materia.findUnique({
      where: { clave: dto.clave.trim().toUpperCase() },
    });
    if (existente) {
      throw new BadRequestException(
        `Ya existe una materia con la clave ${dto.clave}`,
      );
    }

    const materia = await this.prisma.materia.create({
      data: {
        clave: dto.clave.trim().toUpperCase(),
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        area_id: dto.area_id || null,
        activa: true,
      },
    });

    if (dto.carreras && dto.carreras.length > 0) {
      for (const c of dto.carreras) {
        await this.prisma.materiasCarrera.upsert({
          where: {
            materia_id_carrera_id: {
              materia_id: materia.id,
              carrera_id: c.carrera_id,
            },
          },
          update: { semestre: c.semestre },
          create: {
            materia_id: materia.id,
            carrera_id: c.carrera_id,
            semestre: c.semestre,
          },
        });
      }
    }

    return materia;
  }

  async actualizarMateria(id: number, dto: UpdateMateriaDto) {
    const existe = await this.prisma.materia.findUnique({ where: { id } });
    if (!existe) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada.`);
    }

    return this.prisma.materia.update({
      where: { id },
      data: {
        clave: dto.clave ? dto.clave.trim().toUpperCase() : undefined,
        nombre: dto.nombre ? dto.nombre.trim() : undefined,
        descripcion: dto.descripcion !== undefined ? dto.descripcion.trim() : undefined,
        area_id: dto.area_id !== undefined ? dto.area_id : undefined,
        activa: dto.activa !== undefined ? dto.activa : undefined,
      },
      include: {
        area: true,
        materias_carreras: { include: { carrera: true } },
      },
    });
  }

  async eliminarMateria(id: number) {
    const existe = await this.prisma.materia.findUnique({ where: { id } });
    if (!existe) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada.`);
    }

    // Desactivar en lugar de borrado físico destructivo
    return this.prisma.materia.update({
      where: { id },
      data: { activa: false },
    });
  }

  async asignarProfesor(materiaId: number, dto: AssignTeacherDto) {
    const materia = await this.prisma.materia.findUnique({ where: { id: materiaId } });
    if (!materia) throw new NotFoundException('Materia no encontrada.');

    const profesor = await this.prisma.usuario.findUnique({
      where: { id: dto.profesor_id },
      include: { rol: true },
    });
    if (!profesor || profesor.rol.nombre !== 'PROFESOR') {
      throw new BadRequestException('El usuario indicado debe existir y tener rol de PROFESOR.');
    }

    const periodoId = dto.periodo_id || (await this.obtenerPeriodoActivoId());

    return this.prisma.materiasProfesor.upsert({
      where: {
        materia_id_profesor_id_periodo_id: {
          materia_id: materiaId,
          profesor_id: dto.profesor_id,
          periodo_id: periodoId,
        },
      },
      update: {},
      create: {
        materia_id: materiaId,
        profesor_id: dto.profesor_id,
        periodo_id: periodoId,
      },
      include: {
        profesor: {
          select: { id: true, nombre: true, apellidos: true, correo: true },
        },
        materia: { select: { id: true, clave: true, nombre: true } },
        periodo: true,
      },
    });
  }

  async eliminarAsignacionProfesor(materiaId: number, profesorId: number, periodoId?: number) {
    const pid = periodoId || (await this.obtenerPeriodoActivoId());
    await this.prisma.materiasProfesor.deleteMany({
      where: {
        materia_id: materiaId,
        profesor_id: profesorId,
        periodo_id: pid,
      },
    });
    return { success: true, message: 'Asignación de docente removida correctamente.' };
  }

  // ─── GESTIÓN DE USUARIOS INSTITUCIONALES ─────────────────────

  async listarUsuarios(filtros: {
    rol_id?: number;
    estado?: string;
    carrera_id?: number;
    busqueda?: string;
  }) {
    const where: any = {};

    if (filtros.rol_id) where.rol_id = Number(filtros.rol_id);
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.carrera_id) where.carrera_id = Number(filtros.carrera_id);

    if (filtros.busqueda && filtros.busqueda.trim()) {
      const q = filtros.busqueda.trim();
      where.OR = [
        { nombre: { contains: q, mode: 'insensitive' } },
        { apellidos: { contains: q, mode: 'insensitive' } },
        { correo: { contains: q, mode: 'insensitive' } },
      ];
    }

    const usuarios = await this.prisma.usuario.findMany({
      where,
      include: {
        rol: true,
        carrera: true,
      },
      orderBy: { creado_en: 'desc' },
    });

    return usuarios.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      apellidos: u.apellidos,
      nombreCompleto: `${u.nombre} ${u.apellidos}`.trim(),
      correo: u.correo,
      rolId: u.rol_id,
      rolNombre: u.rol.nombre,
      estado: u.estado,
      carreraId: u.carrera_id,
      carreraClave: u.carrera?.clave || null,
      carreraNombre: u.carrera?.nombre || null,
      semestre: u.semestre,
      expediente:
        u.rol_id === 1
          ? String(298400 + u.id)
          : u.rol_id === 2
          ? `DOC-${1000 + u.id}`
          : `ADM-${100 + u.id}`,
      ultimoAcceso: u.ultimo_acceso,
      creadoEn: u.creado_en,
    }));
  }

  async actualizarRolUsuario(id: number, rol_id: number) {
    const rol = await this.prisma.rol.findUnique({ where: { id: rol_id } });
    if (!rol) throw new NotFoundException('Rol no encontrado en el sistema.');

    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: { rol_id },
      include: { rol: true, carrera: true },
    });

    return {
      id: usuario.id,
      correo: usuario.correo,
      rolNombre: usuario.rol.nombre,
      message: `Rol actualizado a ${usuario.rol.nombre}`,
    };
  }

  async actualizarEstadoUsuario(id: number, estado: 'ACTIVA' | 'SUSPENDIDA' | 'INACTIVA') {
    const usuario = await this.prisma.usuario.update({
      where: { id },
      data: { estado },
      include: { rol: true },
    });

    return {
      id: usuario.id,
      correo: usuario.correo,
      estado: usuario.estado,
      message: `Estado de cuenta cambiado a ${usuario.estado}`,
    };
  }

  // ─── MODERACIÓN DE REPORTES DE COMENTARIOS ───────────────────

  async listarReportes(estado?: string) {
    const where: any = {};
    if (estado && estado !== 'TODOS') {
      where.estado = estado;
    }

    const reportes = await this.prisma.reporteComentario.findMany({
      where,
      include: {
        reportante: { select: { id: true, nombre: true, apellidos: true, correo: true } },
        comentario: {
          include: {
            autor: { select: { id: true, nombre: true, apellidos: true, correo: true, rol: true } },
            archivo: { select: { id: true, titulo: true } },
          },
        },
      },
      orderBy: { creado_en: 'desc' },
    });

    return reportes.map((r) => ({
      id: r.id,
      comentarioId: r.comentario_id,
      comentarioContenido: r.comentario.contenido,
      comentarioAutor: `${r.comentario.autor.nombre} ${r.comentario.autor.apellidos}`.trim(),
      comentarioAutorRol: r.comentario.autor.rol.nombre,
      archivoId: r.comentario.archivo_id,
      archivoTitulo: r.comentario.archivo.titulo,
      reportante: `${r.reportante.nombre} ${r.reportante.apellidos}`.trim(),
      reportanteCorreo: r.reportante.correo,
      motivo: r.motivo,
      estado: r.estado,
      creadoEn: r.creado_en,
    }));
  }

  async descartarReporte(reporteId: number, moderadorId?: number) {
    const res = await this.prisma.reporteComentario.update({
      where: { id: reporteId },
      data: {
        estado: 'DESCARTADO',
        resuelto_por_id: moderadorId || null,
        resuelto_en: new Date(),
      },
    });
    return { success: true, message: 'Reporte descartado.', data: res };
  }

  async eliminarComentarioReportado(reporteId: number, moderadorId?: number) {
    const reporte = await this.prisma.reporteComentario.findUnique({
      where: { id: reporteId },
    });
    if (!reporte) throw new NotFoundException('Reporte no encontrado.');

    // 1. Ocultar o eliminar contenido del comentario
    await this.prisma.comentario.update({
      where: { id: reporte.comentario_id },
      data: {
        estado: 'ELIMINADO',
        contenido: '[Comentario eliminado por infringir las normas comunitarias de la Facultad]',
      },
    });

    // 2. Marcar reporte como confirmado (resuelto)
    await this.prisma.reporteComentario.update({
      where: { id: reporteId },
      data: {
        estado: 'CONFIRMADO',
        resuelto_por_id: moderadorId || null,
        resuelto_en: new Date(),
      },
    });

    return {
      success: true,
      message: 'Comentario eliminado y reporte resuelto con éxito.',
    };
  }

  // ─── AUDITORÍA DEL SISTEMA ───────────────────────────────────

  async listarAuditoria(limit = 100) {
    const logs = await this.prisma.bitacoraAuditoria.findMany({
      include: {
        usuario: {
          select: { id: true, nombre: true, apellidos: true, correo: true, rol: true },
        },
      },
      orderBy: { creado_en: 'desc' },
      take: limit,
    });

    return logs.map((l) => ({
      id: l.id,
      usuarioId: l.usuario_id,
      usuarioNombre: l.usuario
        ? `${l.usuario.nombre} ${l.usuario.apellidos}`.trim()
        : 'Sistema / Público',
      usuarioRol: l.usuario?.rol?.nombre || 'ANÓNIMO',
      accion: l.accion,
      entidad: l.entidad,
      entidadId: l.entidad_id,
      detalle: l.detalle,
      ip: l.ip,
      creadoEn: l.creado_en,
    }));
  }
}
