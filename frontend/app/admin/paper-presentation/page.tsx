'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { StatCard } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { PageLoader } from '../components/ui/Spinner';
import dynamic from 'next/dynamic';

const PaperPresenter = dynamic(() => import('../components/events/PaperPresenter'), {
  ssr: false,
});

interface PaperSubmission {
  id: number;
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

interface User {
  role: 'admin' | 'coordinator' | 'member';
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
  const [_downloadedLinks, setDownloadedLinks] = useState<Record<number, string>>({});
  const [userRole, setUserRole] = useState<User['role'] | null>(null);
  const [presentingSubmission, setPresentingSubmission] = useState<PaperSubmission | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    teamMembers: '',
    college: '',
    topic: '',
    phone: '',
  });

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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData) as User;
      setUserRole(parsed.role);
    }
  }, []);

  const canEdit = userRole === 'admin' || userRole === 'coordinator';
  const canDelete = userRole === 'admin';

  const handleStatusChange = async (id: number, newStatus: string) => {
    if (!canEdit) return;
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
      setDownloadedLinks((prev) => {
        if (prev[id]) {
          window.URL.revokeObjectURL(prev[id]);
        }
        return { ...prev, [id]: url };
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `slides-${id}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setError('Failed to download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEditOpen = (sub: PaperSubmission) => {
    setEditingId(sub.id);
    setEditForm({
      teamMembers: sub.teamMembers.join(', '),
      college: sub.college,
      topic: sub.topic,
      phone: sub.phone,
    });
  };

  const handleEditSave = async (id: number) => {
    if (!canEdit) return;
    const token = localStorage.getItem('token');
    const members = editForm.teamMembers
      .split(',')
      .map((member) => member.trim())
      .filter(Boolean);

    setSavingEdit(true);
    try {
      const res = await fetch(getApiUrl(`/paper-presentation/submissions/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamMembers: members,
          college: editForm.college,
          topic: editForm.topic,
          phone: editForm.phone,
        }),
      });

      if (!res.ok) throw new Error('Update failed');
      setEditingId(null);
      fetchData();
    } catch {
      setError('Failed to update submission');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    if (!canDelete) return;
    if (!confirm('Delete this submission?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(getApiUrl(`/paper-presentation/submissions/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchData();
    } catch {
      setError('Failed to delete submission');
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.teamMembers.join(', ').toLowerCase().includes(searchQuery.toLowerCase());

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
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${activeTab === tab
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
            placeholder="Search by topic, college, or member..."
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
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {sub.teamMembers.join(', ')}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {sub.college}
                    </span>
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
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted: {new Date(sub.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <Button size="sm" onClick={() => setPresentingSubmission(sub)}>
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

                  {canEdit && (
                    <Button size="sm" variant="secondary" onClick={() => handleEditOpen(sub)}>
                      Edit
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      size="sm"
                      variant="danger-soft"
                      onClick={() => handleDeleteSubmission(sub.id)}
                    >
                      Delete
                    </Button>
                  )}

                  <Select
                    value={sub.status}
                    onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                    options={[
                      { value: 'submitted', label: 'Submitted' },
                      { value: 'presented', label: 'Presented' },
                      { value: 'skipped', label: 'Skipped' },
                      { value: 'disqualified', label: 'Disqualified' },
                    ]}
                    disabled={updatingId === sub.id || !canEdit}
                  />
                </div>
              </div>

              {editingId === sub.id && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Topic"
                      value={editForm.topic}
                      onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                    />
                    <Input
                      label="College"
                      value={editForm.college}
                      onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                    />
                    <Input
                      label="Phone"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="mt-4">
                    <Input
                      label="Team Members (comma separated)"
                      value={editForm.teamMembers}
                      onChange={(e) => setEditForm({ ...editForm, teamMembers: e.target.value })}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => handleEditSave(sub.id)} loading={savingEdit}>
                      Save Changes
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Paper Presenter Modal */}
      {presentingSubmission && (
        <PaperPresenter
          submissionId={presentingSubmission.id}
          teamName={presentingSubmission.teamMembers.join(', ')}
          onClose={() => setPresentingSubmission(null)}
        />
      )}
    </div>
  );
}
