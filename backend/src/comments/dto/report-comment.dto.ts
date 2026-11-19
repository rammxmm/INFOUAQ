import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportCommentDto {
  @IsString({ message: 'El motivo del reporte debe ser texto.' })
  @IsNotEmpty({ message: 'El motivo del reporte es obligatorio.' })
  motivo: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  reportanteId?: number;

  @IsOptional()
  @IsString()
  reportanteNombre?: string;
}
