import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCommentDto {
  @IsString({ message: 'El contenido del comentario debe ser texto.' })
  @IsNotEmpty({ message: 'El comentario no puede estar vacío.' })
  contenido: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del comentario padre debe ser numérico.' })
  padreId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  autorId?: number;

  @IsOptional()
  @IsString()
  autorNombre?: string;

  @IsOptional()
  @IsString()
  autorRol?: string;

  @IsOptional()
  @IsString()
  autorExpediente?: string;
}
