'use client';

import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import useAuth from '../hooks/useAuth';

interface CertificateComplaint {
  id: number;
  name: string;
  email: string;
  events: string; // JSON stringified array
  createdAt: string;
}

interface EmailLogEntry {
  id: number;
  batchId: string;
  email: string;
  emailPrefix: string;
  filenames: string; // JSON stringified array
  status: 'success' | 'failed' | 'pending' | 'no-files' | 'skipped';
  error: string | null;
  sentAt: string;
}

interface BatchSendResult {
  batchId: string;
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  noFiles: number;
  results: Array<{
    email: string;
    status: 'success' | 'failed' | 'no-files' | 'skipped';
    filenames: string[];
    error?: string;
  }>;
}

export default function CertificateComplaintsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [complaints, setComplaints] = useState<CertificateComplaint[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteComplaint, setDeleteComplaint] = useState<CertificateComplaint | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [batchResult, setBatchResult] = useState<BatchSendResult | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'email-logs' | 'email-sender'>(
    'requests'
  );
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderFile, setSenderFile] = useState<File | null>(null);
  const [senderSending, setSenderSending] = useState(false);
  const [senderResult, setSenderResult] = useState<'success' | 'failed' | null>(null);

  const itemsPerPage = 12;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const [complaintsRes, logsRes] = await Promise.all([
          fetch(getApiUrl('/certificates/complaints'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(getApiUrl('/certificates/email-logs'), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (complaintsRes.status === 401 || logsRes.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/admin/login');
          return;
        }

        if (!complaintsRes.ok) throw new Error('Failed to fetch certificate requests');

        const complaintsData = await complaintsRes.json();
        setComplaints(Array.isArray(complaintsData.data) ? complaintsData.data : []);

        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setEmailLogs(Array.isArray(logsData.data) ? logsData.data : []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const filteredComplaints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return complaints;

    return complaints.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        JSON.parse(item.events).join(', ').toLowerCase().includes(query)
    );
  }, [complaints, searchQuery]);

  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async () => {
    if (!deleteComplaint) return;
    setDeleting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl(`/certificates/complaints/${deleteComplaint.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete request');

      setComplaints((prev) => prev.filter((c) => c.id !== deleteComplaint.id));
      setDeleteComplaint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl('/certificates/complaints/export'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-requests-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleSendBatch = async () => {
    setSending(true);
    setError('');
    setBatchResult(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl('/certificates/send-batch'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error('Failed to send batch emails');

      const data = await res.json();
      setBatchResult(data.data);
      setActiveTab('email-logs');

      // Refresh email logs
      const logsRes = await fetch(getApiUrl('/certificates/email-logs'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setEmailLogs(Array.isArray(logsData.data) ? logsData.data : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch send failed');
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (logId: number) => {
    setResendingId(logId);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl(`/certificates/resend/${logId}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Resend failed');

      const data = await res.json();
      if (data.success) {
        setEmailLogs((prev) =>
          prev.map((log) => (log.id === logId ? { ...log, status: 'success', error: null } : log))
        );
      } else {
        setError(data.data?.error || 'Resend failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resend failed');
    } finally {
      setResendingId(null);
    }
  };

  const handleSendSingle = async () => {
    if (!senderEmail || !senderFile) return;
    setSenderSending(true);
    setSenderResult(null);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('email', senderEmail);
      formData.append('name', senderName || 'Participant');
      formData.append('file', senderFile);

      const res = await fetch(getApiUrl('/certificates/send-single'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Send failed');

      const data = await res.json();
      setSenderResult(data.success ? 'success' : 'failed');

      if (data.success) {
        setSenderEmail('');
        setSenderName('');
        setSenderFile(null);
        const fileInput = document.getElementById('cert-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        // Refresh email logs
        const logsRes = await fetch(getApiUrl('/certificates/email-logs'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          setEmailLogs(Array.isArray(logsData.data) ? logsData.data : []);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
      setSenderResult('failed');
    } finally {
      setSenderSending(false);
    }
  };

  // Group email logs by batch
  const logsByBatch = useMemo(() => {
    const grouped = new Map<string, EmailLogEntry[]>();
    for (const log of emailLogs) {
      if (!grouped.has(log.batchId)) {
        grouped.set(log.batchId, []);
      }
      grouped.get(log.batchId)!.push(log);
    }
    return Array.from(grouped.entries()).map(([batchId, logs]) => ({
      batchId,
      sentAt: logs[0].sentAt,
      total: logs.length,
      success: logs.filter((l) => l.status === 'success').length,
      failed: logs.filter((l) => l.status === 'failed').length,
      skipped: logs.filter((l) => l.status === 'skipped').length,
      logs,
    }));
  }, [emailLogs]);

  if (loading) return <PageLoader />;

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500">You do not have permission to view this page.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="E-Certificates"
          subtitle="Manage certificate requests and send batch emails"
        />
        <div className="flex items-center gap-3">
          <Button onClick={handleExport} disabled={exporting || complaints.length === 0}>
            {exporting ? (
              'Exporting...'
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                  />
                </svg>
                Export Excel
              </span>
            )}
          </Button>
          <button
            onClick={handleSendBatch}
            disabled={sending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Send All Certificates
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Batch Result Banner */}
      {batchResult && (
        <div
          className={`px-4 py-3 rounded-xl text-sm border ${
            batchResult.failed === 0 && (batchResult.skipped || 0) === 0
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-yellow-50 text-yellow-700 border-yellow-100'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold mb-1">
            {batchResult.failed === 0 && (batchResult.skipped || 0) === 0 ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            )}
            Batch [{batchResult.batchId}]: {batchResult.sent} sent, {batchResult.failed} failed
            {(batchResult.skipped || 0) > 0 ? `, ${batchResult.skipped} skipped` : ''} (total:{' '}
            {batchResult.total})
          </div>
          {batchResult.total === 0 && (
            <p>No certificate PDFs found in the certificates directory.</p>
          )}
          <button
            onClick={() => setBatchResult(null)}
            className="text-xs underline opacity-70 hover:opacity-100 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'requests'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Certificate Requests ({complaints.length})
        </button>
        <button
          onClick={() => setActiveTab('email-logs')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'email-logs'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Email Logs ({emailLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('email-sender')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'email-sender'
              ? 'border-violet-600 text-violet-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📧 Email Sender
        </button>
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <Card>
          <div className="p-4 border-b border-gray-100">
            <Input
              placeholder="Search by name, email, or event..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {paginatedComplaints.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
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
              <p className="text-gray-500 font-medium">
                {searchQuery ? 'No results found' : 'No certificate requests yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Events
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{complaint.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600">{complaint.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(complaint.events).map((event: string) => (
                            <span
                              key={event}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-100"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-500">
                          {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDeleteComplaint(complaint)}
                          className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </Card>
      )}

      {/* Email Logs Tab */}
      {activeTab === 'email-logs' && (
        <div className="space-y-4">
          {logsByBatch.length === 0 ? (
            <Card>
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No email sends yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  Click &ldquo;Send All Certificates&rdquo; to start batch sending
                </p>
              </div>
            </Card>
          ) : (
            logsByBatch.map((batch) => (
              <Card key={batch.batchId}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Batch #{batch.batchId}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(batch.sentAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {batch.success} sent
                    </span>
                    {batch.skipped > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        {batch.skipped} skipped
                      </span>
                    )}
                    {batch.failed > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {batch.failed} failed
                      </span>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Files
                        </th>
                        <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Error
                        </th>
                        <th className="text-right px-6 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {batch.logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3">
                            <p className="text-sm text-gray-700">{log.email}</p>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap gap-1">
                              {JSON.parse(log.filenames).map((f: string) => (
                                <span
                                  key={f}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-600"
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                log.status === 'success'
                                  ? 'bg-green-50 text-green-700'
                                  : log.status === 'skipped'
                                    ? 'bg-yellow-50 text-yellow-700'
                                    : 'bg-red-50 text-red-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  log.status === 'success'
                                    ? 'bg-green-500'
                                    : log.status === 'skipped'
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                }`}
                              />
                              {log.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <p className="text-sm text-red-500">{log.error || '—'}</p>
                          </td>
                          <td className="px-6 py-3 text-right">
                            {(log.status === 'failed' || log.status === 'skipped') && (
                              <button
                                onClick={() => handleResend(log.id)}
                                disabled={resendingId === log.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {resendingId === log.id ? 'Resending...' : 'Resend'}
                              </button>
                            )}
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
      )}

      {/* Email Sender Tab */}
      {activeTab === 'email-sender' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Send Certificate Email</h3>
            <p className="text-sm text-gray-500 mb-6">
              Manually send a certificate email from <strong>contact@xianze.tech</strong>
            </p>

            {senderResult === 'success' && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-green-50 text-green-700 border border-green-100 flex items-center gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Certificate email sent successfully!
              </div>
            )}

            {senderResult === 'failed' && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100 flex items-center gap-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Failed to send email. Please try again.
              </div>
            )}

            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="participant@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Participant name (optional)"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Certificate PDF <span className="text-red-500">*</span>
                </label>
                <input
                  id="cert-file-input"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setSenderFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
                {senderFile && (
                  <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                    <svg
                      className="w-3.5 h-3.5"
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
                    {senderFile.name} ({(senderFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <button
                onClick={handleSendSingle}
                disabled={senderSending || !senderEmail || !senderFile}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {senderSending ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Send Certificate
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteComplaint}
        onClose={() => setDeleteComplaint(null)}
        onConfirm={handleDelete}
        title="Delete Certificate Request"
        message={`Are you sure you want to delete the request from "${deleteComplaint?.name}"?`}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
