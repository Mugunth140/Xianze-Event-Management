import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

/**
 * Database Configuration
 * Environment Variables:
 * - DATABASE_PATH: Path to SQLite file (default: ./data/xianze.db)
 * - DATABASE_LOGGING: Enable SQL logging (default: false)
 * - DATABASE_SYNCHRONIZE: Auto-sync schema (disable in production!)
 */
export const databaseConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'sqlite',
    database: configService.get<string>('DATABASE_PATH', './data/xianze.db'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE', false),
    logging: configService.get<boolean>('DATABASE_LOGGING', false),
  }),
};
