import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryFilesDto {
  @IsOptional()
  @IsString()
  carreraId?: string;

  @IsOptional()
  @IsString()
  materia?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  semestre?: number;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsString()
  busqueda?: string;
}
