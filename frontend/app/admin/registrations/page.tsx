'use client';

import { useEffect, useState } from 'react';

interface Registration {
  id: number;
  name: string;
  email: string;
  college: string;
  course: string;
  branch: string;
  contact: string;
  event: string;
  createdAt: string;
}

interface User {
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
}

const events = [
  'All Events',
  'Buildathon',
  'Bug Smash',
  'Paper Presentation',
  'Ctrl+ Quiz',
  'Code Hunt: Word Edition',
  'Think & Link',
  'Gaming',
];

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('All Events');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    const fetchRegistrations = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const eventParam =
          selectedEvent !== 'All Events' ? `?event=${encodeURIComponent(selectedEvent)}` : '';
        const res = await fetch(`/api/analytics/registrations${eventParam}`, {
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
    };

    fetchRegistrations();
  }, [selectedEvent]);

  const filteredRegistrations = registrations.filter(
    (reg) =>
      reg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Members can only see their assigned event
  const availableEvents =
    user?.role === 'member' && user.assignedEvent ? [user.assignedEvent] : events;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Registrations</h1>
          <p className="text-gray-400 mt-1">View and manage event registrations</p>
        </div>
        <div className="text-sm text-gray-400">
          Total: <span className="text-white font-semibold">{filteredRegistrations.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Event Filter */}
        {user?.role !== 'member' && (
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {availableEvents.map((event) => (
              <option key={event} value={event}>
                {event}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm bg-gray-800/50">
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Event</th>
                <th className="px-6 py-4 font-medium">College</th>
                <th className="px-6 py-4 font-medium">Course</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-gray-700">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{reg.name}</td>
                  <td className="px-6 py-4">{reg.email}</td>
                  <td className="px-6 py-4">{reg.contact}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded-lg text-sm">
                      {reg.event}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate">{reg.college}</td>
                  <td className="px-6 py-4">
                    {reg.course} - {reg.branch}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {new Date(reg.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No registrations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
