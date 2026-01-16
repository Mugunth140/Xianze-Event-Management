import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerAsyncOptions, ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Security Configuration
 *
 * Centralized security settings for production deployment.
 * Environment Variables:
 * - RATE_LIMIT_TTL: Time window in seconds (default: 60)
 * - RATE_LIMIT_MAX: Max requests per window (default: 100)
 * - CORS_ORIGIN: Allowed origin for CORS (default: *)
 */

export const throttlerConfig: ThrottlerAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
    throttlers: [
      {
        name: 'default',
        ttl: config.get<number>('RATE_LIMIT_TTL', 60) * 1000,
        limit: config.get<number>('RATE_LIMIT_MAX', 100),
      },
    ],
  }),
};

export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for compatibility
};

export const corsConfig = (configService: ConfigService) => ({
  origin: configService.get<string>('CORS_ORIGIN', '*'),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
});
