'use client';

import { getApiUrl } from '@/lib/api';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import BuzzerPanel from '../components/events/BuzzerPanel';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Card, { StatCard } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';

const ThinkLinkPresenter = dynamic(() => import('../components/events/ThinkLinkPresenter'), {
  ssr: false,
  loading: () => <PageLoader message="Loading presenter..." />,
});

interface Presentation {
  id: number;
  name: string;
  filePath: string;
  totalSlides: number;
  createdAt: string;
}

interface Stats {
  total: number;
}

type Tab = 'general' | 'buzzer';

export default function ThinkLinkPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [timerDuration, setTimerDuration] = useState(60);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const [presentationsRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/think-link/presentations'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl('/think-link/stats'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!presentationsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

      const presentationsData = await presentationsRes.json();
      const statsData = await statsRes.json();

      setPresentations(presentationsData.data || []);
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
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

      const res = await fetch(getApiUrl('/think-link/presentations'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      fetchData();
    } catch {
      setError('Failed to upload presentation');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!confirm('Delete this presentation?')) return;

    try {
      await fetch(getApiUrl(`/think-link/presentations/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      setError('Failed to delete presentation');
    }
  };

  const handleStartPresentation = (presentation: Presentation) => {
    setSelectedPresentation(presentation);
    setPresenting(true);
  };

  if (loading) return <PageLoader message="Loading Think & Link..." />;

  if (presenting && selectedPresentation) {
    return (
      <ThinkLinkPresenter
        presentationId={selectedPresentation.id}
        presentationName={selectedPresentation.name}
        timerDuration={timerDuration}
        onClose={() => {
          setPresenting(false);
          setSelectedPresentation(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Think & Link"
        subtitle="Upload PDF presentations and present with timed slides"
        actions={
          activeTab === 'general' ? (
            <label className="admin-btn admin-btn-secondary cursor-pointer">
              {uploading ? 'Uploading...' : 'Upload PDF'}
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          ) : undefined
        }
      />

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'general'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="text-lg">📄</span>
          General
        </button>
        <button
          onClick={() => setActiveTab('buzzer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'buzzer'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span className="text-lg">🔔</span>
          Buzzer Control
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          {error}
          <button onClick={() => setError('')} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'general' && (
        <>
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
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                }
                value={stats.total}
                label="Total Presentations"
                iconColor="text-primary-600"
              />
            </div>
          )}

          {/* Timer Setting */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Timer Duration</h3>
                <p className="text-sm text-gray-500">Time per slide during presentation</p>
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

          {/* Presentations List */}
          <div className="grid gap-4">
            {presentations.map((presentation) => (
              <Card key={presentation.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{presentation.name}</h3>
                      <p className="text-sm text-gray-500">
                        Uploaded {new Date(presentation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={() => handleStartPresentation(presentation)}>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      Present
                    </Button>
                    <button
                      onClick={() => handleDelete(presentation.id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {presentations.length === 0 && (
              <Card className="p-8 text-center text-gray-500">
                No presentations uploaded yet. Click &quot;Upload PDF&quot; to add a presentation.
              </Card>
            )}
          </div>
        </>
      )}

      {activeTab === 'buzzer' && (
        <BuzzerPanel defaultEvent="think-link" buzzerPath="/events/think-link/buzzer" />
      )}
    </div>
  );
}
