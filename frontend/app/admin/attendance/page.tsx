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

interface Registration {
  id: number;
  name: string;
  email: string;
  college: string;
  event: string;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

interface AttendanceStats {
  total: number;
  checkedIn: number;
  pending: number;
}

const AVAILABLE_EVENTS = [
  'Paper Presentation',
  'Bug Smash',
  'Buildathon',
  'Think & Link',
  'Ctrl + Quiz',
  'Gaming',
  'Code Hunt',
];

export default function AttendancePage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    message: string;
    registration?: Registration;
  } | null>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const [regsRes, statsRes] = await Promise.all([
        fetch(
          getApiUrl(
            `/attendance/registrations${eventFilter ? `?event=${encodeURIComponent(eventFilter)}` : ''}`
          ),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        fetch(
          getApiUrl(
            `/attendance/stats${eventFilter ? `?event=${encodeURIComponent(eventFilter)}` : ''}`
          ),
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      if (!regsRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');

      setRegistrations(await regsRes.json());
      setStats(await statsRes.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const handleCheckIn = async (registrationId: number) => {
    const token = localStorage.getItem('token');
    setCheckingIn(true);
    setCheckInResult(null);

    try {
      const res = await fetch(getApiUrl('/attendance/check-in'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ registrationId }),
      });

      const data = await res.json();
      setCheckInResult(data);

      if (data.success) {
        fetchData(); // Refresh data
      }
    } catch (err) {
      setCheckInResult({
        success: false,
        message: err instanceof Error ? err.message : 'Check-in failed',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const handleManualCheckIn = async () => {
    const id = parseInt(manualCode);
    if (isNaN(id)) {
      setCheckInResult({ success: false, message: 'Invalid registration ID' });
      return;
    }
    await handleCheckIn(id);
    setManualCode('');
  };

  const filteredRegistrations = registrations.filter(
    (reg) =>
      reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Check-in"
        subtitle="Scan QR codes or manually check-in participants"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            value={stats.total}
            label="Total Registered"
            iconColor="text-primary-600"
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
            value={stats.checkedIn}
            label="Checked In"
            iconColor="text-emerald-600"
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
            iconColor="text-amber-600"
          />
        </div>
      )}

      {/* Manual Check-in / QR Scanner Placeholder */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Check-in</h2>

        {/* Check-in result feedback */}
        {checkInResult && (
          <div
            className={`mb-4 p-4 rounded-xl ${
              checkInResult.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <div className="flex items-center gap-3">
              {checkInResult.success ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <div>
                <p className="font-medium">{checkInResult.message}</p>
                {checkInResult.registration && (
                  <p className="text-sm mt-1">
                    {checkInResult.registration.name} - {checkInResult.registration.event}
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setCheckInResult(null)} className="mt-3 text-sm underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Enter Registration ID..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualCheckIn()}
            />
          </div>
          <Button onClick={handleManualCheckIn} loading={checkingIn} size="lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Check In
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-3">
          Tip: QR scanner integration coming soon. For now, enter the registration ID manually.
        </p>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              options={[
                { value: '', label: 'All Events' },
                ...AVAILABLE_EVENTS.map((e) => ({ value: e, label: e })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Registrations List */}
      {loading ? (
        <PageLoader message="Loading registrations..." />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Participant</th>
                <th>Event</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id}>
                  <td className="font-mono text-sm">{reg.id}</td>
                  <td>
                    <div>
                      <p className="font-medium text-gray-900">{reg.name}</p>
                      <p className="text-sm text-gray-500">{reg.email}</p>
                    </div>
                  </td>
                  <td>
                    <Badge variant="purple">{reg.event}</Badge>
                  </td>
                  <td>
                    <Badge
                      variant={
                        reg.paymentStatus === 'verified'
                          ? 'success'
                          : reg.paymentStatus === 'rejected'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {reg.paymentStatus}
                    </Badge>
                  </td>
                  <td>
                    {reg.isCheckedIn ? (
                      <Badge variant="success" dot>
                        Checked In
                      </Badge>
                    ) : (
                      <Badge variant="inactive">Not Checked In</Badge>
                    )}
                  </td>
                  <td>
                    {!reg.isCheckedIn && reg.paymentStatus === 'verified' ? (
                      <Button size="sm" onClick={() => handleCheckIn(reg.id)} loading={checkingIn}>
                        Check In
                      </Button>
                    ) : !reg.isCheckedIn && reg.paymentStatus !== 'verified' ? (
                      <span className="text-sm text-gray-400">Payment pending</span>
                    ) : (
                      <span className="text-sm text-gray-400">
                        {reg.checkedInAt && new Date(reg.checkedInAt).toLocaleTimeString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No registrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
