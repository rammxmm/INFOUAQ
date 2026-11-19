import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFolderDto {
  @IsString({ message: 'El nombre de la carpeta debe ser texto.' })
  @IsNotEmpty({ message: 'El nombre de la carpeta es obligatorio.' })
  nombre: string;
}
