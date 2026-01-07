import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Application Controller
 *
 * Handles root-level routes including health checks.
 * This controller should remain minimal - feature routes belong in their own modules.
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health Check Endpoint
   *
   * Used by Docker health checks and load balancers to verify
   * the application is running and responsive.
   *
   * @returns Health status object
   */
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
