import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignTeacherDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El ID del profesor es obligatorio.' })
  profesor_id: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  periodo_id?: number;
}
