'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { StatCard } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SlideshowViewer from '../components/ui/SlideshowViewer';
import { PageLoader } from '../components/ui/Spinner';

interface PaperSubmission {
  id: number;
  teamName: string;
  teamMembers: string[];
  college: string;
  topic: string;
  phone: string;
  slidePath: string;
  pdfPath?: string;
  status: 'submitted' | 'presented' | 'skipped' | 'disqualified';
  createdAt: string;
}

interface Stats {
  total: number;
  submitted: number;
  presented: number;
  skipped: number;
}

export default function PaperPresentationPage() {
  const [submissions, setSubmissions] = useState<PaperSubmission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'presented' | 'skipped'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  // Slideshow state - now using fullscreen viewer
  const [presentingSubmission, setPresentingSubmission] = useState<PaperSubmission | null>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const [subsRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/paper-presentation/submissions'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(getApiUrl('/paper-presentation/stats'), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!subsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

      const subsData = await subsRes.json();
      const statsData = await statsRes.json();

      setSubmissions(subsData.data || []);
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

  const handleStatusChange = async (id: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    setUpdatingId(id);

    try {
      await fetch(getApiUrl(`/paper-presentation/submissions/${id}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch {
      setError('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDownload = async (id: number, filename: string) => {
    const token = localStorage.getItem('token');
    setDownloadingId(id);

    try {
      const response = await fetch(getApiUrl(`/paper-presentation/slides/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `slides-${id}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      setError('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStartPresentation = (sub: PaperSubmission) => {
    // Check if PDF is available (either pdfPath exists or original is PDF)
    const hasPdf = sub.pdfPath || sub.slidePath.toLowerCase().endsWith('.pdf');
    if (!hasPdf) {
      setError(
        'PDF not available. This presentation was uploaded before PDF conversion was enabled. Please ask the team to re-upload in PDF format.'
      );
      return;
    }
    setPresentingSubmission(sub);
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.college.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === 'all' || sub.status === activeTab;

    return matchesSearch && matchesTab;
  });

  if (loading) return <PageLoader message="Loading submissions..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paper Presentation"
        subtitle="Manage paper submissions and presentations"
      />

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
            label="Total Submissions"
            iconColor="text-primary-600"
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
            value={stats.submitted}
            label="Pending"
            iconColor="text-amber-600"
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
            value={stats.presented}
            label="Presented"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            }
            value={stats.skipped}
            label="Skipped"
            iconColor="text-gray-500"
          />
        </div>
      )}

      {/* Tabs & Search */}
      <div className="space-y-4">
        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
          {(['all', 'submitted', 'presented', 'skipped'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <Card className="p-4">
          <Input
            placeholder="Search by team name, topic, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Card>
      </div>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">No submissions found</Card>
        ) : (
          filteredSubmissions.map((sub) => (
            <Card key={sub.id} className="p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{sub.teamName}</h3>
                    <Badge
                      variant={
                        sub.status === 'presented'
                          ? 'success'
                          : sub.status === 'skipped'
                            ? 'inactive'
                            : sub.status === 'disqualified'
                              ? 'error'
                              : 'warning'
                      }
                    >
                      {sub.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-primary-600 font-medium mb-1">{sub.topic}</p>
                  <p className="text-sm text-gray-500">
                    {sub.teamMembers.join(', ')} • {sub.college}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted: {new Date(sub.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <Button size="sm" onClick={() => handleStartPresentation(sub)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      handleDownload(sub.id, sub.slidePath.split('/').pop() || 'slides')
                    }
                    loading={downloadingId === sub.id}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </Button>

                  <Select
                    value={sub.status}
                    onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                    options={[
                      { value: 'submitted', label: 'Submitted' },
                      { value: 'presented', label: 'Presented' },
                      { value: 'skipped', label: 'Skipped' },
                      { value: 'disqualified', label: 'Disqualified' },
                    ]}
                    disabled={updatingId === sub.id}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Fullscreen Slideshow Viewer */}
      {presentingSubmission && (
        <SlideshowViewer
          submissionId={presentingSubmission.id}
          teamName={presentingSubmission.teamName}
          onClose={() => setPresentingSubmission(null)}
        />
      )}
    </div>
  );
}
