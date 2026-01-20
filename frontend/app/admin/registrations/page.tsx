'use client';

import { getApiUrl } from '@/lib/api';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { PageLoader } from '../components/ui/Spinner';

interface Registration {
  id: number;
  name: string;
  email: string;
  college: string;
  id: number;
  name: string;
  email: string;
  college: string;
  event: string;
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
        const res = await fetch(getApiUrl(`/analytics/registrations${eventParam}`), {
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
    return <PageLoader message="Loading registrations..." />;
  }

  // Members can only see their assigned event
  const availableEvents =
    user?.role === 'member' && user.assignedEvent
      ? [{ value: user.assignedEvent, label: user.assignedEvent }]
      : events;

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
                <th className="px-6 py-4">College</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
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
                  <td className="px-6 py-4 max-w-[200px] truncate">{reg.college}</td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[var(--admin-text-muted)]">
                    No registrations found
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
