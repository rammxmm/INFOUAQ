import { IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class LikeCommentDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usuarioId?: number;
}
