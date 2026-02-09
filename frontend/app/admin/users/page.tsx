'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge, { RoleBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import { ConfirmModal } from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import Select from '../components/ui/Select';
import { PageLoader } from '../components/ui/Spinner';
import TaskCheckboxes from '../components/ui/TaskCheckboxes';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string | null;
  assignedEvents?: string[] | null;
  tasks?: string[] | null;
}

// Available events in the system
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'member' as 'admin' | 'coordinator' | 'member',
    assignedEvent: '',
    assignedEvents: [] as string[],
    tasks: [] as string[],
  });

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(getApiUrl('/users'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      setUsers(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'member',
      assignedEvent: '',
      assignedEvents: [],
      tasks: [],
    });
    setEditingUser(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // Don't show password
      name: user.name,
      role: user.role,
      assignedEvent: user.assignedEvent || '',
      assignedEvents: user.assignedEvents || [],
      tasks: user.tasks || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');

    try {
      // Validate password for new users
      if (!editingUser && !formData.password) {
        throw new Error('Password is required for new users');
      }

      if (!editingUser && formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      if (formData.role === 'coordinator' && !formData.assignedEvent) {
        throw new Error('Assigned event is required for coordinators');
      }

      if (formData.role === 'member' && formData.assignedEvents.length !== 1) {
        throw new Error('Assigned event is required for members');
      }

      const body: Record<string, unknown> = {
        username: formData.username,
        name: formData.name,
        role: formData.role,
      };

      // Only include password if provided
      if (formData.password) {
        body.password = formData.password;
      }

      // Handle event assignment based on role - only include if not empty
      if (formData.role === 'coordinator' && formData.assignedEvent) {
        body.assignedEvent = formData.assignedEvent;
      } else if (formData.role === 'member' && formData.assignedEvents.length > 0) {
        body.assignedEvents = formData.assignedEvents;
      }

      // Include tasks only if there are any
      if (formData.tasks.length > 0) {
        body.tasks = formData.tasks;
      }

      const url = editingUser ? getApiUrl(`/users/${editingUser.id}`) : getApiUrl('/users');
      const method = editingUser ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to save user');
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(getApiUrl(`/users/${deleteConfirm.id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete user');
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleMemberEventChange = (event: string) => {
    setFormData({ ...formData, assignedEvents: event ? [event] : [] });
  };

  // Filter users by search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Paginated data
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  if (loading) {
    return <PageLoader message="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage admin users, coordinators, and members"
        actions={
          <Button onClick={openCreateModal}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add User
          </Button>
        }
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          {error}
          <button onClick={() => setError('')} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Search users by name or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Users Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedUsers.map((user) => (
          <Card key={user.id} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center border border-primary-200">
                  <span className="text-primary-600 font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              <RoleBadge role={user.role} />
            </div>

            {/* Event assignment info */}
            {user.role === 'coordinator' && user.assignedEvent && (
              <div className="mb-3 text-sm">
                <span className="text-gray-500">Event: </span>
                <Badge variant="purple">{user.assignedEvent}</Badge>
              </div>
            )}

            {user.role === 'member' && user.assignedEvents && user.assignedEvents.length > 0 && (
              <div className="mb-3 text-sm">
                <span className="text-gray-500">Event: </span>
                <Badge variant="purple">{user.assignedEvents[0]}</Badge>
              </div>
            )}

            {/* Tasks info */}
            {user.tasks && user.tasks.length > 0 && (
              <div className="mb-3 text-sm">
                <span className="text-gray-500">Extra Tasks: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.tasks.map((task) => (
                    <Badge key={task} variant="active">
                      {task.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <Button variant="secondary" className="flex-1" onClick={() => openEditModal(user)}>
                Edit
              </Button>
              <Button variant="danger" onClick={() => setDeleteConfirm(user)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </Button>
            </div>
          </Card>
        ))}

        {paginatedUsers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchQuery
              ? 'No users match your search.'
              : 'No users found. Create one to get started.'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-0 overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
          />
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Create User'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={!!editingUser}
              />

              <Input
                label={editingUser ? 'New Password (leave blank to keep)' : 'Password'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingUser}
              />

              <Input
                label="Display Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Select
                label="Role"
                value={formData.role}
                onChange={(e) => {
                  const newRole = e.target.value as 'admin' | 'coordinator' | 'member';
                  setFormData({
                    ...formData,
                    role: newRole,
                    assignedEvent: '',
                    assignedEvents: [],
                    tasks: [], // Reset tasks when role changes
                  });
                }}
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'coordinator', label: 'Coordinator' },
                  { value: 'member', label: 'Member' },
                ]}
              />

              {/* Event assignment - Coordinator (single) */}
              {formData.role === 'coordinator' && (
                <Select
                  label="Assigned Event"
                  value={formData.assignedEvent}
                  onChange={(e) => setFormData({ ...formData, assignedEvent: e.target.value })}
                  required
                  options={[
                    { value: '', label: 'Select Event' },
                    ...AVAILABLE_EVENTS.map((e) => ({ value: e, label: e })),
                  ]}
                />
              )}

              {/* Event assignment - Member (single) */}
              {formData.role === 'member' && (
                <Select
                  label="Assigned Event"
                  value={formData.assignedEvents[0] || ''}
                  onChange={(e) => handleMemberEventChange(e.target.value)}
                  required
                  options={[
                    { value: '', label: 'Select Event' },
                    ...AVAILABLE_EVENTS.map((event) => ({ value: event, label: event })),
                  ]}
                />
              )}

              {/* Task assignment */}
              {formData.role !== 'admin' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Tasks & Permissions
                  </label>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <TaskCheckboxes
                      role={formData.role}
                      selectedTasks={formData.tasks}
                      onChange={(tasks) => setFormData({ ...formData, tasks })}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" loading={saving}>
                  {editingUser ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
