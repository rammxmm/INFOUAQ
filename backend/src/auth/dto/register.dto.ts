import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @Matches(/^[^\s@]+@alumnos\.uaq\.mx$/i, {
    message: 'El registro público es exclusivo para estudiantes (@alumnos.uaq.mx).',
  })
  correo: string;

  @IsString({ message: 'La contraseña debe ser texto.' })
  @MinLength(6, { message: 'La contraseña debe contener al menos 6 caracteres.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'Los apellidos son obligatorios.' })
  apellidos: string;

  @IsOptional()
  @IsString()
  carreraClave?: string; // ej. "INF18", "ITIC22"

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(8)
  semestre?: number;
}
