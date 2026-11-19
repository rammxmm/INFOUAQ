import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'El token de recuperación es obligatorio.' })
  @IsNotEmpty({ message: 'El token de recuperación no puede estar vacío.' })
  token: string;

  @IsString({ message: 'La nueva contraseña debe ser texto.' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres.' })
  nuevaPassword: string;
}
