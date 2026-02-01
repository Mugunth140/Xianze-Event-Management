'use client';

import { getApiUrl } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { StatCard } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';

interface Team {
  id: number;
  teamName: string;
  participant1: string;
  participant2?: string;
  participant3?: string;
  participant4?: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

interface Document {
  id: number;
  title: string;
  description?: string;
  filePath: string;
  qrCodePath?: string;
  isActive: boolean;
  createdAt: string;
}

interface ApiState {
  id: number;
  customersEndpointEnabled: boolean;
  ordersEndpointEnabled: boolean;
  productsEndpointEnabled: boolean;
  registrationQrPath?: string;
  updatedAt: string;
}

interface Metrics {
  totalRequests: number;
  requestsByEndpoint: { endpoint: string; count: number }[];
  requestsPerMinute: { minute: string; count: number }[];
  recentRequests: { id: number; endpoint: string; createdAt: string; ipAddress?: string }[];
}

interface Stats {
  totalTeams: number;
  totalDocuments: number;
  totalRequests: number;
  apiState: ApiState;
}

type Tab = 'overview' | 'teams' | 'documents' | 'api-control' | 'metrics';

export default function BuildathonPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [teams, setTeams] = useState<Team[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [apiState, setApiState] = useState<ApiState | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(2 * 60 * 60);
  const [isCountdownRunning, setIsCountdownRunning] = useState(false);
  const [countdownEndTime, setCountdownEndTime] = useState<number | null>(null);
  const [countdownLoaded, setCountdownLoaded] = useState(false);
  const [resettingMetrics, setResettingMetrics] = useState(false);

  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [savingTeam, setSavingTeam] = useState(false);
  const [editTeamForm, setEditTeamForm] = useState({
    teamName: '',
    participant1: '',
    participant2: '',
    participant3: '',
    participant4: '',
    email: '',
    phone: '',
  });

  // Document upload form
  const [docTitle, setDocTitle] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [teamsRes, docsRes, stateRes, metricsRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/buildathon/teams'), { headers }),
        fetch(getApiUrl('/buildathon/documents'), { headers }),
        fetch(getApiUrl('/buildathon/api-state'), { headers }),
        fetch(getApiUrl('/buildathon/metrics'), { headers }),
        fetch(getApiUrl('/buildathon/stats'), { headers }),
      ]);

      const teamsData = await teamsRes.json();
      const docsData = await docsRes.json();
      const stateData = await stateRes.json();
      const metricsData = await metricsRes.json();
      const statsData = await statsRes.json();

      setTeams(teamsData.data || []);
      setDocuments(docsData.data || []);
      setApiState(stateData.data || null);
      setMetrics(metricsData.data || null);
      setStats(statsData.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Poll for metrics updates every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const stored = localStorage.getItem('buildathonCountdown');
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as {
        endTime?: number | null;
        running?: boolean;
        remaining?: number;
      };
      if (parsed.running && parsed.endTime) {
        const remaining = Math.max(0, Math.floor((parsed.endTime - Date.now()) / 1000));
        setCountdownSeconds(remaining);
        setIsCountdownRunning(remaining > 0);
        setCountdownEndTime(remaining > 0 ? parsed.endTime : null);
      } else if (typeof parsed.remaining === 'number') {
        setCountdownSeconds(parsed.remaining);
        setIsCountdownRunning(false);
        setCountdownEndTime(null);
      }
    } catch {
      // ignore
    }
    setCountdownLoaded(true);
  }, []);

  const handleUploadDocument = async () => {
    if (!docTitle || !docFile) {
      setError('Title and file are required');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('title', docTitle);
    formData.append('description', docDescription);
    formData.append('file', docFile);

    setUploading(true);
    try {
      const res = await fetch(getApiUrl('/buildathon/documents'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      setDocTitle('');
      setDocDescription('');
      setDocFile(null);
      fetchData();
    } catch {
      setError('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleActivateDocument = async (id: number) => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/buildathon/documents/${id}/activate`), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Delete this document?')) return;
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/buildathon/documents/${id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleToggleEndpoint = async (
    endpoint: 'customersEndpointEnabled' | 'ordersEndpointEnabled' | 'productsEndpointEnabled'
  ) => {
    const token = localStorage.getItem('token');
    const newValue = apiState ? !apiState[endpoint] : true;
    await fetch(getApiUrl('/buildathon/api-state'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ [endpoint]: newValue }),
    });
    fetchData();
  };

  const handleToggleAllEndpoints = async () => {
    const token = localStorage.getItem('token');
    const currentState = apiState || stats?.apiState;
    const allEnabled = currentState
      ? currentState.customersEndpointEnabled &&
        currentState.ordersEndpointEnabled &&
        currentState.productsEndpointEnabled
      : false;
    const nextValue = !allEnabled;

    await fetch(getApiUrl('/buildathon/api-state'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        customersEndpointEnabled: nextValue,
        ordersEndpointEnabled: nextValue,
        productsEndpointEnabled: nextValue,
      }),
    });
    fetchData();
  };

  const handleDeleteTeam = async (id: number) => {
    if (!confirm('Delete this team?')) return;
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/buildathon/teams/${id}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleEditTeamOpen = (team: Team) => {
    setEditingTeamId(team.id);
    setEditTeamForm({
      teamName: team.teamName,
      participant1: team.participant1,
      participant2: team.participant2 || '',
      participant3: team.participant3 || '',
      participant4: team.participant4 || '',
      email: team.email || '',
      phone: team.phone || '',
    });
  };

  const handleEditTeamSave = async (id: number) => {
    const token = localStorage.getItem('token');
    setSavingTeam(true);
    try {
      const res = await fetch(getApiUrl(`/buildathon/teams/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamName: editTeamForm.teamName,
          participant1: editTeamForm.participant1,
          participant2: editTeamForm.participant2 || undefined,
          participant3: editTeamForm.participant3 || undefined,
          participant4: editTeamForm.participant4 || undefined,
          email: editTeamForm.email || undefined,
          phone: editTeamForm.phone || undefined,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      setEditingTeamId(null);
      fetchData();
    } catch {
      setError('Failed to update team');
    } finally {
      setSavingTeam(false);
    }
  };

  const persistCountdown = (payload: {
    endTime: number | null;
    running: boolean;
    remaining: number;
  }) => {
    localStorage.setItem('buildathonCountdown', JSON.stringify(payload));
  };

  const handleResetMetrics = async () => {
    if (!confirm('Reset all metrics? This will clear request logs.')) return;
    const token = localStorage.getItem('token');
    setResettingMetrics(true);
    try {
      const res = await fetch(getApiUrl('/buildathon/metrics/reset'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Reset failed');
      fetchData();
    } catch {
      setError('Failed to reset metrics');
    } finally {
      setResettingMetrics(false);
    }
  };

  const sortedTeams = [...teams].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const activeDocument = documents.find((doc) => doc.isActive) || documents[0];

  useEffect(() => {
    if (!isCountdownRunning || !countdownEndTime) return;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((countdownEndTime - Date.now()) / 1000));
      setCountdownSeconds(remaining);
      if (remaining === 0) {
        setIsCountdownRunning(false);
        setCountdownEndTime(null);
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [countdownEndTime, isCountdownRunning]);

  useEffect(() => {
    if (!countdownLoaded) return;
    persistCountdown({
      endTime: countdownEndTime,
      running: isCountdownRunning,
      remaining: countdownSeconds,
    });
  }, [countdownEndTime, countdownSeconds, countdownLoaded, isCountdownRunning]);

  const formatCountdown = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  };

  if (loading) return <PageLoader message="Loading Buildathon..." />;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'teams', label: 'Teams' },
    { key: 'documents', label: 'Documents & QR' },
    { key: 'api-control', label: 'API Control' },
    { key: 'metrics', label: 'Metrics' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buildathon"
        subtitle="Dashboard builder competition with live API endpoints"
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
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  API Endpoints Status (Quick Control)
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enable or disable all participant API endpoints with one click.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant={
                    (apiState || stats.apiState).customersEndpointEnabled ? 'purple' : 'inactive'
                  }
                >
                  /data/customers
                </Badge>
                <Badge
                  variant={
                    (apiState || stats.apiState).ordersEndpointEnabled ? 'purple' : 'inactive'
                  }
                >
                  /data/orders
                </Badge>
                <Badge
                  variant={
                    (apiState || stats.apiState).productsEndpointEnabled ? 'purple' : 'inactive'
                  }
                >
                  /data/products
                </Badge>
                <Button
                  variant={
                    (apiState || stats.apiState).customersEndpointEnabled &&
                    (apiState || stats.apiState).ordersEndpointEnabled &&
                    (apiState || stats.apiState).productsEndpointEnabled
                      ? 'danger-soft'
                      : 'primary'
                  }
                  onClick={handleToggleAllEndpoints}
                >
                  {(apiState || stats.apiState).customersEndpointEnabled &&
                  (apiState || stats.apiState).ordersEndpointEnabled &&
                  (apiState || stats.apiState).productsEndpointEnabled
                    ? 'Disable All'
                    : 'Enable All'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overview Stats</h3>
              <p className="text-sm text-gray-500">Live totals for the current round</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <StatCard
                icon={<span className="text-lg font-semibold">T</span>}
                value={stats.totalTeams}
                label="Teams Registered"
                iconColor="text-primary-600"
              />
              <StatCard
                icon={<span className="text-lg font-semibold">R</span>}
                value={stats.totalRequests}
                label="API Requests"
                iconColor="text-emerald-600"
              />
              <StatCard
                icon={<span className="text-lg font-semibold">E</span>}
                value={
                  (stats.apiState.customersEndpointEnabled ? 1 : 0) +
                  (stats.apiState.ordersEndpointEnabled ? 1 : 0) +
                  (stats.apiState.productsEndpointEnabled ? 1 : 0)
                }
                label="Active Endpoints"
                iconColor="text-amber-600"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col lg:items-center lg:justify-between gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  Live Round Timer
                </h3>
              </div>
              <div className="flex flex-col gap-5 w-full ">
                <div className="w-full px-10 py-10 rounded-[2.5rem] bg-gray-900 text-white font-mono text-6xl md:text-7xl lg:text-8xl font-bold tracking-[0.2em] text-center shadow-lg min-h-[160px] flex items-center justify-center">
                  {formatCountdown(countdownSeconds)}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Button
                    variant={isCountdownRunning ? 'danger-soft' : 'primary'}
                    onClick={() => {
                      if (isCountdownRunning) {
                        const remaining = countdownEndTime
                          ? Math.max(0, Math.floor((countdownEndTime - Date.now()) / 1000))
                          : countdownSeconds;
                        setCountdownSeconds(remaining);
                        setIsCountdownRunning(false);
                        setCountdownEndTime(null);
                        persistCountdown({
                          endTime: null,
                          running: false,
                          remaining,
                        });
                        return;
                      }

                      const nextSeconds = countdownSeconds === 0 ? 2 * 60 * 60 : countdownSeconds;
                      const endTime = Date.now() + nextSeconds * 1000;
                      setCountdownSeconds(nextSeconds);
                      setCountdownEndTime(endTime);
                      setIsCountdownRunning(true);
                      persistCountdown({
                        endTime,
                        running: true,
                        remaining: nextSeconds,
                      });
                    }}
                  >
                    {isCountdownRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCountdownSeconds(2 * 60 * 60);
                      setIsCountdownRunning(false);
                      setCountdownEndTime(null);
                      persistCountdown({
                        endTime: null,
                        running: false,
                        remaining: 2 * 60 * 60,
                      });
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== TEAMS TAB ==================== */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Registered Teams ({teams.length})
            </h3>
            <p className="text-sm text-gray-500">Showing newest first</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedTeams.map((team) => (
              <Card key={team.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{team.teamName}</h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Registered {new Date(team.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEditTeamOpen(team)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Participants</p>
                    <div className="mt-2 space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple">Lead</Badge>
                        <span>{team.participant1}</span>
                      </div>
                      {team.participant2 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="inactive">Member</Badge>
                          <span>{team.participant2}</span>
                        </div>
                      )}
                      {team.participant3 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="inactive">Member</Badge>
                          <span>{team.participant3}</span>
                        </div>
                      )}
                      {team.participant4 && (
                        <div className="flex items-center gap-2">
                          <Badge variant="inactive">Member</Badge>
                          <span>{team.participant4}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400">Contact</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                      {team.email && (
                        <span className="px-2 py-1 bg-gray-100 rounded-lg">{team.email}</span>
                      )}
                      {team.phone && (
                        <span className="px-2 py-1 bg-gray-100 rounded-lg">{team.phone}</span>
                      )}
                      {!team.email && !team.phone && (
                        <span className="text-gray-400">No contact provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {editingTeamId === team.id && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input
                        label="Team Name"
                        value={editTeamForm.teamName}
                        onChange={(e) =>
                          setEditTeamForm({ ...editTeamForm, teamName: e.target.value })
                        }
                      />
                      <Input
                        label="Lead Participant"
                        value={editTeamForm.participant1}
                        onChange={(e) =>
                          setEditTeamForm({ ...editTeamForm, participant1: e.target.value })
                        }
                      />
                      <Input
                        label="Participant 2"
                        value={editTeamForm.participant2}
                        onChange={(e) =>
                          setEditTeamForm({ ...editTeamForm, participant2: e.target.value })
                        }
                      />
                      <Input
                        label="Participant 3"
                        value={editTeamForm.participant3}
                        onChange={(e) =>
                          setEditTeamForm({ ...editTeamForm, participant3: e.target.value })
                        }
                      />
                      <Input
                        label="Participant 4"
                        value={editTeamForm.participant4}
                        onChange={(e) =>
                          setEditTeamForm({ ...editTeamForm, participant4: e.target.value })
                        }
                      />
                      <Input
                        label="Email"
                        value={editTeamForm.email}
                        onChange={(e) =>
                          setEditTeamForm({ ...editTeamForm, email: e.target.value })
                        }
                      />
                      <Input
                        label="Phone"
                        value={editTeamForm.phone}
                        onChange={(e) =>
                          setEditTeamForm({ ...editTeamForm, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditTeamSave(team.id)}
                        loading={savingTeam}
                      >
                        Save Changes
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditingTeamId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {sortedTeams.length === 0 && (
              <Card className="p-8 text-center text-gray-400 sm:col-span-2 xl:col-span-3">
                No teams registered yet
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ==================== DOCUMENTS TAB ==================== */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* QR Codes Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Team Registration QR Code Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Team Registration QR Code
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Display this QR at the venue for participants to scan and register their teams.
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-xl shadow-sm border-2 border-primary-200">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://xianze.tech'}/events/buildathon/register`}
                    size={160}
                    level="H"
                    fgColor="#6D40D4"
                    bgColor="#FFFFFF"
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Links to: /events/buildathon/register
                </p>
              </div>
            </Card>

            {/* API Documentation QR Code Card */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                API Documentation QR Code
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Participants scan this to access the API docs with endpoints, examples, and
                dashboard requirements.
              </p>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-white rounded-xl shadow-sm border-2 border-indigo-200">
                  <QRCodeSVG
                    value={`${typeof window !== 'undefined' ? window.location.origin : 'https://xianze.tech'}/events/buildathon/api-docs`}
                    size={160}
                    level="H"
                    fgColor="#4F46E5"
                    bgColor="#FFFFFF"
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Links to: /events/buildathon/api-docs
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== API CONTROL TAB ==================== */}
      {activeTab === 'api-control' && apiState && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoint Control</h3>
          <p className="text-sm text-gray-500 mb-6">
            Toggle endpoints on/off to control participant access to data. Requests are logged for
            metrics.
          </p>
          <div className="space-y-4">
            {/* Customers Endpoint */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
              <div>
                <p className="font-semibold text-gray-900">GET /api/buildathon/data/customers</p>
                <p className="text-sm text-gray-500">Returns 8 customer records (JSON)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={apiState.customersEndpointEnabled ? 'purple' : 'inactive'}>
                  {apiState.customersEndpointEnabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
                <Button
                  variant={apiState.customersEndpointEnabled ? 'danger-soft' : 'primary-soft'}
                  size="sm"
                  onClick={() => handleToggleEndpoint('customersEndpointEnabled')}
                >
                  {apiState.customersEndpointEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>

            {/* Orders Endpoint */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
              <div>
                <p className="font-semibold text-gray-900">GET /api/buildathon/data/orders</p>
                <p className="text-sm text-gray-500">Returns 10 order records with items (JSON)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={apiState.ordersEndpointEnabled ? 'purple' : 'inactive'}>
                  {apiState.ordersEndpointEnabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
                <Button
                  variant={apiState.ordersEndpointEnabled ? 'danger-soft' : 'primary-soft'}
                  size="sm"
                  onClick={() => handleToggleEndpoint('ordersEndpointEnabled')}
                >
                  {apiState.ordersEndpointEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>

            {/* Products Endpoint */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
              <div>
                <p className="font-semibold text-gray-900">GET /api/buildathon/data/products</p>
                <p className="text-sm text-gray-500">Returns 10 product records (JSON)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={apiState.productsEndpointEnabled ? 'purple' : 'inactive'}>
                  {apiState.productsEndpointEnabled ? 'ENABLED' : 'DISABLED'}
                </Badge>
                <Button
                  variant={apiState.productsEndpointEnabled ? 'danger-soft' : 'primary-soft'}
                  size="sm"
                  onClick={() => handleToggleEndpoint('productsEndpointEnabled')}
                >
                  {apiState.productsEndpointEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-2">Participant API Usage</h4>
            <p className="text-sm text-gray-500">
              Participants can fetch data from enabled endpoints using:
            </p>
            <code className="block mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto">
              GET {process.env.NEXT_PUBLIC_API_URL || 'https://xianze.tech/api'}
              /buildathon/data/customers
            </code>
          </div>
        </Card>
      )}

      {/* ==================== METRICS TAB ==================== */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Metrics Overview</h3>
            <Button variant="danger-soft" onClick={handleResetMetrics} loading={resettingMetrics}>
              Reset Metrics
            </Button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard
              icon={<span className="text-2xl">📈</span>}
              value={metrics.totalRequests}
              label="Total Requests"
              iconColor="text-primary-600"
            />
            {metrics.requestsByEndpoint.map((ep) => (
              <StatCard
                key={ep.endpoint}
                icon={<span className="text-2xl">🔗</span>}
                value={ep.count}
                label={`/${ep.endpoint}`}
                iconColor="text-blue-600"
              />
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Requests Per Minute (Last 30 min)
            </h3>
            <div className="h-48 flex items-end gap-1">
              {metrics.requestsPerMinute.length > 0 ? (
                metrics.requestsPerMinute.map((rpm, idx) => {
                  const maxCount = Math.max(...metrics.requestsPerMinute.map((r) => r.count), 1);
                  const height = (rpm.count / maxCount) * 100;
                  return (
                    <div
                      key={idx}
                      className="flex-1 bg-primary-500 rounded-t hover:bg-primary-600 transition-colors"
                      style={{ height: `${height}%`, minHeight: rpm.count > 0 ? '4px' : '0' }}
                      title={`${rpm.minute}: ${rpm.count} requests`}
                    />
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  No requests in the last 30 minutes
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h3>
            <div className="overflow-x-auto admin-scrollbar max-h-96">
              <table className="admin-table min-w-full">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th>Endpoint</th>
                    <th>IP Address</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentRequests.map((req) => (
                    <tr key={req.id}>
                      <td>
                        <Badge variant="purple">{req.endpoint}</Badge>
                      </td>
                      <td className="text-sm text-gray-500">{req.ipAddress || 'Unknown'}</td>
                      <td className="text-sm text-gray-400">
                        {new Date(req.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {metrics.recentRequests.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-400">
                        No requests logged yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
