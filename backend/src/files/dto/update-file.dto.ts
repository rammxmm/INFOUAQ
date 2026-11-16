import { IsOptional, IsString, IsIn } from 'class-validator';

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
}
