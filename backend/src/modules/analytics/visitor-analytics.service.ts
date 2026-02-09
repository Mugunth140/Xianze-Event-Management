import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackPageViewDto, UpdateDurationDto } from './dto';
import { PageView, Visitor } from './entities';
import {
  BrowserBreakdown,
  DailyStats,
  DeviceBreakdown,
  TopPage,
  TrafficSource,
  VisitorStats,
} from './types';

interface DateRange {
  start: Date;
  end: Date;
}

@Injectable()
export class VisitorAnalyticsService {
  private readonly logger = new Logger(VisitorAnalyticsService.name);

  constructor(
    @InjectRepository(PageView)
    private readonly pageViewRepository: Repository<PageView>,
    @InjectRepository(Visitor)
    private readonly visitorRepository: Repository<Visitor>,
  ) {}

  /**
   * Track a page view
   */
  async trackPageView(dto: TrackPageViewDto): Promise<PageView> {
    // Create page view record
    const pageView = this.pageViewRepository.create({
      visitorId: dto.visitorId,
      sessionId: dto.sessionId,
      path: dto.path,
      referrer: dto.referrer,
      userAgent: dto.userAgent,
      browser: dto.browser,
      os: dto.os,
      deviceType: dto.deviceType,
      screenResolution: dto.screenResolution,
      language: dto.language,
    });

    const savedPageView = await this.pageViewRepository.save(pageView);

    // Update or create visitor record
    await this.updateVisitor(dto);

    return savedPageView;
  }

  /**
   * Update visitor record
   */
  private async updateVisitor(dto: TrackPageViewDto): Promise<void> {
    try {
      const existingVisitor = await this.visitorRepository.findOne({
        where: { visitorId: dto.visitorId },
      });

      if (existingVisitor) {
        const previousLastVisit = existingVisitor.lastVisit;
        const now = new Date();

        // Check if this is a new session (more than 30 minutes since last visit)
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes
        if (now.getTime() - previousLastVisit.getTime() > sessionTimeout) {
          existingVisitor.totalVisits += 1;
        }

        // Update existing visitor
        existingVisitor.lastVisit = now;
        existingVisitor.totalPageViews += 1;

        // Update device info if provided
        if (dto.browser) existingVisitor.browser = dto.browser;
        if (dto.os) existingVisitor.os = dto.os;
        if (dto.deviceType) existingVisitor.deviceType = dto.deviceType;

        await this.visitorRepository.save(existingVisitor);
      } else {
        // Create new visitor
        const visitor = this.visitorRepository.create({
          visitorId: dto.visitorId,
          firstVisit: new Date(),
          lastVisit: new Date(),
          totalVisits: 1,
          totalPageViews: 1,
          browser: dto.browser,
          os: dto.os,
          deviceType: dto.deviceType,
        });

        await this.visitorRepository.save(visitor);
      }
    } catch (error) {
      // Log but don't fail the page view tracking
      this.logger.warn(`Failed to update visitor: ${error.message}`);
    }
  }

  /**
   * Update page view duration
   */
  async updateDuration(dto: UpdateDurationDto): Promise<void> {
    const latest = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.id', 'id')
      .where('pv.visitorId = :visitorId', { visitorId: dto.visitorId })
      .andWhere('pv.sessionId = :sessionId', { sessionId: dto.sessionId })
      .andWhere('pv.path = :path', { path: dto.path })
      .orderBy('pv.createdAt', 'DESC')
      .limit(1)
      .getRawOne();

    if (!latest?.id) return;

    await this.pageViewRepository.update({ id: latest.id }, { duration: dto.duration });
  }

  /**
   * Get date range for queries
   */
  private getDateRange(period: string): DateRange {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 30);
    }

    return { start, end };
  }

  /**
   * Get visitor statistics overview
   */
  async getVisitorStats(period = '30d'): Promise<VisitorStats> {
    const { start, end } = this.getDateRange(period);

    // Total unique visitors in period
    const totalVisitorsResult = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('COUNT(DISTINCT pv.visitorId)', 'count')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const totalVisitors = parseInt(totalVisitorsResult?.count || '0');

    // New visitors (first visit in period AND only 1 total visit)
    const newVisitorsResult = await this.visitorRepository
      .createQueryBuilder('v')
      .select('COUNT(*)', 'count')
      .where('v.firstVisit BETWEEN :start AND :end', { start, end })
      .andWhere('v.totalVisits = 1')
      .getRawOne();

    const newVisitors = parseInt(newVisitorsResult?.count || '0');

    // Returning visitors (visited in period AND have more than 1 total visit)
    const returningVisitorsResult = await this.visitorRepository
      .createQueryBuilder('v')
      .select('COUNT(*)', 'count')
      .where('v.lastVisit BETWEEN :start AND :end', { start, end })
      .andWhere('v.totalVisits > 1')
      .getRawOne();

    const returningVisitors = parseInt(returningVisitorsResult?.count || '0');

    // Total page views
    const totalPageViewsResult = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('COUNT(*)', 'count')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const totalPageViews = parseInt(totalPageViewsResult?.count || '0');

    // Average pages per visit
    const avgPagesPerVisit = totalVisitors > 0 ? totalPageViews / totalVisitors : 0;

    // Average session duration
    const avgDurationResult = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('AVG(pv.duration)', 'avgDuration')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('pv.duration IS NOT NULL')
      .getRawOne();

    const avgSessionDuration = parseFloat(avgDurationResult?.avgDuration || '0');

    // Bounce rate (visitors with only 1 page view)
    const singlePageVisitorsResult = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.visitorId')
      .addSelect('COUNT(*)', 'pageCount')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('pv.visitorId')
      .having('COUNT(*) = 1')
      .getRawMany();

    const singlePageVisitors = singlePageVisitorsResult.length;
    const bounceRate = totalVisitors > 0 ? (singlePageVisitors / totalVisitors) * 100 : 0;

    return {
      totalVisitors,
      newVisitors,
      returningVisitors,
      totalPageViews,
      avgPagesPerVisit: Math.round(avgPagesPerVisit * 100) / 100,
      avgSessionDuration: Math.round(avgSessionDuration),
      bounceRate: Math.round(bounceRate * 100) / 100,
    };
  }

  /**
   * Get top pages
   */
  async getTopPages(period = '30d', limit = 10): Promise<TopPage[]> {
    const { start, end } = this.getDateRange(period);

    const result = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('pv.path', 'path')
      .addSelect('COUNT(*)', 'views')
      .addSelect('COUNT(DISTINCT pv.visitorId)', 'uniqueVisitors')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('pv.path')
      .orderBy('views', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({
      path: r.path,
      views: parseInt(r.views),
      uniqueVisitors: parseInt(r.uniqueVisitors),
    }));
  }

  /**
   * Get traffic sources (referrers)
   */
  async getTrafficSources(period = '30d', limit = 10): Promise<TrafficSource[]> {
    const { start, end } = this.getDateRange(period);

    const result = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select(
        "CASE WHEN pv.referrer IS NULL OR pv.referrer = '' THEN 'Direct' ELSE pv.referrer END",
        'source',
      )
      .addSelect('COUNT(*)', 'count')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('source')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    const total = result.reduce((sum, r) => sum + parseInt(r.count), 0);

    return result.map((r) => ({
      source: this.cleanReferrer(r.source),
      count: parseInt(r.count),
      percentage: total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Clean referrer URL to show just domain
   */
  private cleanReferrer(referrer: string): string {
    if (referrer === 'Direct') return referrer;

    try {
      const url = new URL(referrer);
      return url.hostname;
    } catch {
      return referrer;
    }
  }

  /**
   * Get device breakdown
   */
  async getDeviceBreakdown(period = '30d'): Promise<DeviceBreakdown[]> {
    const { start, end } = this.getDateRange(period);

    const result = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select("COALESCE(pv.deviceType, 'Unknown')", 'deviceType')
      .addSelect('COUNT(DISTINCT pv.visitorId)', 'count')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('deviceType')
      .orderBy('count', 'DESC')
      .getRawMany();

    const total = result.reduce((sum, r) => sum + parseInt(r.count), 0);

    return result.map((r) => ({
      deviceType: r.deviceType,
      count: parseInt(r.count),
      percentage: total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Get browser breakdown
   */
  async getBrowserBreakdown(period = '30d'): Promise<BrowserBreakdown[]> {
    const { start, end } = this.getDateRange(period);

    const result = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select("COALESCE(pv.browser, 'Unknown')", 'browser')
      .addSelect('COUNT(DISTINCT pv.visitorId)', 'count')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('browser')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const total = result.reduce((sum, r) => sum + parseInt(r.count), 0);

    return result.map((r) => ({
      browser: r.browser,
      count: parseInt(r.count),
      percentage: total > 0 ? Math.round((parseInt(r.count) / total) * 10000) / 100 : 0,
    }));
  }

  /**
   * Get daily statistics for chart
   */
  async getDailyStats(period = '30d'): Promise<DailyStats[]> {
    const { start, end } = this.getDateRange(period);

    const result = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select("strftime('%Y-%m-%d', pv.createdAt)", 'date')
      .addSelect('COUNT(*)', 'pageViews')
      .addSelect('COUNT(DISTINCT pv.visitorId)', 'uniqueVisitors')
      .where('pv.createdAt BETWEEN :start AND :end', { start, end })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map((r) => ({
      date: r.date,
      pageViews: parseInt(r.pageViews),
      uniqueVisitors: parseInt(r.uniqueVisitors),
    }));
  }

  /**
   * Get real-time visitors (last 5 minutes)
   */
  async getRealTimeVisitors(): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await this.pageViewRepository
      .createQueryBuilder('pv')
      .select('COUNT(DISTINCT pv.visitorId)', 'count')
      .where('pv.createdAt >= :time', { time: fiveMinutesAgo })
      .getRawOne();

    return parseInt(result?.count || '0');
  }

  /**
   * Get recent page views for live feed
   */
  async getRecentPageViews(limit = 20): Promise<PageView[]> {
    return this.pageViewRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
      select: ['id', 'path', 'browser', 'os', 'deviceType', 'country', 'createdAt'],
    });
  }

  /**
   * Get complete analytics dashboard data
   */
  async getDashboardData(period = '30d') {
    const [stats, topPages, trafficSources, devices, browsers, dailyStats, realTimeVisitors] =
      await Promise.all([
        this.getVisitorStats(period),
        this.getTopPages(period),
        this.getTrafficSources(period),
        this.getDeviceBreakdown(period),
        this.getBrowserBreakdown(period),
        this.getDailyStats(period),
        this.getRealTimeVisitors(),
      ]);

    return {
      stats,
      topPages,
      trafficSources,
      devices,
      browsers,
      dailyStats,
      realTimeVisitors,
    };
  }
}
