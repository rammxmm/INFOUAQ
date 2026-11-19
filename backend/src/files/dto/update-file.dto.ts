import { IsOptional, IsString, IsIn, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateFileDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser texto.' })
  titulo?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser texto.' })
  descripcion?: string;

  @IsOptional()
  @IsIn(['Guías', 'Apuntes', 'Prácticas', 'Proyectos'], {
    message: 'La categoría debe ser: Guías, Apuntes, Prácticas o Proyectos.',
  })
  categoria?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El parcial debe ser 1, 2 o 3.' })
  @Min(1)
  @Max(3)
  parcial?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la carpeta debe ser un número.' })
  carpeta_id?: number;
}
