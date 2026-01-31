'use client';

import { getApiUrl } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from './components/layout';
import Badge from './components/ui/Badge';
import Card, { StatCard } from './components/ui/Card';
import { EventBarChart, OverviewLineChart, PaymentPieChart } from './components/ui/Charts';
import { PageLoader } from './components/ui/Spinner';

interface OverviewData {
  totalRegistrations: number;
  totalContacts: number;
  registrationsByEvent: { event: string; count: string }[];
  registrationsByCollege?: { college: string; count: string }[];
}

interface PaymentStat {
  status: string;
  count: number;
}

interface TrendData {
  date: string;
  count: string;
}

interface User {
  name: string;
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
  assignedEvents?: string[];
  tasks?: string[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStat[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [hasAnalyticsAccess, setHasAnalyticsAccess] = useState(true);

  // Computed metrics
  const totalTrendCount = useMemo(
    () => trends.reduce((sum, item) => sum + Number(item.count || 0), 0),
    [trends]
  );

  const averagePerDay = useMemo(() => {
    if (trends.length === 0) return 0;
    return totalTrendCount / trends.length;
  }, [totalTrendCount, trends.length]);

  const peakDay = useMemo(() => {
    if (trends.length === 0) return null;
    return trends.reduce((max, item) => (Number(item.count) > Number(max.count) ? item : max));
  }, [trends]);

  const latestDelta = useMemo(() => {
    if (trends.length < 2) return null;
    const last = Number(trends[trends.length - 1].count || 0);
    const prev = Number(trends[trends.length - 2].count || 0);
    return last - prev;
  }, [trends]);

  // Payment computed stats
  const verifiedPayments = useMemo(
    () => paymentStats.find((p) => p.status === 'verified')?.count || 0,
    [paymentStats]
  );

  const pendingPayments = useMemo(
    () => paymentStats.find((p) => p.status === 'pending')?.count || 0,
    [paymentStats]
  );

  const rejectedPayments = useMemo(
    () => paymentStats.find((p) => p.status === 'rejected')?.count || 0,
    [paymentStats]
  );

  const verificationRate = useMemo(() => {
    const total = verifiedPayments + pendingPayments + rejectedPayments;
    if (total === 0) return 0;
    return ((verifiedPayments / total) * 100).toFixed(1);
  }, [verifiedPayments, pendingPayments, rejectedPayments]);

  // Top event
  const topEvent = useMemo(() => {
    if (!overview?.registrationsByEvent?.length) return null;
    return overview.registrationsByEvent.reduce((max, item) =>
      Number(item.count) > Number(max.count) ? item : max
    );
  }, [overview]);

  // Colleges count
  const uniqueColleges = useMemo(() => overview?.registrationsByCollege?.length || 0, [overview]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const [overviewRes, paymentRes, trendsRes] = await Promise.all([
          fetch(getApiUrl('/analytics/overview'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(getApiUrl('/analytics/payment-stats'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(getApiUrl('/analytics/trends'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (overviewRes.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/admin/login');
          return;
        }

        // Handle 403 for members/coordinators without analytics access
        if (overviewRes.status === 403) {
          setHasAnalyticsAccess(false);
          setLoading(false);
          return;
        }

        if (!overviewRes.ok || !paymentRes.ok || !trendsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const overviewData = await overviewRes.json();
        const paymentData = await paymentRes.json();
        const trendsData = await trendsRes.json();

        setOverview(overviewData);
        setPaymentStats(paymentData);
        setTrends(trendsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">{error}</div>
        <button onClick={() => window.location.reload()} className="admin-btn admin-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  // Show restricted dashboard for members/coordinators without analytics access
  if (!hasAnalyticsAccess) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Welcome, ${user?.name || 'Team Member'}`}
          subtitle={
            user?.role === 'coordinator' && user.assignedEvent
              ? `Assigned Event: ${user.assignedEvent}`
              : user?.role === 'member' && user.assignedEvents?.length
                ? `Your Events: ${user.assignedEvents.join(', ')}`
                : 'Your assigned tasks are shown in the sidebar'
          }
        />

        {/* Quick Actions for Members */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {user?.tasks?.includes('mark_attendance') && (
            <Link href="/admin/attendance">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Mark Attendance</h3>
                    <p className="text-sm text-gray-500">Check in participants</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {user?.tasks?.includes('verify_payment') && (
            <Link href="/admin/payments">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-primary-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Verify Payments</h3>
                    <p className="text-sm text-gray-500">Review pending payments</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}

          {user?.tasks?.includes('check_in_participant') && (
            <Link href="/admin/qr-checkin">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <svg
                      className="w-6 h-6 text-amber-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">QR Check-in</h3>
                    <p className="text-sm text-gray-500">Scan participant passes</p>
                  </div>
                </div>
              </Card>
            </Link>
          )}
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-br from-primary-50 to-purple-50 border-primary-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Your Access Level</h3>
              <p className="text-sm text-gray-600">
                You have <Badge variant={user?.role || 'member'}>{user?.role}</Badge> access. Use
                the sidebar to navigate to your assigned tasks. Contact an administrator if you need
                additional permissions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Full analytics dashboard for admins
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={
          user?.role === 'coordinator' && user.assignedEvent
            ? `Managing: ${user.assignedEvent}`
            : 'Monitor your event registrations and analytics'
        }
      />

      {/* Primary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
          value={overview?.totalRegistrations || 0}
          label="Total Registrations"
          iconColor="text-primary-600"
        />

        <StatCard
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          value={verifiedPayments}
          label="Verified Payments"
          iconColor="text-emerald-600"
        />

        <StatCard
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          value={pendingPayments}
          label="Pending Payments"
          iconColor="text-amber-600"
        />

        <StatCard
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          value={`${verificationRate}%`}
          label="Verification Rate"
          iconColor="text-blue-600"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          value={overview?.registrationsByEvent?.length || 0}
          label="Active Events"
          iconColor="text-purple-600"
        />

        <StatCard
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
          value={uniqueColleges}
          label="Colleges Reached"
          iconColor="text-teal-600"
        />

        <StatCard
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
          value={overview?.totalContacts || 0}
          label="Contact Inquiries"
          iconColor="text-rose-600"
        />

        <StatCard
          icon={
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          value={rejectedPayments}
          label="Rejected"
          iconColor="text-red-500"
        />
      </div>

      {/* Insight Highlights */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
          Performance Insights
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-primary-50 to-purple-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Avg/Day</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Number.isFinite(averagePerDay) ? averagePerDay.toFixed(1) : '0'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Peak Day</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{peakDay ? peakDay.count : 'N/A'}</p>
            <p className="text-xs text-gray-500 mt-1">
              {peakDay ? new Date(peakDay.date).toLocaleDateString() : 'No data yet'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Top Event</p>
            </div>
            <p className="text-lg font-bold text-gray-900 truncate">
              {topEvent ? topEvent.event : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {topEvent ? `${topEvent.count} registrations` : 'No data yet'}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Day Change</p>
            </div>
            <p
              className={`text-2xl font-bold ${latestDelta !== null && latestDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {latestDelta === null ? 'N/A' : `${latestDelta >= 0 ? '+' : ''}${latestDelta}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">vs previous day</p>
          </div>
        </div>
      </Card>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Registration Trends
          </h2>
          <OverviewLineChart data={trends} />
        </Card>

        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Payment Status</h2>
          <PaymentPieChart data={paymentStats} />
        </Card>
      </div>

      {/* Event Breakdown & Top Colleges */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            Registrations by Event
          </h2>
          <EventBarChart data={overview?.registrationsByEvent || []} />
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Top Colleges</h2>
            <Badge variant="info">{uniqueColleges} total</Badge>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto admin-scrollbar">
            {overview?.registrationsByCollege?.slice(0, 8).map((college, index) => (
              <div key={college.college} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? 'bg-amber-100 text-amber-700'
                      : index === 1
                        ? 'bg-gray-100 text-gray-600'
                        : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{college.college}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-primary-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(100, (Number(college.count) / Number(overview?.registrationsByCollege?.[0]?.count || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600">{college.count}</span>
              </div>
            ))}
            {(!overview?.registrationsByCollege ||
              overview.registrationsByCollege.length === 0) && (
              <p className="text-center text-gray-400 py-8">No college data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/admin/registrations"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center transition-colors">
              <svg
                className="w-5 h-5 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-primary-700">View All</span>
          </Link>

          <Link
            href="/admin/payments"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 flex items-center justify-center transition-colors">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-emerald-700">Payments</span>
          </Link>

          <Link
            href="/admin/attendance"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-amber-700">Attendance</span>
          </Link>

          <Link
            href="/admin/visitor-analytics"
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-blue-700">Analytics</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
