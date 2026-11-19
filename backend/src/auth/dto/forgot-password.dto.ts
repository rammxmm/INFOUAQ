import { IsEmail, Matches } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @Matches(/^[^\s@]+@(uaq\.mx|alumnos\.uaq\.mx)$/i, {
    message: 'El correo debe ser institucional (@uaq.mx o @alumnos.uaq.mx).',
  })
  correo: string;
}
