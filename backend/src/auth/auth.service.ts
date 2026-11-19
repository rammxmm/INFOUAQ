import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
    const roleName = user.rol?.nombre || 'Estudiante';
    const expediente =
      roleName === 'Profesor'
        ? `DOC-${1000 + user.id}`
        : roleName === 'Administrador'
        ? `ADM-${String(user.id).padStart(4, '0')}`
        : `${298400 + user.id}`;

    const carreraOrDept = user.carrera
      ? user.carrera.nombre
      : roleName === 'Profesor'
      ? 'Área de Ciencias de la Computación'
      : roleName === 'Administrador'
      ? 'Coordinación Administrativa y Sistemas'
      : 'Facultad de Informática UAQ';

    const semestreOrCargo = user.semestre
      ? `${user.semestre}° Semestre`
      : roleName === 'Profesor'
      ? 'Profesor Titular de Asignatura'
      : 'Administrador de Plataforma INFOUAQ';

    return {
      id: user.id,
      name: `${user.nombre} ${user.apellidos}`.trim(),
      initials: `${user.nombre?.[0] || ''}${user.apellidos?.[0] || ''}`.toUpperCase(),
      role: roleName,
      expediente,
      email: user.correo,
      carreraOrDept,
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

    // 5. Generar token JWT
    const payload = {
      sub: user.id,
      email: user.correo,
      name: `${user.nombre} ${user.apellidos}`,
      role: user.rol.nombre,
      expediente: `${298400 + user.id}`,
    };

    const accessToken = this.jwtService.sign(payload);
    const userProfile = this.formatUserProfile(user);

    this.logger.log(`Inicio de sesión exitoso: ${user.correo} (${user.rol.nombre})`);

    return {
      accessToken,
      user: userProfile,
    };
  }

  /**
   * Registro público de nuevos estudiantes UAQ
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

    // 2. Resolver carrera si se proporcionó clave
    let carreraId: number | null = null;
    if (dto.carreraClave) {
      const carrera = await this.prisma.carrera.findUnique({
        where: { clave: dto.carreraClave.trim().toUpperCase() },
      });
      if (carrera) carreraId = carrera.id;
    }

    // 3. Hashear contraseña
    const passwordHash = bcrypt.hashSync(dto.password, 10);

    // 4. Crear el usuario estudiante en la tabla "usuarios"
    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        correo: emailLimpio,
        password_hash: passwordHash,
        nombre: dto.nombre.trim(),
        apellidos: dto.apellidos.trim(),
        rol_id: 1, // Rol Estudiante
        carrera_id: carreraId,
        semestre: dto.semestre || 1,
        estado: 'ACTIVA',
      },
      include: { rol: true, carrera: true },
    });

    // 5. Generar token JWT
    const payload = {
      sub: nuevoUsuario.id,
      email: nuevoUsuario.correo,
      name: `${nuevoUsuario.nombre} ${nuevoUsuario.apellidos}`,
      role: nuevoUsuario.rol.nombre,
    };

    const accessToken = this.jwtService.sign(payload);
    const userProfile = this.formatUserProfile(nuevoUsuario);

    this.logger.log(`Nuevo estudiante registrado: ${nuevoUsuario.correo}`);

    return {
      accessToken,
      user: userProfile,
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
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    return this.formatUserProfile(user);
  }
}
