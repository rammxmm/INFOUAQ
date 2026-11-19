import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Helper: formatea el perfil de usuario para ser consumido directamente por Angular
   */
  private formatUserProfile(user: any) {
    const roleName = user.rol?.nombre?.toUpperCase() || 'ESTUDIANTE';
    const expediente =
      roleName === 'PROFESOR'
        ? `DOC-${1000 + user.id}`
        : roleName === 'ADMINISTRADOR'
        ? `ADM-${String(user.id).padStart(4, '0')}`
        : `${298400 + user.id}`;

    const carreraOrDept = user.carrera
      ? user.carrera.nombre
      : roleName === 'PROFESOR'
      ? 'Área de Ciencias de la Computación'
      : roleName === 'ADMINISTRADOR'
      ? 'Coordinación Administrativa y Sistemas'
      : 'Facultad de Informática UAQ';

    const semestreOrCargo = user.semestre
      ? `${user.semestre}° Semestre`
      : roleName === 'PROFESOR'
      ? 'Profesor Titular de Asignatura'
      : 'Administrador de Plataforma INFOUAQ';

    return {
      id: user.id,
      name: `${user.nombre} ${user.apellidos}`.trim(),
      initials: `${user.nombre?.[0] || ''}${user.apellidos?.[0] || ''}`.toUpperCase(),
      role: roleName,
      expediente,
      email: user.correo,
      carreraId: user.carrera_id,
      carreraClave: user.carrera?.clave || null,
      carreraOrDept,
      semestre: user.semestre,
      semestreOrCargo,
      campus: 'Centro Universitario UAQ',
    };
  }

  /**
   * Inicia sesión con correo institucional y contraseña
   */
  async login(dto: LoginDto) {
    const emailLimpio = dto.correo.trim().toLowerCase();

    // 1. Buscar usuario por correo institucional
    const user = await this.prisma.usuario.findFirst({
      where: { correo: { equals: emailLimpio, mode: 'insensitive' } },
      include: { rol: true, carrera: true },
    });

    if (!user) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    // 2. Verificar estado de la cuenta
    if (user.estado !== 'ACTIVA') {
      throw new UnauthorizedException(
        `Tu cuenta institucional se encuentra en estado "${user.estado}". Acércate a la coordinación.`,
      );
    }

    // 3. Comparar contraseña con el hash de bcrypt
    const passwordValido = bcrypt.compareSync(dto.password, user.password_hash);
    if (!passwordValido) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    // 4. Actualizar fecha de último acceso
    await this.prisma.usuario.update({
      where: { id: user.id },
      data: { ultimo_acceso: new Date() },
    });

    const userProfile = this.formatUserProfile(user);

    // 5. Generar token JWT con claims requeridos
    const payload = {
      sub: user.id,
      email: user.correo,
      name: `${user.nombre} ${user.apellidos}`,
      role: userProfile.role,
      expediente: userProfile.expediente,
      carrera_id: user.carrera_id,
      semestre: user.semestre,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Inicio de sesión exitoso: ${user.correo} (${userProfile.role})`);

    return {
      accessToken,
      access_token: accessToken,
      user: userProfile,
    };
  }

  /**
   * Registro público exclusivo para estudiantes (@alumnos.uaq.mx)
   */
  async register(dto: RegisterDto) {
    const emailLimpio = dto.correo.trim().toLowerCase();

    // 1. Validar unicidad de correo
    const existe = await this.prisma.usuario.findFirst({
      where: { correo: { equals: emailLimpio, mode: 'insensitive' } },
    });

    if (existe) {
      throw new BadRequestException('El correo institucional ya se encuentra registrado.');
    }

    // 2. Resolver carrera (por ID o por Clave)
    let carreraId = dto.carreraId || null;
    if (!carreraId && dto.carreraClave) {
      const carrera = await this.prisma.carrera.findUnique({
        where: { clave: dto.carreraClave.trim().toUpperCase() },
      });
      if (carrera) carreraId = carrera.id;
    }

    // 3. Hashear contraseña con bcrypt
    const passwordHash = bcrypt.hashSync(dto.password, 10);

    // 4. Crear el usuario en la tabla "usuarios" con rol ESTUDIANTE (id: 1)
    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        correo: emailLimpio,
        password_hash: passwordHash,
        nombre: dto.nombre.trim(),
        apellidos: dto.apellidos.trim(),
        rol_id: 1, // ESTUDIANTE
        carrera_id: carreraId,
        semestre: dto.semestre || 1,
        estado: 'ACTIVA',
      },
      include: { rol: true, carrera: true },
    });

    const userProfile = this.formatUserProfile(nuevoUsuario);

    // 5. Generar token JWT
    const payload = {
      sub: nuevoUsuario.id,
      email: nuevoUsuario.correo,
      name: `${nuevoUsuario.nombre} ${nuevoUsuario.apellidos}`,
      role: userProfile.role,
      expediente: dto.expediente || userProfile.expediente,
      carrera_id: nuevoUsuario.carrera_id,
      semestre: nuevoUsuario.semestre,
    };

    const accessToken = this.jwtService.sign(payload);

    this.logger.log(`Nuevo estudiante registrado: ${nuevoUsuario.correo} (${dto.expediente})`);

    return {
      accessToken,
      access_token: accessToken,
      user: userProfile,
    };
  }

  /**
   * Solicitud de recuperación de contraseña: crea un token en tokens_recuperacion
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const emailLimpio = dto.correo.trim().toLowerCase();
    const user = await this.prisma.usuario.findFirst({
      where: { correo: { equals: emailLimpio, mode: 'insensitive' } },
    });

    if (!user) {
      // Por seguridad en APIs, no confirmamos si el correo existe o no
      return {
        mensaje: 'Si el correo está registrado, se ha generado el enlace de recuperación.',
      };
    }

    // Generar token único con expiración de 1 hora
    const tokenHash = uuidv4().replace(/-/g, '').slice(0, 32);
    const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.prisma.tokenRecuperacion.create({
      data: {
        usuario_id: user.id,
        token_hash: tokenHash,
        expira_en: expiraEn,
      },
    });

    this.logger.log(`Token de recuperación generado para ${user.correo}: ${tokenHash}`);

    return {
      mensaje: 'Instrucciones enviadas al correo institucional.',
      token: tokenHash, // Disponible en respuesta para pruebas en desarrollo
    };
  }

  /**
   * Restablecimiento de contraseña validando token
   */
  async resetPassword(dto: ResetPasswordDto) {
    const tokenReg = await this.prisma.tokenRecuperacion.findUnique({
      where: { token_hash: dto.token },
      include: { usuario: true },
    });

    if (!tokenReg || tokenReg.usado_en) {
      throw new BadRequestException('El enlace de recuperación es inválido o ya ha sido utilizado.');
    }

    if (new Date() > tokenReg.expira_en) {
      throw new BadRequestException('El enlace de recuperación ha expirado.');
    }

    // Hashear nueva contraseña
    const nuevoHash = bcrypt.hashSync(dto.nuevaPassword, 10);

    // Actualizar contraseña del usuario y marcar token como usado
    await this.prisma.usuario.update({
      where: { id: tokenReg.usuario_id },
      data: { password_hash: nuevoHash },
    });

    await this.prisma.tokenRecuperacion.update({
      where: { id: tokenReg.id },
      data: { usado_en: new Date() },
    });

    this.logger.log(`Contraseña restablecida con éxito para usuario ${tokenReg.usuario_id}`);

    return {
      mensaje: 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.',
    };
  }

  /**
   * Obtiene la información del perfil del usuario autenticado
   */
  async getProfile(userId: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: { rol: true, carrera: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return this.formatUserProfile(user);
  }
}
