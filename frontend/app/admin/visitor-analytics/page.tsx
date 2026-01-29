'use client';

import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '../components/layout';
import Card, { StatCard } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';

interface VisitorStats {
  totalVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  totalPageViews: number;
  avgPagesPerVisit: number;
  avgSessionDuration: number;
  bounceRate: number;
}

interface TopPage {
  path: string;
  views: number;
  uniqueVisitors: number;
}

interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

interface DeviceBreakdown {
  deviceType: string;
  count: number;
  percentage: number;
}

interface BrowserBreakdown {
  browser: string;
  count: number;
  percentage: number;
}

interface DailyStats {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
}

interface DashboardData {
  stats: VisitorStats;
  topPages: TopPage[];
  trafficSources: TrafficSource[];
  devices: DeviceBreakdown[];
  browsers: BrowserBreakdown[];
  dailyStats: DailyStats[];
  realTimeVisitors: number;
}

const DEVICE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899'];
const BROWSER_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

export default function VisitorAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        router.push('/admin');
        return;
      }
      setIsAdmin(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`/analytics/visitors/dashboard?period=${period}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 403) {
          router.push('/admin');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch analytics data');
        }

        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh real-time visitors every 30 seconds
    const interval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(getApiUrl('/analytics/visitors/realtime'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const { activeVisitors } = await response.json();
          setData((prev) => (prev ? { ...prev, realTimeVisitors: activeVisitors } : null));
        }
      } catch {
        // Ignore errors for real-time updates
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [router, period, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader message="Checking permissions..." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <PageLoader message="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Visitor Analytics"
          subtitle="Track website visitors, page views, and user behavior"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Period:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Real-time indicator */}
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-green-800 font-medium">
          {data.realTimeVisitors} active visitor{data.realTimeVisitors !== 1 ? 's' : ''} right now
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          value={data.stats.totalVisitors.toLocaleString()}
          label="Total Visitors"
          iconColor="text-primary-600"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          }
          value={data.stats.totalPageViews.toLocaleString()}
          label="Page Views"
          iconColor="text-blue-600"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          value={formatDuration(data.stats.avgSessionDuration)}
          label="Avg. Duration"
          iconColor="text-green-600"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          value={`${data.stats.bounceRate}%`}
          label="Bounce Rate"
          iconColor="text-amber-600"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {data.stats.newVisitors.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">New Visitors</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {data.stats.returningVisitors.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">Returning Visitors</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{data.stats.avgPagesPerVisit}</p>
            <p className="text-sm text-gray-500">Pages per Visit</p>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Over Time */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Over Time</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pageViews"
                  name="Page Views"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="uniqueVisitors"
                  name="Unique Visitors"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Pages */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {data.topPages.map((page, index) => (
              <div
                key={page.path}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                    {page.path === '/' ? 'Homepage' : page.path}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{page.views.toLocaleString()} views</span>
                  <span className="text-gray-400">|</span>
                  <span>{page.uniqueVisitors.toLocaleString()} visitors</span>
                </div>
              </div>
            ))}
            {data.topPages.length === 0 && (
              <p className="text-center text-gray-500 py-8">No page view data yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Device & Browser Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Devices</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.devices}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  nameKey="deviceType"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {data.devices.map((entry, index) => (
                    <Cell
                      key={entry.deviceType}
                      fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Browsers */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browsers</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.browsers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="browser"
                  type="category"
                  width={80}
                  tick={{ fill: '#374151', fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.browsers.map((entry, index) => (
                    <Cell
                      key={entry.browser}
                      fill={BROWSER_COLORS[index % BROWSER_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Traffic Sources */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.trafficSources.map((source) => (
            <div
              key={source.source}
              className="p-4 bg-gray-50 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900 truncate max-w-[180px]">{source.source}</p>
                <p className="text-sm text-gray-500">{source.count.toLocaleString()} visits</p>
              </div>
              <div className="text-lg font-semibold text-primary-600">{source.percentage}%</div>
            </div>
          ))}
          {data.trafficSources.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-8">
              No traffic source data yet
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
