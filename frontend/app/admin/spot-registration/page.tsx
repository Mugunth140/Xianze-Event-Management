'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';

interface SpotRegistration {
  id: number;
  name: string;
  email: string;
  college: string;
  course: string;
  branch: string;
  contact: string;
  event: string;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  passEmailSent: boolean;
  createdAt: string;
}

export default function SpotRegistrationPage() {
  const [registrations, setRegistrations] = useState<SpotRegistration[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingToggle, setProcessingToggle] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [stateRes, regsRes] = await Promise.all([
        fetch(getApiUrl('/spot-registration/state'), { headers }),
        fetch(getApiUrl('/spot-registration'), { headers }),
      ]);

      const stateData = await stateRes.json();
      const regsData = await regsRes.json();

      setEnabled(Boolean(stateData.enabled));
      setRegistrations(regsData.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load spot registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = async () => {
    const token = localStorage.getItem('token');
    setProcessingToggle(true);
    try {
      const res = await fetch(getApiUrl('/spot-registration/state'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !enabled }),
      });
      if (!res.ok) throw new Error('Failed to update spot registration state');
      const data = await res.json();
      setEnabled(Boolean(data.enabled));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update spot registration state');
    } finally {
      setProcessingToggle(false);
    }
  };

  const handleVerify = async (id: number) => {
    const token = localStorage.getItem('token');
    setVerifyingId(id);
    try {
      const res = await fetch(getApiUrl(`/spot-registration/${id}/verify`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to verify spot registration');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify spot registration');
    } finally {
      setVerifyingId(null);
    }
  };

  const totalPending = useMemo(
    () => registrations.filter((reg) => reg.paymentStatus === 'pending').length,
    [registrations]
  );

  if (loading) return <PageLoader message="Loading spot registrations..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spot Registration"
        subtitle="Manage on-the-spot registrations and send event passes"
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          {error}
          <button onClick={() => setError('')} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Spot Registration Access</h3>
            <p className="text-sm text-gray-500 mt-1">
              Toggle to open or close the participant spot registration page.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={enabled ? 'success' : 'inactive'}>{enabled ? 'OPEN' : 'CLOSED'}</Badge>
            <Button
              variant={enabled ? 'danger-soft' : 'primary'}
              onClick={handleToggle}
              loading={processingToggle}
            >
              {enabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Spot Verifications</h3>
          <Badge variant={totalPending > 0 ? 'purple' : 'inactive'}>{totalPending} pending</Badge>
        </div>

        <div className="overflow-x-auto admin-scrollbar">
          <table className="admin-table min-w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Event</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Pass Mail</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  <td>
                    <div>
                      <p className="font-medium text-gray-900">{reg.name}</p>
                      <p className="text-sm text-gray-500">{reg.email}</p>
                      <p className="text-xs text-gray-400">{reg.college}</p>
                    </div>
                  </td>
                  <td>
                    <Badge variant="purple">{reg.event}</Badge>
                  </td>
                  <td>
                    <div className="text-sm text-gray-600">
                      <p>{reg.contact}</p>
                      <p className="text-xs text-gray-400">
                        {reg.course} · {reg.branch}
                      </p>
                    </div>
                  </td>
                  <td>
                    <Badge variant={reg.paymentStatus === 'verified' ? 'success' : 'inactive'}>
                      {reg.paymentStatus === 'verified' ? 'Verified' : 'Pending'}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={reg.passEmailSent ? 'success' : 'inactive'}>
                      {reg.passEmailSent ? 'Sent' : 'Not sent'}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleVerify(reg.id)}
                      loading={verifyingId === reg.id}
                    >
                      Verify & Send Pass
                    </Button>
                  </td>
                </tr>
              ))}

              {registrations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    No spot registrations yet
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
