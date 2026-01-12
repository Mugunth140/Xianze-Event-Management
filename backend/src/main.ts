import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { corsConfig, helmetConfig } from './config/security.config';

/**
 * Bootstrap the XIANZE Backend Application
 *
 * Production-ready entry point with security middleware,
 * graceful shutdown handling, and proper logging.
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Security: Helmet middleware (production only, nginx handles in prod)
  if (process.env.NODE_ENV === 'production') {
    app.use(helmet(helmetConfig));
  }

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // CORS configuration
  app.enableCors(corsConfig(configService));

  // Global API prefix
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  const port = configService.get<number>('PORT', 5000);

  // Graceful shutdown handling
  app.enableShutdownHooks();

  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down gracefully...');
    await app.close();
    process.exit(0);
  });

  await app.listen(port);

  logger.log(`🚀 XIANZE Backend running on port ${port}`);
  logger.log(`📊 Health: http://localhost:${port}/health`);
  logger.log(`📡 API: http://localhost:${port}/api`);
  logger.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
