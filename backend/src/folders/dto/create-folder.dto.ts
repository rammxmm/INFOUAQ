import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFolderDto {
  @IsString({ message: 'El nombre de la carpeta debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre de la carpeta es obligatorio.' })
  nombre: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'El ID de la materia debe ser numérico.' })
  materiaId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  padreId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  propietarioId?: number;
}
