import { Injectable } from '@nestjs/common';

/**
 * Application Service
 *
 * Provides core application functionality.
 * Feature-specific business logic should be in dedicated services.
 */
@Injectable()
export class AppService {
  /**
   * Get application health status
   *
   * Returns current health information for monitoring.
   * Can be extended to include database connectivity, memory usage, etc.
   *
   * @returns Health status object
   */
  getHealth(): { status: string; timestamp: string; version: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    };
  }
}
