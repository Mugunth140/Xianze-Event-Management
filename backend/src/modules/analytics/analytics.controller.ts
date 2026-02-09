import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { User, UserRole, UserTask, userHasTask } from '../users/user.entity';
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
    @Request() req: { user: User },
    @Query('event') event?: string,
    @Query('paymentMode') paymentMode?: string,
  ) {
    const user = req.user;

    // If user has verify_payment task, they can see all registrations
    if (userHasTask(user, UserTask.VERIFY_PAYMENT)) {
      return this.analyticsService.getEventBreakdown(event, paymentMode);
    }

    // Members without verify_payment can only see their assigned event
    if (user.role === UserRole.MEMBER) {
      return this.analyticsService.getEventBreakdown(user.assignedEvent ?? undefined, paymentMode);
    }

    // Coordinators without verify_payment can only see their assigned event
    if (user.role === UserRole.COORDINATOR) {
      return this.analyticsService.getEventBreakdown(user.assignedEvent ?? undefined, paymentMode);
    }

    return this.analyticsService.getEventBreakdown(event, paymentMode);
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
