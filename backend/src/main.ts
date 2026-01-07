import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Bootstrap the XIANZE Backend Application
 *
 * This is the entry point for the NestJS application.
 * It sets up global pipes, CORS, and starts the HTTP server.
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unknown properties
      transform: true, // Auto-transform payloads to DTO instances
    }),
  );

  // Enable CORS for frontend communication
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api', {
    exclude: ['health'], // Health check at root level
  });

  const port = process.env.PORT || 5000;
  await app.listen(port);

  logger.log(`🚀 XIANZE Backend is running on: http://localhost:${port}`);
  logger.log(`📊 Health check available at: http://localhost:${port}/health`);
  logger.log(`📡 API routes available at: http://localhost:${port}/api`);
}

bootstrap();
