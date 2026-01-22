'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { PageLoader } from '../components/ui/Spinner';

interface Registration {
  id: number;
  name: string;
  email: string;
  college: string;
  event: string;
  transactionId: string | null;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt: string | null;
  createdAt: string;
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

export default function PaymentsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const fetchPayments = useCallback(async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const endpoint = activeTab === 'pending' ? '/payments/pending' : '/payments/history';
      const url = eventFilter ? `${endpoint}?event=${encodeURIComponent(eventFilter)}` : endpoint;
      const res = await fetch(getApiUrl(url), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      setRegistrations(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [activeTab, eventFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleVerify = async () => {
    if (!selectedReg) return;
    setProcessing(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(getApiUrl(`/payments/${selectedReg.id}/verify`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: 'Verified' }),
      });

      if (!res.ok) throw new Error('Failed to verify payment');
      setSelectedReg(null);
      setActionType(null);
      fetchPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReg) return;
    setProcessing(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(getApiUrl(`/payments/${selectedReg.id}/reject`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason || 'Payment rejected' }),
      });

      if (!res.ok) throw new Error('Failed to reject payment');
      setSelectedReg(null);
      setActionType(null);
      setRejectReason('');
      fetchPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRegistrations = registrations.filter(
    (reg) =>
      reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.transactionId?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = registrations.filter((r) => r.paymentStatus === 'pending').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Verification"
        subtitle="Review and verify participant payment transactions"
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
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          Pending
          {pendingCount > 0 && (
            <Badge variant="warning" className="ml-2">
              {pendingCount}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          History
        </button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or transaction ID..."
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

      {/* Payments List */}
      {loading ? (
        <PageLoader message="Loading payments..." />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Event</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Date</th>
                {activeTab === 'pending' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id}>
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
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {reg.transactionId || 'N/A'}
                    </code>
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
                  <td className="text-gray-500">{new Date(reg.createdAt).toLocaleDateString()}</td>
                  {activeTab === 'pending' && (
                    <td>
                      <div className="flex gap-2">
                        <Button
                          variant="primary-soft"
                          size="sm"
                          onClick={() => {
                            setSelectedReg(reg);
                            setActionType('verify');
                          }}
                        >
                          Verify
                        </Button>
                        <Button
                          variant="danger-soft"
                          size="sm"
                          onClick={() => {
                            setSelectedReg(reg);
                            setActionType('reject');
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td
                    colSpan={activeTab === 'pending' ? 6 : 5}
                    className="py-8 text-center text-gray-500"
                  >
                    {activeTab === 'pending' ? 'No pending payments' : 'No payment history'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Verify Confirmation */}
      <ConfirmModal
        isOpen={actionType === 'verify' && !!selectedReg}
        onClose={() => {
          setSelectedReg(null);
          setActionType(null);
        }}
        onConfirm={handleVerify}
        title="Verify Payment"
        message={`Confirm verification for ${selectedReg?.name}? Transaction ID: ${selectedReg?.transactionId || 'N/A'}`}
        confirmText={processing ? 'Processing...' : 'Verify Payment'}
      />

      {/* Reject Modal */}
      {actionType === 'reject' && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={() => {
              setSelectedReg(null);
              setActionType(null);
            }}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Payment</h2>
            <p className="text-gray-600 mb-4">
              Rejecting payment for <strong>{selectedReg.name}</strong>
            </p>
            <Input
              label="Reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Invalid transaction ID"
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setSelectedReg(null);
                  setActionType(null);
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleReject}
                loading={processing}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
