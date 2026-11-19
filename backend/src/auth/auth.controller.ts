import { Controller, Post, Get, Body, Query, ParseIntPipe, HttpStatus, HttpCode, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Inicio de sesión institucional
   * POST /api/auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    const res = await this.authService.login(dto);
    return {
      success: true,
      data: res,
      message: 'Autenticación institucional exitosa.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Registro público de estudiantes UAQ
   * POST /api/auth/register
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const res = await this.authService.register(dto);
    return {
      success: true,
      data: res,
      message: 'Cuenta de estudiante creada con éxito.',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Solicitud de recuperación de contraseña institucional
   * POST /api/auth/forgot-password
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const res = await this.authService.forgotPassword(dto);
    return {
      success: true,
      data: res,
      message: res.mensaje,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Restablecimiento de contraseña con token
   * POST /api/auth/reset-password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const res = await this.authService.resetPassword(dto);
    return {
      success: true,
      data: res,
      message: res.mensaje,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Consulta del perfil autenticado
   * GET /api/auth/me  — Lee el userId del Bearer token JWT
   */
  @Get('me')
  async me(@Req() req: Request) {
    // Extraer token del header Authorization: Bearer <token>
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new UnauthorizedException('Token de acceso requerido.');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    const userId = payload.sub;
    const user = await this.authService.getProfile(userId);
    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }
}
