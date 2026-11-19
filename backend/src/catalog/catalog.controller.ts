import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  /**
   * GET /api/catalog/carreras
   * Lista las 7 carreras oficiales de la FIF
   */
  @Get('carreras')
  async getCarreras() {
    const data = await this.catalogService.getCarreras();
    return {
      success: true,
      total: data.length,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/catalog/areas
   * Lista las 12 áreas de conocimiento oficiales
   */
  @Get('areas')
  async getAreas() {
    const data = await this.catalogService.getAreas();
    return {
      success: true,
      total: data.length,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/catalog/materias
   * Filtra materias por ?carrera=INF18&semestre=6&areaId=8&q=texto
   */
  @Get('materias')
  async getMaterias(
    @Query('carrera') carrera?: string,
    @Query('semestre') semestre?: string,
    @Query('areaId') areaId?: string,
    @Query('q') q?: string,
  ) {
    const sem = semestre ? parseInt(semestre, 10) : undefined;
    const aId = areaId ? parseInt(areaId, 10) : undefined;
    const data = await this.catalogService.getMaterias({
      carrera,
      semestre: sem,
      areaId: aId,
      q,
    });
    return {
      success: true,
      total: data.length,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * GET /api/catalog/materias/:id
   * Detalle completo de la materia con docentes asignados y carpetas
   */
  @Get('materias/:id')
  async getMateriaById(@Param('id', ParseIntPipe) id: number) {
    const data = await this.catalogService.getMateriaById(id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
