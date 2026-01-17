import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContactModule } from './modules/contact/contact.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { UsersModule } from './modules/users/users.module';

/**
 * Root Application Module
 *
 * Production-ready module:
 * - ConfigModule: Environment variable management
 * - TypeOrmModule: Database connection (SQLite)
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Database connection
    TypeOrmModule.forRootAsync(databaseConfig),

    // Feature modules
    AuthModule,
    UsersModule,
    ContactModule,
    RegistrationModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
