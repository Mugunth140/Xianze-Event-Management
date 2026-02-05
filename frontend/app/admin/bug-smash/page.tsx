'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { StatCard } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';

interface Participant {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  lastSubmitTime: string | null;
  round2Status: 'pending' | 'qualified' | 'eliminated';
  round3Rank: number | null;
  round3Score: number | null;
}

interface Stats {
  totalParticipants: number;
  qualified: number;
  eliminated: number;
}

type Tab = 'round2' | 'round3';

export default function BugSmashPage() {
  const [activeTab, setActiveTab] = useState<Tab>('round2');
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const [leaderboardRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/bug-smash/leaderboard')),
        fetch(getApiUrl('/bug-smash/stats'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const leaderboardData = await leaderboardRes.json();
      const statsData = await statsRes.json();

      setLeaderboard(leaderboardData.data || []);
      setStats(statsData.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRound2Status = async (id: number, status: 'qualified' | 'eliminated') => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/bug-smash/round2/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleRound3Result = async (id: number, rank: number) => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/bug-smash/round3/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rank }),
    });
    fetchData();
  };

  if (loading) return <PageLoader message="Loading Bug Smash..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Bug Smash" subtitle="Debugging competition - Exam Mode + Manual Finals" />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          {error}
          <button onClick={() => setError('')} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6v-2a4 4 0 00-3-3.87M7 7a4 4 0 118 0 4 4 0 01-8 0zm10 4a4 4 0 10-8 0 4 4 0 008 0z"
                />
              </svg>
            }
            value={stats.totalParticipants}
            label="Participants"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            value={stats.qualified}
            label="Qualified"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2L10 10m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            value={stats.eliminated}
            label="Eliminated"
            iconColor="text-red-500"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['round2', 'round3'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            {tab === 'round2' ? 'Round 2 (Shortlist)' : 'Round 3 (Finals)'}
          </button>
        ))}
      </div>

      {/* Round 2 - Shortlist */}
      {activeTab === 'round2' && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Shortlist Participants</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>
                    <Badge
                      variant={
                        p.round2Status === 'qualified'
                          ? 'success'
                          : p.round2Status === 'eliminated'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {p.round2Status}
                    </Badge>
                  </td>
                  <td className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRound2Status(p.id, 'qualified')}
                    >
                      Qualify
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRound2Status(p.id, 'eliminated')}
                    >
                      Eliminate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Round 3 - Finals */}
      {activeTab === 'round3' && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Final Results (Qualified Only)</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Final Rank</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard
                .filter((p) => p.round2Status === 'qualified')
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      {p.round3Rank ? (
                        <Badge variant="purple">#{p.round3Rank}</Badge>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((rank) => (
                          <Button
                            key={rank}
                            size="sm"
                            variant={p.round3Rank === rank ? 'primary' : 'secondary'}
                            onClick={() => handleRound3Result(p.id, rank)}
                          >
                            #{rank}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
