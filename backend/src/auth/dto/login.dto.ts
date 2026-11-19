import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  @Matches(/^[^\s@]+@(uaq\.mx|alumnos\.uaq\.mx)$/i, {
    message: 'El correo debe ser institucional (@uaq.mx o @alumnos.uaq.mx).',
  })
  correo: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password: string;
}
