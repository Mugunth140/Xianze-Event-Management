'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import BuzzerPanel from '../components/events/BuzzerPanel';
import LeaderboardPanel from '../components/events/LeaderboardPanel';
import ThinkLinkPresenter from '../components/events/ThinkLinkPresenter';
import { PageHeader } from '../components/layout';
import Button from '../components/ui/Button';
import Card, { StatCard } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';

interface Puzzle {
  id: number;
  imagePath: string;
  roundNumber: number;
  hint: string | null;
  result: 'pending' | 'correct' | 'wrong';
  markedAt: string | null;
}

interface Stats {
  total: number;
  correct: number;
  wrong: number;
  pending: number;
}

type Tab = 'puzzles' | 'buzzer' | 'leaderboard';

export default function ThinkLinkPage() {
  const [activeTab, setActiveTab] = useState<Tab>('puzzles');
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);
  const [presenting, setPresenting] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const [puzzlesRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/think-link/puzzles'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl('/think-link/stats'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!puzzlesRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

      const puzzlesData = await puzzlesRes.json();
      const statsData = await statsRes.json();

      setPuzzles(puzzlesData.data || []);
      setStats(statsData.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const token = localStorage.getItem('token');
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);

        await fetch(getApiUrl('/think-link/puzzles'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }
      fetchData();
    } catch {
      setError('Failed to upload puzzles');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!confirm('Delete this puzzle?')) return;

    try {
      await fetch(getApiUrl(`/think-link/puzzles/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      setError('Failed to delete puzzle');
    }
  };

  const handleReset = async () => {
    const token = localStorage.getItem('token');
    if (!confirm('Reset all puzzles to pending? This will clear all results.')) return;

    try {
      await fetch(getApiUrl('/think-link/reset'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      setError('Failed to reset puzzles');
    }
  };

  const handleMarkResult = async (id: number, result: 'correct' | 'wrong') => {
    const token = localStorage.getItem('token');
    try {
      await fetch(getApiUrl(`/think-link/puzzles/${id}/result`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ result }),
      });
      fetchData();
    } catch {
      setError('Failed to mark result');
    }
  };

  if (loading) return <PageLoader message="Loading Think & Link..." />;

  if (presenting) {
    return (
      <ThinkLinkPresenter
        puzzles={puzzles}
        timerDuration={timerDuration}
        onMarkResult={handleMarkResult}
        onClose={() => {
          setPresenting(false);
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Think & Link"
        subtitle="Technical connection game - puzzles and buzzer round"
        actions={
          activeTab === 'puzzles' ? (
            <div className="flex items-center gap-3">
              <label className="admin-btn admin-btn-secondary cursor-pointer">
                {uploading ? 'Uploading...' : 'Upload Puzzles'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <Button onClick={() => setPresenting(true)} disabled={puzzles.length === 0}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Start Presentation
              </Button>
            </div>
          ) : null
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          {error}
          <button onClick={() => setError('')} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('puzzles')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'puzzles'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Puzzles
        </button>
        <button
          onClick={() => setActiveTab('buzzer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'buzzer'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          Buzzer Round
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Leaderboard
        </button>
      </div>

      {/* Puzzles Tab */}
      {activeTab === 'puzzles' && (
        <div className="space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                }
                value={stats.total}
                label="Total Puzzles"
                iconColor="text-primary-600"
              />
              <StatCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                }
                value={stats.correct}
                label="Correct"
                iconColor="text-emerald-600"
              />
              <StatCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                }
                value={stats.wrong}
                label="Wrong"
                iconColor="text-red-500"
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
                value={stats.pending}
                label="Pending"
                iconColor="text-amber-500"
              />
            </div>
          )}

          {/* Timer Setting */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Timer Duration</h3>
                <p className="text-sm text-gray-500">Time per puzzle during presentation</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={timerDuration}
                  onChange={(e) =>
                    setTimerDuration(Math.max(10, Math.min(300, parseInt(e.target.value) || 60)))
                  }
                  className="admin-input w-20 text-center"
                />
                <span className="text-gray-500">seconds</span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={handleReset} disabled={puzzles.length === 0}>
              Reset All Results
            </Button>
          </div>

          {/* Puzzles Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {puzzles.map((puzzle) => (
              <Card key={puzzle.id} className="overflow-hidden">
                <div className="relative aspect-video bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getApiUrl(`/think-link/puzzles/${puzzle.id}/image`)}
                    alt={`Puzzle ${puzzle.roundNumber}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Result overlay */}
                  {puzzle.result !== 'pending' && (
                    <div
                      className={`absolute inset-0 flex items-center justify-center ${
                        puzzle.result === 'correct' ? 'bg-emerald-500/80' : 'bg-red-500/80'
                      }`}
                    >
                      {puzzle.result === 'correct' ? (
                        <svg
                          className="w-12 h-12 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-12 h-12 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                  {/* Round number badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs font-bold rounded">
                    #{puzzle.roundNumber}
                  </div>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {puzzle.hint ? puzzle.hint.substring(0, 20) + '...' : 'No hint'}
                  </span>
                  <button
                    onClick={() => handleDelete(puzzle.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </Card>
            ))}
            {puzzles.length === 0 && (
              <Card className="col-span-full p-8 text-center text-gray-500">
                No puzzles uploaded yet. Click &quot;Upload Puzzles&quot; to add images.
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Buzzer Tab */}
      {activeTab === 'buzzer' && <BuzzerPanel defaultEvent="think-link" />}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && <LeaderboardPanel defaultEvent="think-link" />}
    </div>
  );
}
