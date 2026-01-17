'use client';

import { useEffect, useState } from 'react';

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

export default function AdminDashboard() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const [overviewRes, recentRes] = await Promise.all([
          fetch('/api/analytics/overview', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch('/api/analytics/recent?limit=5', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!overviewRes.ok || !recentRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const overviewData = await overviewRes.json();
        const recentData = await recentRes.json();

        setOverview(overviewData);
        setRecentRegistrations(recentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
        {error}
      </div>
    );
  }

  const eventColors = [
    'bg-blue-500',
    'bg-yellow-500',
    'bg-pink-500',
    'bg-orange-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-sky-500',
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1">Monitor your event registrations and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-400"
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
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{overview?.totalRegistrations || 0}</p>
              <p className="text-sm text-gray-400">Total Registrations</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-400"
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
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{overview?.totalContacts || 0}</p>
              <p className="text-sm text-gray-400">Contact Inquiries</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-yellow-400"
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
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {overview?.registrationsByEvent?.length || 0}
              </p>
              <p className="text-sm text-gray-400">Active Events</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-400"
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
            </div>
            <div>
              <p className="text-3xl font-bold text-white">
                {overview?.registrationsByCollege?.length || 0}
              </p>
              <p className="text-sm text-gray-400">Colleges</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations by Event */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">Registrations by Event</h3>
          <div className="space-y-4">
            {overview?.registrationsByEvent?.map((item, index) => {
              const count = parseInt(item.count);
              const maxCount = Math.max(
                ...(overview.registrationsByEvent?.map((e) => parseInt(e.count)) || [1])
              );
              const percentage = (count / maxCount) * 100;

              return (
                <div key={item.event} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">{item.event}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${eventColors[index % eventColors.length]} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!overview?.registrationsByEvent || overview.registrationsByEvent.length === 0) && (
              <p className="text-gray-400 text-center py-4">No registrations yet</p>
            )}
          </div>
        </div>

        {/* Top Colleges */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-6">Top Colleges</h3>
          <div className="space-y-3">
            {overview?.registrationsByCollege?.slice(0, 5).map((item, index) => (
              <div
                key={item.college}
                className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-xl"
              >
                <span className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center text-primary-400 font-bold text-sm">
                  {index + 1}
                </span>
                <span className="flex-1 text-gray-300 truncate">{item.college}</span>
                <span className="text-white font-semibold">{item.count}</span>
              </div>
            ))}
            {(!overview?.registrationsByCollege ||
              overview.registrationsByCollege.length === 0) && (
              <p className="text-gray-400 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-6">Recent Registrations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
                <th className="pb-4 font-medium">Name</th>
                <th className="pb-4 font-medium">Email</th>
                <th className="pb-4 font-medium">Event</th>
                <th className="pb-4 font-medium">College</th>
                <th className="pb-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {recentRegistrations.map((reg) => (
                <tr key={reg.id} className="border-b border-gray-700/50">
                  <td className="py-4 font-medium text-white">{reg.name}</td>
                  <td className="py-4">{reg.email}</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm">
                      {reg.event}
                    </span>
                  </td>
                  <td className="py-4 truncate max-w-[200px]">{reg.college}</td>
                  <td className="py-4 text-gray-400">
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentRegistrations.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No registrations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
