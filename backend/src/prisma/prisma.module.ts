import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule: módulo global que provee PrismaService a todos los módulos
 * del backend sin necesidad de importarlo individualmente en cada uno.
 *
 * Al ser @Global(), basta con importarlo una sola vez en AppModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
