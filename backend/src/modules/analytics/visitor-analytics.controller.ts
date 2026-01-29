import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/user.entity';
import { TrackPageViewDto, UpdateDurationDto } from './dto';
import { VisitorAnalyticsService } from './visitor-analytics.service';

@Controller('analytics/visitors')
export class VisitorAnalyticsController {
  constructor(private readonly visitorAnalyticsService: VisitorAnalyticsService) {}

  /**
   * Track a page view - public endpoint with rate limiting
   * This is called from the frontend tracker component
   */
  @Post('track')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 requests per minute
  async trackPageView(@Body() dto: TrackPageViewDto) {
    await this.visitorAnalyticsService.trackPageView(dto);
    return { success: true };
  }

  /**
   * Update page view duration - public endpoint
   * Called when user leaves the page
   */
  @Post('duration')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async updateDuration(@Body() dto: UpdateDurationDto) {
    await this.visitorAnalyticsService.updateDuration(dto);
    return { success: true };
  }

  // ============================================
  // ADMIN-ONLY ENDPOINTS BELOW
  // ============================================

  /**
   * Get complete dashboard data
   */
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDashboard(@Query('period') period?: string) {
    return this.visitorAnalyticsService.getDashboardData(period || '30d');
  }

  /**
   * Get visitor statistics
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStats(@Query('period') period?: string) {
    return this.visitorAnalyticsService.getVisitorStats(period || '30d');
  }

  /**
   * Get top pages
   */
  @Get('top-pages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getTopPages(@Query('period') period?: string, @Query('limit') limit?: string) {
    return this.visitorAnalyticsService.getTopPages(period || '30d', limit ? parseInt(limit) : 10);
  }

  /**
   * Get traffic sources
   */
  @Get('traffic-sources')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getTrafficSources(@Query('period') period?: string) {
    return this.visitorAnalyticsService.getTrafficSources(period || '30d');
  }

  /**
   * Get device breakdown
   */
  @Get('devices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDevices(@Query('period') period?: string) {
    return this.visitorAnalyticsService.getDeviceBreakdown(period || '30d');
  }

  /**
   * Get browser breakdown
   */
  @Get('browsers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getBrowsers(@Query('period') period?: string) {
    return this.visitorAnalyticsService.getBrowserBreakdown(period || '30d');
  }

  /**
   * Get daily statistics for charts
   */
  @Get('daily')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getDailyStats(@Query('period') period?: string) {
    return this.visitorAnalyticsService.getDailyStats(period || '30d');
  }

  /**
   * Get real-time visitors (last 5 minutes)
   */
  @Get('realtime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @SkipThrottle()
  async getRealTimeVisitors() {
    return {
      activeVisitors: await this.visitorAnalyticsService.getRealTimeVisitors(),
    };
  }

  /**
   * Get recent page views for live feed
   */
  @Get('recent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRecentPageViews(@Query('limit') limit?: string) {
    return this.visitorAnalyticsService.getRecentPageViews(limit ? parseInt(limit) : 20);
  }
}
