import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadFileDto {
  @IsString({ message: 'El título debe ser texto.' })
  @IsNotEmpty({ message: 'El título del documento es obligatorio.' })
  titulo: string;

  @IsString({ message: 'La descripción debe ser texto.' })
  @IsOptional()
  descripcion?: string;

  @IsString({ message: 'La carrera debe ser texto.' })
  @IsNotEmpty({ message: 'La carrera relacionada es obligatoria.' })
  carreraId: string;

  @IsString({ message: 'La materia debe ser texto.' })
  @IsNotEmpty({ message: 'La materia relacionada es obligatoria.' })
  materia: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El semestre debe ser un valor numérico.' })
  @Min(1, { message: 'El semestre mínimo es 1.' })
  @Max(8, { message: 'El semestre máximo es 8.' })
  semestre: number;

  @IsString({ message: 'La categoría debe ser texto.' })
  @IsIn(['Guías', 'Apuntes', 'Prácticas', 'Proyectos'], {
    message: 'La categoría debe ser: Guías, Apuntes, Prácticas o Proyectos.',
  })
  categoria: string;

  @IsString()
  @IsOptional()
  autorNombre?: string;

  @IsString()
  @IsOptional()
  autorRol?: string;
}
