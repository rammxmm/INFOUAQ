import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = Number(process.env.PORT) || configService.get<number>('PORT', 3000);
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:4200');

  // Prefijo global para la API REST
  app.setGlobalPrefix('api');

  // Filtro de excepciones global estructurado
  app.useGlobalFilters(new AllExceptionsFilter());

  // Validación y transformación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de CORS para comunicar con Angular
  app.enableCors({
    origin: [
      corsOrigin,
      'http://localhost:4200',
      'http://127.0.0.1:4200',
      'https://infouaq.beer',
      'http://infouaq.beer',
      'https://www.infouaq.beer',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`====================================================`);
  logger.log(`  INFOUAQ Backend en ejecución: http://localhost:${port}/api`);
  logger.log(`  Health Check: http://localhost:${port}/api/health`);
  logger.log(`  CORS permitido para: ${corsOrigin}`);
  logger.log(`====================================================`);
}

bootstrap();
