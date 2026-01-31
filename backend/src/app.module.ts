import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContactModule } from './modules/contact/contact.module';
import { BugSmashModule } from './modules/events/bug-smash/bug-smash.module';
import { BuildathonModule } from './modules/events/buildathon/buildathon.module';
import { CtrlQuizModule } from './modules/events/ctrl-quiz/ctrl-quiz.module';
import { PaperPresentationModule } from './modules/events/paper-presentation/paper-presentation.module';
import { ThinkLinkModule } from './modules/events/think-link/think-link.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';

/**
 * Root Application Module
 *
 * Production-ready module:
 * - ConfigModule: Environment variable management
 * - TypeOrmModule: Database connection (SQLite)
 * - ThrottlerModule: Rate limiting for load protection
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting - protects against abuse and high load
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            // Default: 100 requests per minute per IP
            ttl: (config.get<number>('RATE_LIMIT_TTL') || 60) * 1000,
            limit: config.get<number>('RATE_LIMIT_MAX') || 100,
          },
        ],
      }),
    }),

    // Database connection
    TypeOrmModule.forRootAsync(databaseConfig),

    // Feature modules
    AuthModule,
    UsersModule,
    ContactModule,
    RegistrationModule,
    AnalyticsModule,
    SettingsModule,
    PaperPresentationModule,
    ThinkLinkModule,
    BugSmashModule,
    CtrlQuizModule,
    BuildathonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
