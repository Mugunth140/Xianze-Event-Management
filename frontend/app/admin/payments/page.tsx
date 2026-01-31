'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import { PageLoader } from '../components/ui/Spinner';
import useAuth from '../hooks/useAuth';

interface Registration {
  id: number;
  name: string;
  email: string;
  college: string;
  event: string;
  transactionId: string | null;
  paymentStatus: 'pending' | 'verified' | 'rejected';
  paymentMode?: 'online' | 'cash';
  verifiedAt: string | null;
  createdAt: string;
  screenshotPath?: string;
}

interface VerifiedByGroup {
  verifier: {
    id: number;
    name: string;
    username: string;
    role: 'admin' | 'coordinator' | 'member';
  };
  totalVerified: number;
  registrations: Registration[];
}

const AVAILABLE_EVENTS = [
  'Paper Presentation',
  'Bug Smash',
  'Buildathon',
  'Think & Link',
  'Ctrl + Quiz',
  'Gaming',
  'Fun Games',
  'Code Hunt',
];

export default function PaymentsPage() {
  const { isAdmin } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [verifiedGroups, setVerifiedGroups] = useState<VerifiedByGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'all' | 'online' | 'cash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [actionType, setActionType] = useState<'verify' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'verifiedBy'>('pending');

  // Screenshot viewing state
  const [viewingScreenshot, setViewingScreenshot] = useState<{ id: number; name: string } | null>(
    null
  );
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotLoading, setScreenshotLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchPayments = useCallback(async () => {
    if (activeTab === 'verifiedBy' && !isAdmin) {
      setVerifiedGroups([]);
      setRegistrations([]);
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const endpoint =
        activeTab === 'pending'
          ? '/payments/pending'
          : activeTab === 'history'
            ? '/payments/history'
            : '/payments/verified-by';
      const url = eventFilter ? `${endpoint}?event=${encodeURIComponent(eventFilter)}` : endpoint;
      const res = await fetch(getApiUrl(url), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      if (activeTab === 'verifiedBy') {
        setVerifiedGroups(data || []);
        setRegistrations([]);
      } else {
        setRegistrations(data || []);
        setVerifiedGroups([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [activeTab, eventFilter]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'verifiedBy') {
      setActiveTab('pending');
    }
  }, [isAdmin, activeTab]);

  const handleViewScreenshot = async (reg: Registration) => {
    if (!reg.screenshotPath) {
      setError('No screenshot file available for this payment');
      return;
    }

    setViewingScreenshot({ id: reg.id, name: reg.name });
    setScreenshotLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(getApiUrl(`/register/screenshot/${reg.id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load screenshot');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      setScreenshotUrl(url);
    } catch (err) {
      setError('Failed to load screenshot image');
      setViewingScreenshot(null);
    } finally {
      setScreenshotLoading(false);
    }
  };

  const closeScreenshotModal = () => {
    if (screenshotUrl) {
      window.URL.revokeObjectURL(screenshotUrl);
    }
    setScreenshotUrl(null);
    setViewingScreenshot(null);
  };

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
      (paymentModeFilter === 'all' || reg.paymentMode === paymentModeFilter) &&
      (reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.transactionId?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return verifiedGroups;
    const query = searchQuery.toLowerCase();
    return verifiedGroups
      .map((group) => {
        const registrations = group.registrations.filter(
          (reg) =>
            (paymentModeFilter === 'all' || reg.paymentMode === paymentModeFilter) &&
            (reg.name.toLowerCase().includes(query) ||
              reg.email.toLowerCase().includes(query) ||
              reg.transactionId?.toLowerCase().includes(query))
        );
        return { ...group, registrations, totalVerified: registrations.length };
      })
      .filter((group) => group.totalVerified > 0);
  }, [verifiedGroups, searchQuery, paymentModeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, eventFilter, paymentModeFilter, activeTab]);

  // Paginated data
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRegistrations.slice(start, start + itemsPerPage);
  }, [filteredRegistrations, currentPage, itemsPerPage]);

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
        {isAdmin && (
          <button
            onClick={() => setActiveTab('verifiedBy')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'verifiedBy'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            Verified By
          </button>
        )}
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
          <div className="w-full sm:w-40">
            <Select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value as 'all' | 'online' | 'cash')}
              options={[
                { value: 'all', label: 'All Modes' },
                { value: 'online', label: 'Online' },
                { value: 'cash', label: 'Cash' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Payments List */}
      {loading ? (
        <PageLoader message="Loading payments..." />
      ) : activeTab === 'verifiedBy' && isAdmin ? (
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <Card className="p-6 text-center text-gray-500">No verified payments found.</Card>
          ) : (
            filteredGroups.map((group) => (
              <Card key={group.verifier.id} className="p-0 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-6 border-b">
                  <div>
                    <p className="text-sm text-gray-500">Verified By</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-gray-900">{group.verifier.name}</p>
                      <Badge variant="purple" className="capitalize">
                        {group.verifier.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">@{group.verifier.username}</p>
                  </div>
                  <Badge variant="success">{group.totalVerified} verified</Badge>
                </div>

                <div className="overflow-x-auto admin-scrollbar">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Event</th>
                        <th>Mode</th>
                        <th>Transaction ID</th>
                        <th>Verified On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.registrations.map((reg) => (
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
                            <Badge variant={reg.paymentMode === 'cash' ? 'warning' : 'success'}>
                              {reg.paymentMode === 'cash' ? 'Cash' : 'Online'}
                            </Badge>
                          </td>
                          <td>
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {reg.transactionId || 'N/A'}
                            </code>
                          </td>
                          <td className="text-gray-500">
                            {reg.verifiedAt ? new Date(reg.verifiedAt).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Participant</th>
                <th>Event</th>
                <th>Mode</th>
                <th>Transaction ID</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRegistrations.map((reg) => (
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
                    <Badge variant={reg.paymentMode === 'cash' ? 'warning' : 'success'}>
                      {reg.paymentMode === 'cash' ? 'Cash' : 'Online'}
                    </Badge>
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
                  <td>
                    <div className="flex gap-2">
                      {/* View Screenshot Button */}
                      {reg.screenshotPath && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleViewScreenshot(reg)}
                          title="View Payment Screenshot"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </Button>
                      )}

                      {activeTab === 'pending' && (
                        <>
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
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedRegistrations.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    {activeTab === 'pending' ? 'No pending payments' : 'No payment history'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredRegistrations.length}
            itemsPerPage={itemsPerPage}
          />
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

      {/* Screenshot Viewer Modal */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
            onClick={closeScreenshotModal}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-auto max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">
                Transaction Screenshot: {viewingScreenshot.name}
              </h3>
              <button
                onClick={closeScreenshotModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50 min-h-[300px]">
              {screenshotLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Loading image...</p>
                </div>
              ) : screenshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={screenshotUrl}
                  alt="Payment Screenshot"
                  className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
                />
              ) : (
                <p className="text-red-500">Failed to load image</p>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <a
                href={screenshotUrl || '#'}
                download={`payment-screenshot-${viewingScreenshot.id}.jpg`}
                className={`px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors ${!screenshotUrl ? 'opacity-50 pointer-events-none' : ''}`}
              >
                Download Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
