'use client';

import { getApiUrl } from '@/lib/api';
import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import useAuth from '../hooks/useAuth';

const EVENTS = [
  { slug: 'buildathon', name: 'Buildathon' },
  { slug: 'paper-presentation', name: 'Paper Presentation' },
  { slug: 'ctrl-quiz', name: 'Ctrl+ Quiz' },
  { slug: 'think-link', name: 'Think & Link' },
  { slug: 'gaming', name: 'Gaming' },
  { slug: 'fun-games', name: 'Fun Games' },
];

export default function ExportsPage() {
  const { isAdmin } = useAuth();
  const [eventSlug, setEventSlug] = useState('buildathon');
  const [eventName, setEventName] = useState('Buildathon');
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const eventOptions = useMemo(
    () => EVENTS.map((event) => ({ value: event.slug, label: event.name })),
    []
  );

  const handleDownload = async (endpoint: string, fileName: string, key: string) => {
    const token = localStorage.getItem('token');
    setLoadingKey(key);
    setError(null);

    try {
      const res = await fetch(getApiUrl(endpoint), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to export');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoadingKey(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">Only admins can access exports.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exports"
        subtitle="Download registrations, attendance, event participation, and user data"
      />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">{error}</div>
      )}

      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Event Filters</h3>
        <Select
          label="Event"
          value={eventSlug}
          onChange={(e) => {
            const slug = e.target.value;
            const selected = EVENTS.find((ev) => ev.slug === slug);
            setEventSlug(slug);
            setEventName(selected?.name || slug);
          }}
          options={eventOptions}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Registrations</h3>
          <p className="text-sm text-gray-500">Export all registrations or filtered by event.</p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                handleDownload('/exports/registrations', 'registrations.xlsx', 'registrations')
              }
              loading={loadingKey === 'registrations'}
            >
              Export All
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                handleDownload(
                  `/exports/registrations?event=${encodeURIComponent(eventName)}`,
                  `registrations-${eventSlug}.xlsx`,
                  'registrations-event'
                )
              }
              loading={loadingKey === 'registrations-event'}
            >
              Export {eventName}
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Attendance</h3>
          <p className="text-sm text-gray-500">Export venue check-ins or by event.</p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleDownload('/exports/attendance', 'attendance.xlsx', 'attendance')}
              loading={loadingKey === 'attendance'}
            >
              Export All
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                handleDownload(
                  `/exports/attendance?event=${encodeURIComponent(eventName)}`,
                  `attendance-${eventSlug}.xlsx`,
                  'attendance-event'
                )
              }
              loading={loadingKey === 'attendance-event'}
            >
              Export {eventName}
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Event Participation</h3>
          <p className="text-sm text-gray-500">Export event scans and round scans.</p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() =>
                handleDownload(
                  `/exports/event-participation?eventSlug=${encodeURIComponent(eventSlug)}`,
                  `event-participation-${eventSlug}.xlsx`,
                  'event-participation'
                )
              }
              loading={loadingKey === 'event-participation'}
            >
              Event Scans
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                handleDownload(
                  `/exports/round-participation?eventSlug=${encodeURIComponent(eventSlug)}`,
                  `round-participation-${eventSlug}.xlsx`,
                  'round-participation'
                )
              }
              loading={loadingKey === 'round-participation'}
            >
              Round Scans
            </Button>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
          <p className="text-sm text-gray-500">Export all admin, coordinator, and member users.</p>
          <Button
            onClick={() => handleDownload('/exports/users', 'users.xlsx', 'users')}
            loading={loadingKey === 'users'}
          >
            Export Users
          </Button>
        </Card>
      </div>
    </div>
  );
}
