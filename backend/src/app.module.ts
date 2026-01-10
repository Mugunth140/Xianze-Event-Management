import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { ContactModule } from './modules/contact/contact.module';
import { RegistrationModule } from './modules/registration/registration.module';

/**
 * Root Application Module
 *
 * This is the main module that bootstraps the entire application.
 * It imports core modules and will be extended with feature modules.
 *
 * Current modules:
 * - ConfigModule: Environment variable management
 * - TypeOrmModule: Database connection (SQLite)
 *
 * To add new features, create modules in src/modules/ and import them here.
 */
@Module({
  imports: [
    // Global configuration from environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Database connection using TypeORM
    TypeOrmModule.forRootAsync(databaseConfig),

    // =================================================================
    // FEATURE MODULES
    // =================================================================
    ContactModule,
    RegistrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
