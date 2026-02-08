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

export default function CertificateComplaintsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [complaints, setComplaints] = useState<CertificateComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteComplaint, setDeleteComplaint] = useState<CertificateComplaint | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const itemsPerPage = 12;

  useEffect(() => {
    const fetchComplaints = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const res = await fetch(getApiUrl('/certificates/complaints'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/admin/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch certificate complaints');
        }

        const data = await res.json();
        setComplaints(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load complaints');
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
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

      if (!res.ok) throw new Error('Failed to delete complaint');

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
      a.download = `certificate-complaints-${new Date().toISOString().slice(0, 10)}.xlsx`;
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
          title="Certificate Requests"
          subtitle={`${filteredComplaints.length} request${filteredComplaints.length !== 1 ? 's' : ''}`}
        />
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
              Export to Excel
            </span>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

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
