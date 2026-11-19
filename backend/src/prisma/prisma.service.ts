import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService: envuelve PrismaClient para integrarse con el ciclo de vida
 * de los módulos de NestJS.
 *
 * - onModuleInit  → conecta a PostgreSQL cuando el módulo arranca
 * - onModuleDestroy → cierra la conexión limpiamente cuando la app se detiene
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['warn', 'error'], // En desarrollo puedes agregar 'query' para depurar SQL
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexión a PostgreSQL establecida.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Conexión a PostgreSQL cerrada.');
  }
}
