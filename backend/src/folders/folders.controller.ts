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
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  /**
   * GET /api/folders?materiaId=:id
   * Lista carpetas y subcarpetas de una materia agrupadas por docente
   */
  @Get()
  async getFoldersByMateria(@Query('materiaId', ParseIntPipe) materiaId: number) {
    const data = await this.foldersService.getFoldersByMateria(materiaId);
    return {
      success: true,
      total: data.length,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * POST /api/folders
   * Crea una carpeta o subcarpeta dentro de una materia
   */
  @Post()
  async createFolder(@Body() dto: CreateFolderDto) {
    const data = await this.foldersService.createFolder(dto);
    return {
      success: true,
      data,
      message: 'Carpeta académica creada con éxito.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * PATCH /api/folders/:id
   * Renombra una carpeta
   */
  @Patch(':id')
  async updateFolder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFolderDto,
    @Query('usuarioId') usuarioId?: string,
  ) {
    const uid = usuarioId ? parseInt(usuarioId, 10) : undefined;
    const data = await this.foldersService.updateFolder(id, dto, uid);
    return {
      success: true,
      data,
      message: 'Carpeta renombrada con éxito.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * DELETE /api/folders/:id
   * Elimina una carpeta
   */
  @Delete(':id')
  async deleteFolder(
    @Param('id', ParseIntPipe) id: number,
    @Query('usuarioId') usuarioId?: string,
  ) {
    const uid = usuarioId ? parseInt(usuarioId, 10) : undefined;
    const data = await this.foldersService.deleteFolder(id, uid);
    return {
      success: true,
      message: data.mensaje,
      timestamp: new Date().toISOString(),
    };
  }
}
