'use client';

import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { PageLoader } from '../components/ui/Spinner';
import useAuth from '../hooks/useAuth';

interface ContactInquiry {
  id: number;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function ContactInquiriesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [deleteInquiry, setDeleteInquiry] = useState<ContactInquiry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [replyInquiry, setReplyInquiry] = useState<ContactInquiry | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const itemsPerPage = 12;

  useEffect(() => {
    const fetchInquiries = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const res = await fetch(getApiUrl('/contact'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/admin/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch contact inquiries');
        }

        const data = await res.json();
        setInquiries(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load inquiries');
      } finally {
        setLoading(false);
      }
    };

    fetchInquiries();
  }, [router]);

  const filteredInquiries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return inquiries;

    return inquiries.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query)
      );
    });
  }, [inquiries, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / itemsPerPage));
  const paginatedInquiries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInquiries.slice(start, start + itemsPerPage);
  }, [filteredInquiries, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleDelete = async () => {
    if (!deleteInquiry) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      setDeleting(true);
      const res = await fetch(getApiUrl(`/contact/${deleteInquiry.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to delete inquiry');
      }

      setInquiries((prev) => prev.filter((item) => item.id !== deleteInquiry.id));
      setDeleteInquiry(null);
      setSelectedInquiry(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete inquiry');
    } finally {
      setDeleting(false);
    }
  };

  const handleReply = async () => {
    if (!replyInquiry || !replyMessage.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      setSendingReply(true);
      const res = await fetch(getApiUrl(`/contact/${replyInquiry.id}/reply`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/admin/login');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to send reply');
      }

      setReplyInquiry(null);
      setReplyMessage('');
      setSelectedInquiry(null);
      setError('');
      // Show success message
      alert('Reply sent successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading inquiries..." />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">{error}</div>
        <button onClick={() => window.location.reload()} className="admin-btn admin-btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Inquiries"
        subtitle="Review messages submitted from the contact page"
        actions={
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by name, email, or message"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        }
      />

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="admin-table min-w-[700px]">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hidden sm:table-cell">Email</th>
                <th>Message</th>
                <th className="hidden md:table-cell">Received</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInquiries.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium text-[var(--admin-text-primary)]">{item.name}</td>
                  <td className="hidden sm:table-cell text-[var(--admin-text-secondary)]">
                    {item.email}
                  </td>
                  <td className="max-w-[260px] truncate text-[var(--admin-text-secondary)]">
                    {item.message}
                  </td>
                  <td className="hidden md:table-cell text-[var(--admin-text-muted)]">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setSelectedInquiry(item)}>
                        View
                      </Button>
                      {isAdmin && (
                        <Button variant="danger" onClick={() => setDeleteInquiry(item)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedInquiries.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--admin-text-muted)]">
                    No inquiries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredInquiries.length}
          itemsPerPage={itemsPerPage}
        />
      </Card>

      <Modal
        isOpen={!!selectedInquiry}
        onClose={() => setSelectedInquiry(null)}
        title="Inquiry Details"
        size="lg"
        footer={
          <>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedInquiry) {
                  setReplyInquiry(selectedInquiry);
                  setSelectedInquiry(null);
                }
              }}
            >
              Reply
            </Button>
            {isAdmin && (
              <Button
                variant="danger"
                onClick={() => selectedInquiry && setDeleteInquiry(selectedInquiry)}
                disabled={!selectedInquiry}
              >
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={() => setSelectedInquiry(null)}>
              Close
            </Button>
          </>
        }
      >
        {selectedInquiry && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Name</p>
                <p className="font-semibold text-[var(--admin-text-primary)]">
                  {selectedInquiry.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Email</p>
                <p className="font-semibold text-[var(--admin-text-primary)]">
                  {selectedInquiry.email}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-[var(--admin-text-muted)]">Received</p>
              <p className="font-semibold text-[var(--admin-text-primary)]">
                {new Date(selectedInquiry.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--admin-text-muted)]">Message</p>
              <div className="mt-2 p-4 rounded-xl bg-[var(--admin-bg-tertiary)] border border-[var(--admin-border)] text-[var(--admin-text-secondary)] whitespace-pre-wrap">
                {selectedInquiry.message}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reply Modal */}
      <Modal
        isOpen={!!replyInquiry}
        onClose={() => {
          setReplyInquiry(null);
          setReplyMessage('');
        }}
        title="Reply to Inquiry"
        size="lg"
        footer={
          <>
            <Button
              variant="primary"
              onClick={handleReply}
              disabled={!replyMessage.trim() || sendingReply}
              loading={sendingReply}
            >
              Send Reply
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setReplyInquiry(null);
                setReplyMessage('');
              }}
              disabled={sendingReply}
            >
              Cancel
            </Button>
          </>
        }
      >
        {replyInquiry && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Name</p>
                <p className="font-semibold text-[var(--admin-text-primary)]">
                  {replyInquiry.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--admin-text-muted)]">Email</p>
                <p className="font-semibold text-[var(--admin-text-primary)]">
                  {replyInquiry.email}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-[var(--admin-text-muted)] mb-2">Original Message</p>
              <div className="p-4 rounded-xl bg-[var(--admin-bg-tertiary)] border border-[var(--admin-border)] text-[var(--admin-text-secondary)] whitespace-pre-wrap text-sm">
                {replyInquiry.message}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-primary)] mb-2">
                Your Reply
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg-secondary)] text-[var(--admin-text-primary)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                rows={8}
                placeholder="Type your reply here... This will be sent from contact@xianze.tech"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                maxLength={2000}
                disabled={sendingReply}
              />
              <p className="text-xs text-[var(--admin-text-muted)] mt-2">
                {replyMessage.length} / 2000 characters
              </p>
            </div>
            <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
              <p className="text-sm text-primary-700">
                <strong>📧 Note:</strong> Your reply will be sent from{' '}
                <span className="font-mono">contact@xianze.tech</span> and will include the
                original message for context.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deleteInquiry}
        onClose={() => setDeleteInquiry(null)}
        onConfirm={handleDelete}
        title="Delete Inquiry"
        message={`Are you sure you want to delete the inquiry from "${deleteInquiry?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
      />
    </div>
  );
}
