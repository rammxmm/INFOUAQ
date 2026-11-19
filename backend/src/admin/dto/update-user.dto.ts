import { IsNumber, IsIn, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserRoleDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'El rol_id es obligatorio.' })
  @IsNotEmpty()
  rol_id: number;
}

export class UpdateUserStatusDto {
  @IsIn(['ACTIVA', 'SUSPENDIDA', 'INACTIVA'], {
    message: 'El estado debe ser: ACTIVA, SUSPENDIDA o INACTIVA.',
  })
  @IsNotEmpty()
  estado: 'ACTIVA' | 'SUSPENDIDA' | 'INACTIVA';
}
