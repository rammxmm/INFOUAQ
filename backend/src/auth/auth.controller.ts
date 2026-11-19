import { Controller, Post, Get, Body, Query, ParseIntPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inicio de sesión institucional
   * POST /api/auth/login
   */
  @Post('login')
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
   * Consulta del perfil autenticado
   * GET /api/auth/me
   */
  @Get('me')
  async me(@Query('userId', ParseIntPipe) userId: number) {
    const user = await this.authService.getProfile(userId);
    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }
}
