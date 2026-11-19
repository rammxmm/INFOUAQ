import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMateriaDto {
  @IsString({ message: 'La clave de materia es obligatoria.' })
  @IsNotEmpty()
  clave: string;

  @IsString({ message: 'El nombre de la materia es obligatorio.' })
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  creditos?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  area_id?: number;

  @IsArray()
  @IsOptional()
  carreras?: { carrera_id: number; semestre: number }[];
}

export class UpdateMateriaDto {
  @IsString()
  @IsOptional()
  clave?: string;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  creditos?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  area_id?: number;

  @IsOptional()
  activa?: boolean;
}
