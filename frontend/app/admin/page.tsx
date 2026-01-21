'use client';

import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageHeader } from './components/layout';
import Badge from './components/ui/Badge';
import Card, { StatCard } from './components/ui/Card';
import { EventBarChart, OverviewLineChart, PaymentPieChart } from './components/ui/Charts';
import { PageLoader } from './components/ui/Spinner';

interface OverviewData {
  totalRegistrations: number;
  totalContacts: number;
  registrationsByEvent: { event: string; count: string }[];
  registrationsByCollege: { college: string; count: string }[];
}

interface Registration {
  id: number;
  name: string;
  email: string;
  college: string;
  event: string;
  createdAt: string;
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
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStat[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

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
        const [overviewRes, recentRes, paymentRes, trendsRes] = await Promise.all([
          fetch(getApiUrl('/analytics/overview'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(getApiUrl('/analytics/recent?limit=5'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(getApiUrl('/analytics/payment-stats'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(getApiUrl('/analytics/trends'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (overviewRes.status === 401 || recentRes.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/admin/login');
          return;
        }

        if (!overviewRes.ok || !recentRes.ok || !paymentRes.ok || !trendsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const overviewData = await overviewRes.json();
        const recentData = await recentRes.json();
        const paymentData = await paymentRes.json();
        const trendsData = await trendsRes.json();

        setOverview(overviewData);
        setRecentRegistrations(recentData);
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          iconColor="text-emerald-600"
        />

        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          iconColor="text-amber-600"
        />

        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
          value={overview?.registrationsByCollege?.length || 0}
          label="Colleges"
          iconColor="text-pink-600"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registration Trends</h2>
          <OverviewLineChart data={trends} />
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h2>
          <PaymentPieChart data={paymentStats} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Event Breakdown */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Registrations by Event</h2>
          <EventBarChart data={overview?.registrationsByEvent || []} />
        </Card>

        {/* Top Colleges */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Colleges</h2>
          <div className="space-y-3">
            {overview?.registrationsByCollege?.slice(0, 5).map((item, index) => (
              <div
                key={item.college}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-primary-50 text-primary-600 text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  <span className="text-gray-600 truncate max-w-[150px]" title={item.college}>
                    {item.college}
                  </span>
                </div>
                <Badge variant="purple">{item.count}</Badge>
              </div>
            ))}
            {(!overview?.registrationsByCollege ||
              overview.registrationsByCollege.length === 0) && (
              <p className="text-gray-400 text-center py-4">No data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Registrations */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Registrations</h2>
        <div className="overflow-x-auto admin-scrollbar">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Event</th>
                <th>College</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map((reg) => (
                <tr key={reg.id}>
                  <td className="font-medium text-gray-900">{reg.name}</td>
                  <td>{reg.email}</td>
                  <td>
                    <Badge variant="purple">{reg.event}</Badge>
                  </td>
                  <td className="max-w-[150px] truncate">{reg.college}</td>
                  <td className="text-gray-400">{new Date(reg.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No recent registrations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
