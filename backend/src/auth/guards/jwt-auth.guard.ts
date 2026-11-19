import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token de autenticación no proporcionado.');
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido. Debe ser Bearer <token>.');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret:
          process.env.JWT_SECRET ||
          'INFOUAQ_SECRETO_INSTITUCIONAL_2026_TOKEN_KEY',
      });
      request.user = {
        id: payload.sub,
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        carrera_id: payload.carrera_id,
        semestre: payload.semestre,
      };
      return true;
    } catch (err) {
      throw new UnauthorizedException('Token de autenticación expirado o inválido.');
    }
  }
}
