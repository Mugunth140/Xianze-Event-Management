export interface VisitorStats {
  totalVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  totalPageViews: number;
  avgPagesPerVisit: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
}

export interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

export interface DeviceBreakdown {
  deviceType: string;
  count: number;
  percentage: number;
}

export interface BrowserBreakdown {
  browser: string;
  count: number;
  percentage: number;
}

export interface DailyStats {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

export interface DashboardData {
  stats: VisitorStats;
  topPages: TopPage[];
  trafficSources: TrafficSource[];
  devices: DeviceBreakdown[];
  browsers: BrowserBreakdown[];
  dailyStats: DailyStats[];
  realTimeVisitors: number;
}
