import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { throttlerConfig } from './config/security.config';
import { ContactModule } from './modules/contact/contact.module';
import { RegistrationModule } from './modules/registration/registration.module';

/**
 * Root Application Module
 *
 * Production-ready module with security features:
 * - ConfigModule: Environment variable management
 * - TypeOrmModule: Database connection (SQLite)
 * - ThrottlerModule: Rate limiting
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync(throttlerConfig),

    // Database connection
    TypeOrmModule.forRootAsync(databaseConfig),

    // Feature modules
    ContactModule,
    RegistrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
