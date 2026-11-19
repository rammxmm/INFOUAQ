import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { CreateMateriaDto, UpdateMateriaDto } from './dto/create-materia.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { UpdateUserRoleDto, UpdateUserStatusDto } from './dto/update-user.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── MATERIAS Y ASIGNACIONES ─────────────────────────────────

  @Post('materias')
  async crearMateria(@Body() dto: CreateMateriaDto) {
    const data = await this.adminService.crearMateria(dto);
    return {
      success: true,
      data,
      message: 'Materia registrada exitosamente en el catálogo oficial.',
    };
  }

  @Patch('materias/:id')
  async actualizarMateria(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMateriaDto,
  ) {
    const data = await this.adminService.actualizarMateria(id, dto);
    return {
      success: true,
      data,
      message: 'Materia actualizada exitosamente.',
    };
  }

  @Delete('materias/:id')
  async eliminarMateria(@Param('id', ParseIntPipe) id: number) {
    const data = await this.adminService.eliminarMateria(id);
    return {
      success: true,
      data,
      message: 'Materia desactivada del catálogo.',
    };
  }

  @Post('materias/:id/profesores')
  async asignarProfesor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignTeacherDto,
  ) {
    const data = await this.adminService.asignarProfesor(id, dto);
    return {
      success: true,
      data,
      message: 'Docente asignado a la materia con éxito.',
    };
  }

  @Delete('materias/:id/profesores/:profesorId')
  async eliminarAsignacionProfesor(
    @Param('id', ParseIntPipe) id: number,
    @Param('profesorId', ParseIntPipe) profesorId: number,
    @Query('periodoId') periodoId?: string,
  ) {
    const pid = periodoId ? parseInt(periodoId, 10) : undefined;
    const res = await this.adminService.eliminarAsignacionProfesor(id, profesorId, pid);
    return res;
  }

  // ─── USUARIOS INSTITUCIONALES ────────────────────────────────

  @Get('usuarios')
  async listarUsuarios(
    @Query('rolId') rolId?: string,
    @Query('estado') estado?: string,
    @Query('carreraId') carreraId?: string,
    @Query('busqueda') busqueda?: string,
  ) {
    const usuarios = await this.adminService.listarUsuarios({
      rol_id: rolId ? parseInt(rolId, 10) : undefined,
      estado,
      carrera_id: carreraId ? parseInt(carreraId, 10) : undefined,
      busqueda,
    });
    return {
      success: true,
      total: usuarios.length,
      data: usuarios,
    };
  }

  @Patch('usuarios/:id/rol')
  async actualizarRolUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const data = await this.adminService.actualizarRolUsuario(id, dto.rol_id);
    return {
      success: true,
      data,
      message: data.message,
    };
  }

  @Patch('usuarios/:id/estado')
  async actualizarEstadoUsuario(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const data = await this.adminService.actualizarEstadoUsuario(id, dto.estado);
    return {
      success: true,
      data,
      message: data.message,
    };
  }

  // ─── MODERACIÓN DE REPORTES ──────────────────────────────────

  @Get('reportes')
  async listarReportes(@Query('estado') estado?: string) {
    const data = await this.adminService.listarReportes(estado);
    return {
      success: true,
      total: data.length,
      data,
    };
  }

  @Patch('reportes/:id/descartar')
  async descartarReporte(
    @Param('id', ParseIntPipe) id: number,
    @Body('moderadorId') moderadorId?: number,
  ) {
    const res = await this.adminService.descartarReporte(id, moderadorId);
    return res;
  }

  @Delete('reportes/:id/eliminar-comentario')
  async eliminarComentarioReportado(
    @Param('id', ParseIntPipe) id: number,
    @Body('moderadorId') moderadorId?: number,
  ) {
    const res = await this.adminService.eliminarComentarioReportado(id, moderadorId);
    return res;
  }

  // ─── AUDITORÍA ───────────────────────────────────────────────

  @Get('auditoria')
  async listarAuditoria(@Query('limit') limit?: string) {
    const l = limit ? parseInt(limit, 10) : 100;
    const data = await this.adminService.listarAuditoria(l);
    return {
      success: true,
      total: data.length,
      data,
    };
  }
}
