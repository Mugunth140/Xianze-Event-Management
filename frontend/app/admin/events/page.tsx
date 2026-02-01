'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';

interface User {
  name: string;
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
  assignedEvents?: string[];
}

interface AdminEvent {
  label: string;
  description: string;
  href: string;
}

const adminEvents: AdminEvent[] = [
  {
    label: 'Paper Presentation',
    description: 'Manage paper submissions and event flow.',
    href: '/admin/paper-presentation',
  },
  {
    label: 'Think & Link',
    description: 'Control event presentation and rounds.',
    href: '/admin/think-link',
  },
  {
    label: 'Bug Smash',
    description: 'Access challenges and evaluate participants.',
    href: '/admin/bug-smash',
  },
  {
    label: 'Ctrl + Quiz',
    description: 'Manage quiz content and live session.',
    href: '/admin/ctrl-quiz',
  },
  {
    label: 'Buildathon',
    description: 'Dashboard builder competition with API endpoints.',
    href: '/admin/buildathon',
  },
  {
    label: 'Code Hunt',
    description: 'Buzzer control and leaderboard for coding treasure hunt.',
    href: '/admin/code-hunt',
  },
];

const normalizeEvent = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export default function AdminEventsPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const visibleEvents = useMemo(() => {
    if (!user) return [];
    if (user.role === 'admin') return adminEvents;

    const assigned = [user.assignedEvent, ...(user.assignedEvents || [])].filter(Boolean);
    const assignedSet = new Set(assigned.map((event) => normalizeEvent(event as string)));

    return adminEvents.filter((event) => assignedSet.has(normalizeEvent(event.label)));
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        subtitle={
          user?.role === 'admin'
            ? 'Access all event dashboards in one place'
            : 'Access your assigned event dashboards'
        }
      />

      {visibleEvents.length === 0 ? (
        <Card className="p-6">
          <div className="text-center text-[var(--admin-text-muted)]">
            No event access assigned. Contact an administrator for permissions.
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleEvents.map((event) => (
            <Link key={event.href} href={event.href} className="group">
              <Card className="p-6 hover:shadow-lg transition-shadow h-full">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {event.label}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">{event.description}</p>
                  </div>
                  <Badge variant="purple">Open</Badge>
                </div>
                <div className="mt-4 text-sm font-medium text-primary-600">View details</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
