import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: number;
  userId: number;
  email: string;
  name: string;
  role: string;
  carrera_id?: number;
  semestre?: number;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUserPayload | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
  },
);
