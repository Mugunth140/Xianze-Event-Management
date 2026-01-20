'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
  createdAt: string;
}

const events = [
  'Buildathon',
  'Bug Smash',
  'Paper Presentation',
  'Ctrl+ Quiz',
  'Code Hunt: Word Edition',
  'Think & Link',
  'Gaming',
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'member' as 'admin' | 'coordinator' | 'member',
    assignedEvent: '',
  });

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(getApiUrl('/api/users'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch users');

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';

      const body = editingUser
        ? {
            name: formData.name,
            role: formData.role,
            assignedEvent: formData.role === 'member' ? formData.assignedEvent : null,
            ...(formData.password && { password: formData.password }),
          }
        : formData;

      const res = await fetch(getApiUrl(url), {
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
      setEditingUser(null);
      setFormData({ username: '', password: '', name: '', role: 'member', assignedEvent: '' });
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(getApiUrl(`/api/users/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete user');

      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      role: user.role,
      assignedEvent: user.assignedEvent || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', name: '', role: 'member', assignedEvent: '' });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-400 mt-1">Manage admin users, coordinators, and members</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
        >
          Add User
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
          {error}
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center">
                <span className="text-primary-400 font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span
                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  user.role === 'admin'
                    ? 'bg-red-500/20 text-red-400'
                    : user.role === 'coordinator'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-green-500/20 text-green-400'
                }`}
              >
                {user.role}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-white">{user.name}</h3>
            <p className="text-gray-400 text-sm">@{user.username}</p>

            {user.role === 'member' && user.assignedEvent && (
              <p className="mt-2 text-sm text-primary-400">Event: {user.assignedEvent}</p>
            )}

            <div className="mt-4 pt-4 border-t border-gray-700 flex gap-2">
              <button
                onClick={() => openEditModal(user)}
                className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(user.id)}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-6">
              {editingUser ? 'Edit User' : 'Create User'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password {editingUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as 'admin' | 'coordinator' | 'member',
                    })
                  }
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="member">Member</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {formData.role === 'member' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assigned Event
                  </label>
                  <select
                    value={formData.assignedEvent}
                    onChange={(e) => setFormData({ ...formData, assignedEvent: e.target.value })}
                    required={formData.role === 'member'}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Event</option>
                    {events.map((event) => (
                      <option key={event} value={event}>
                        {event}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
