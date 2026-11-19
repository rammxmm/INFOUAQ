import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateCommentDto {
  @IsString({ message: 'El contenido debe ser texto.' })
  @IsNotEmpty({ message: 'El contenido no puede estar vacío.' })
  contenido: string;
}
