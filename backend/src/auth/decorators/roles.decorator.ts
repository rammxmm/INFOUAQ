import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('ESTUDIANTE' | 'PROFESOR' | 'ADMINISTRADOR')[]) =>
  SetMetadata(ROLES_KEY, roles);
