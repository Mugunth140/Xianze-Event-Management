'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Modal, { ConfirmModal } from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import { PageLoader } from '../components/ui/Spinner';

interface Registration {
  id: number;
  name: string;
  email: string;
  college: string;
  course: string;
  branch: string;
  contact: string;
  event: string;
  transactionId: string | null;
  paymentMode?: 'online' | 'cash';
}

interface User {
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
}

const events = [
  { value: 'All Events', label: 'All Events' },
  { value: 'Buildathon', label: 'Buildathon' },
  { value: 'Bug Smash', label: 'Bug Smash' },
  { value: 'Paper Presentation', label: 'Paper Presentation' },
  { value: 'Ctrl+ Quiz', label: 'Ctrl+ Quiz' },
  { value: 'Code Hunt: Word Edition', label: 'Code Hunt: Word Edition' },
  { value: 'Think & Link', label: 'Think & Link' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Fun Games', label: 'Fun Games' },
];

const eventOptions = [
  { value: 'Buildathon', label: 'Buildathon' },
  { value: 'Bug Smash', label: 'Bug Smash' },
  { value: 'Paper Presentation', label: 'Paper Presentation' },
  { value: 'Ctrl + Quiz', label: 'Ctrl + Quiz' },
  { value: 'Code Hunt : Word Edition', label: 'Code Hunt : Word Edition' },
  { value: 'Think & Link', label: 'Think & Link' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Fun Games', label: 'Fun Games' },
];

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All Events');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'all' | 'online' | 'cash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);

  // Edit/Delete state
  const [editingReg, setEditingReg] = useState<Registration | null>(null);
  const [deleteReg, setDeleteReg] = useState<Registration | null>(null);
  const [editForm, setEditForm] = useState<Partial<Registration>>({});
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const eventParam =
        selectedEvent !== 'All Events' ? `?event=${encodeURIComponent(selectedEvent)}` : '';
      const paymentParam =
        selectedPaymentMode !== 'all'
          ? `${eventParam ? '&' : '?'}paymentMode=${encodeURIComponent(selectedPaymentMode)}`
          : '';
      const res = await fetch(getApiUrl(`/analytics/registrations${eventParam}${paymentParam}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch registrations');

      const data = await res.json();
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, selectedPaymentMode]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleEdit = (reg: Registration) => {
    setEditingReg(reg);
    setEditForm({
      name: reg.name,
      email: reg.email,
      college: reg.college,
      course: reg.course,
      branch: reg.branch,
      contact: reg.contact,
      event: reg.event,
      transactionId: reg.transactionId,
      paymentMode: reg.paymentMode || 'online',
    });
    setActionError('');
  };

  const handleSaveEdit = async () => {
    if (!editingReg) return;
    const token = localStorage.getItem('token');
    setProcessing(true);
    setActionError('');

    try {
      const res = await fetch(getApiUrl(`/register/${editingReg.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update registration');
      }

      setEditingReg(null);
      fetchRegistrations();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReg) return;
    const token = localStorage.getItem('token');
    setProcessing(true);

    try {
      const res = await fetch(getApiUrl(`/register/${deleteReg.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete registration');

      setDeleteReg(null);
      fetchRegistrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setProcessing(false);
    }
  };

  const filteredRegistrations = registrations.filter(
    (reg) =>
      (selectedPaymentMode === 'all' || reg.paymentMode === selectedPaymentMode) &&
      (reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.college.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedEvent, selectedPaymentMode]);

  // Paginated data
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRegistrations.slice(start, start + itemsPerPage);
  }, [filteredRegistrations, currentPage, itemsPerPage]);

  if (loading) {
    return <PageLoader message="Loading registrations..." />;
  }

  // Members can only see their assigned event
  const availableEvents =
    user?.role === 'member' && user.assignedEvent
      ? [{ value: user.assignedEvent, label: user.assignedEvent }]
      : events;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registrations"
        subtitle="View and manage event registrations"
        actions={
          <div className="text-sm text-[var(--admin-text-secondary)]">
            Total:{' '}
            <span className="text-[var(--admin-text-primary)] font-semibold">
              {filteredRegistrations.length}
            </span>
          </div>
        }
      />

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {user?.role !== 'member' && (
            <div className="w-full sm:w-64">
              <Select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                options={availableEvents}
              />
            </div>
          )}

          <div className="w-full sm:w-48">
            <Select
              value={selectedPaymentMode}
              onChange={(e) => setSelectedPaymentMode(e.target.value as 'all' | 'online' | 'cash')}
              options={[
                { value: 'all', label: 'All Modes' },
                { value: 'online', label: 'Online' },
                { value: 'cash', label: 'Cash' },
              ]}
            />
          </div>
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400">
          {error}
        </div>
      )}

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto admin-scrollbar">
          <table className="admin-table">
            <thead>
              <tr className="bg-[rgba(139,92,246,0.05)]">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">College</th>
                {isAdmin && <th className="px-6 py-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedRegistrations.map((reg) => (
                <tr key={reg.id}>
                  <td className="px-6 py-4 font-medium text-[var(--admin-text-primary)]">
                    {reg.name}
                  </td>
                  <td className="px-6 py-4">{reg.email}</td>
                  <td className="px-6 py-4">
                    <div className="max-w-[150px] overflow-x-auto whitespace-nowrap admin-scrollbar pb-1">
                      <Badge variant="purple">{reg.event}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={reg.paymentMode === 'cash' ? 'warning' : 'success'}>
                      {reg.paymentMode === 'cash' ? 'Cash' : 'Online'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate">{reg.college}</td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(reg)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteReg(reg)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {paginatedRegistrations.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="px-6 py-12 text-center text-[var(--admin-text-muted)]"
                  >
                    No registrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredRegistrations.length}
          itemsPerPage={itemsPerPage}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingReg}
        onClose={() => setEditingReg(null)}
        title="Edit Registration"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditingReg(null)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit} loading={processing}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 text-sm">
              {actionError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Name
              </label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Email
              </label>
              <Input
                type="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Contact
              </label>
              <Input
                value={editForm.contact || ''}
                onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Event
              </label>
              <Select
                value={editForm.event || ''}
                onChange={(e) => setEditForm({ ...editForm, event: e.target.value })}
                options={eventOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Course
              </label>
              <Input
                value={editForm.course || ''}
                onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Branch
              </label>
              <Input
                value={editForm.branch || ''}
                onChange={(e) => setEditForm({ ...editForm, branch: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                College
              </label>
              <Input
                value={editForm.college || ''}
                onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Payment Mode
              </label>
              <Select
                value={(editForm.paymentMode as 'online' | 'cash') || 'online'}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    paymentMode: e.target.value as 'online' | 'cash',
                    transactionId: e.target.value === 'cash' ? '' : editForm.transactionId,
                  })
                }
                options={[
                  { value: 'online', label: 'Online' },
                  { value: 'cash', label: 'Cash' },
                ]}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--admin-text-secondary)] mb-1">
                Transaction ID
              </label>
              <Input
                value={editForm.transactionId || ''}
                onChange={(e) => setEditForm({ ...editForm, transactionId: e.target.value })}
                disabled={editForm.paymentMode === 'cash'}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteReg}
        onClose={() => setDeleteReg(null)}
        onConfirm={handleDelete}
        title="Delete Registration"
        message={`Are you sure you want to delete the registration for "${deleteReg?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={processing}
      />
    </div>
  );
}
