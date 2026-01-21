import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('trends')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  getTrends() {
    return this.analyticsService.getRegistrationTrends();
  }

  @Get('registrations')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR, UserRole.MEMBER)
  getRegistrations(
    @Query('event') event: string,
    @Request() req: { user: { role: UserRole; assignedEvent?: string } },
  ) {
    // Members can only see their assigned event
    if (req.user.role === UserRole.MEMBER) {
      return this.analyticsService.getEventBreakdown(req.user.assignedEvent);
    }
    return this.analyticsService.getEventBreakdown(event);
  }

  @Get('recent')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  getRecentRegistrations(@Query('limit') limit?: string) {
    return this.analyticsService.getRecentRegistrations(limit ? parseInt(limit) : 10);
  }

  @Get('payment-stats')
  @Roles(UserRole.ADMIN, UserRole.COORDINATOR)
  getPaymentStats() {
    return this.analyticsService.getPaymentStats();
  }
}
