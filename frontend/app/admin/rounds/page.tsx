'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout';
import Card from '../components/ui/Card';
import useAuth from '../hooks/useAuth';

interface EventRoundConfig {
  id: number;
  eventSlug: string;
  eventName: string;
  totalRounds: number;
  currentRound: number;
  isStarted: boolean;
  isCompleted: boolean;
  roundCompletedAt: Record<number, string> | null;
}

interface RoundAnalytics {
  eventSlug: string;
  eventName: string;
  totalRounds: number;
  currentRound: number;
  isStarted: boolean;
  isCompleted: boolean;
  participantsByRound: Array<{
    roundNumber: number;
    participantCount: number;
    completedAt?: string;
  }>;
  totalEventParticipants: number;
}

type TabType = 'configuration' | 'analytics';

export default function RoundsPage() {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('configuration');
  const [configs, setConfigs] = useState<EventRoundConfig[]>([]);
  const [analytics, setAnalytics] = useState<RoundAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isAdmin = user?.role === 'admin';

  const fetchConfigs = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rounds`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load round configurations' });
    }
  }, [token]);

  const fetchAnalytics = useCallback(async () => {
    if (!token) return;

    try {
      const endpoint = isAdmin ? '/rounds/analytics' : '/rounds';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (isAdmin) {
          setAnalytics(data);
        } else {
          // For non-admins, fetch analytics for each config they can access
          const analyticsPromises = data.map(async (config: EventRoundConfig) => {
            const analyticsRes = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/rounds/analytics/${config.eventSlug}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (analyticsRes.ok) {
              return analyticsRes.json();
            }
            return null;
          });
          const results = await Promise.all(analyticsPromises);
          setAnalytics(results.filter(Boolean));
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load round analytics' });
    }
  }, [token, isAdmin]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchConfigs();
      await fetchAnalytics();
      setLoading(false);
    };
    loadData();
  }, [fetchConfigs, fetchAnalytics]);

  const updateRounds = async (eventSlug: string, totalRounds: number) => {
    if (!token || !isAdmin) return;

    setUpdating(eventSlug);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rounds/config/${eventSlug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ totalRounds }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Updated rounds for ${eventSlug}` });
        await fetchConfigs();
      } else {
        setMessage({ type: 'error', text: 'Failed to update rounds' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setUpdating(null);
    }
  };

  const startEvent = async (eventSlug: string) => {
    if (!token) return;

    setUpdating(eventSlug);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rounds/start/${eventSlug}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Event started: ${eventSlug}` });
        await fetchConfigs();
        await fetchAnalytics();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to start event' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setUpdating(null);
    }
  };

  const advanceRound = async (eventSlug: string) => {
    if (!token) return;

    setUpdating(eventSlug);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rounds/advance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ eventSlug }),
      });

      if (res.ok) {
        const data = await res.json();
        const msg = data.isCompleted
          ? `Event completed: ${eventSlug}`
          : `Advanced to round ${data.currentRound}`;
        setMessage({ type: 'success', text: msg });
        await fetchConfigs();
        await fetchAnalytics();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to advance round' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setUpdating(null);
    }
  };

  const resetEvent = async (eventSlug: string) => {
    if (!token || !isAdmin) return;
    if (
      !confirm(`Are you sure you want to reset ${eventSlug}? This will clear all round progress.`)
    )
      return;

    setUpdating(eventSlug);
    setMessage(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rounds/reset/${eventSlug}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Event reset: ${eventSlug}` });
        await fetchConfigs();
        await fetchAnalytics();
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Event Rounds"
        subtitle={
          isAdmin
            ? 'Configure rounds for each event and track progress'
            : 'Start and advance rounds for your assigned events'
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('configuration')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'configuration'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'analytics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <div className="space-y-4">
          {configs.map((config) => (
            <Card key={config.eventSlug} className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{config.eventName}</h3>
                    {config.isCompleted && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Completed
                      </span>
                    )}
                    {config.isStarted && !config.isCompleted && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        In Progress - Round {config.currentRound}
                      </span>
                    )}
                    {!config.isStarted && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        Not Started
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {config.totalRounds === 0
                      ? 'No rounds (single session event)'
                      : `${config.totalRounds} round${config.totalRounds > 1 ? 's' : ''}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Round selector (Admin only) */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Rounds:</label>
                      <select
                        value={config.totalRounds}
                        onChange={(e) => updateRounds(config.eventSlug, parseInt(e.target.value))}
                        disabled={updating === config.eventSlug}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                      >
                        <option value={0}>No Rounds</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} Round{n > 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {!config.isStarted && (
                      <button
                        onClick={() => startEvent(config.eventSlug)}
                        disabled={updating === config.eventSlug}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {updating === config.eventSlug ? 'Starting...' : 'Start Event'}
                      </button>
                    )}

                    {config.isStarted && !config.isCompleted && config.totalRounds > 0 && (
                      <button
                        onClick={() => advanceRound(config.eventSlug)}
                        disabled={updating === config.eventSlug}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {updating === config.eventSlug
                          ? 'Advancing...'
                          : config.currentRound >= config.totalRounds
                            ? 'Complete Event'
                            : `Finish Round ${config.currentRound}`}
                      </button>
                    )}

                    {config.isStarted && !config.isCompleted && config.totalRounds === 0 && (
                      <button
                        onClick={() => advanceRound(config.eventSlug)}
                        disabled={updating === config.eventSlug}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {updating === config.eventSlug ? 'Completing...' : 'Complete Event'}
                      </button>
                    )}

                    {isAdmin && (config.isStarted || config.isCompleted) && (
                      <button
                        onClick={() => resetEvent(config.eventSlug)}
                        disabled={updating === config.eventSlug}
                        className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 transition-colors"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {analytics.map((event) => (
            <Card key={event.eventSlug} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{event.eventName}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${
                      event.isCompleted
                        ? 'bg-green-100 text-green-700'
                        : event.isStarted
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {event.isCompleted
                      ? 'Completed'
                      : event.isStarted
                        ? `Round ${event.currentRound}`
                        : 'Not Started'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Total Participants</p>
                  <p className="text-2xl font-bold text-blue-700">{event.totalEventParticipants}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Total Rounds</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {event.totalRounds === 0 ? 'N/A' : event.totalRounds}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Current Round</p>
                  <p className="text-2xl font-bold text-green-700">
                    {event.totalRounds === 0
                      ? 'N/A'
                      : event.isCompleted
                        ? 'Done'
                        : event.currentRound || '-'}
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-sm text-orange-600 font-medium">Status</p>
                  <p className="text-lg font-bold text-orange-700">
                    {event.isCompleted ? 'Completed' : event.isStarted ? 'In Progress' : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Round Breakdown */}
              {event.totalRounds > 0 && event.participantsByRound.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Round Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Round
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Participants
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completed At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {event.participantsByRound.map((round) => (
                          <tr key={round.roundNumber}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-medium text-gray-900">
                                Round {round.roundNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-gray-600">{round.participantCount}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {round.completedAt ? (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                  Completed
                                </span>
                              ) : event.currentRound === round.roundNumber && event.isStarted ? (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {round.completedAt
                                ? new Date(round.completedAt).toLocaleString()
                                : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {event.totalRounds === 0 && (
                <p className="text-sm text-gray-500 italic">
                  This is a single-session event without rounds.
                </p>
              )}
            </Card>
          ))}

          {analytics.length === 0 && (
            <Card className="p-6 text-center text-gray-500">No analytics data available.</Card>
          )}
        </div>
      )}
    </div>
  );
}
