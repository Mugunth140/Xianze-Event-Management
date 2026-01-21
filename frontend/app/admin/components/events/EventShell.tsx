'use client';

import { ReactNode } from 'react';
import Badge from '../ui/Badge';

type EventStatus = 'waiting' | 'active' | 'paused' | 'completed';

interface EventShellProps {
  eventName: string;
  currentRound?: number;
  totalRounds?: number;
  status?: EventStatus;
  children: ReactNode;
  footer?: ReactNode;
}

export default function EventShell({
  eventName,
  currentRound,
  totalRounds,
  status = 'waiting',
  children,
  footer,
}: EventShellProps) {
  const statusConfig: Record<
    EventStatus,
    { label: string; variant: 'active' | 'warning' | 'inactive' | 'success' }
  > = {
    waiting: { label: 'Waiting', variant: 'inactive' },
    active: { label: 'Live', variant: 'active' },
    paused: { label: 'Paused', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
  };

  const { label, variant } = statusConfig[status];

  return (
    <div className="admin-event-shell">
      {/* Event Header */}
      <header className="admin-event-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">{eventName}</h1>
            {currentRound && totalRounds && (
              <p className="text-[var(--admin-text-secondary)] mt-1">
                Round {currentRound} of {totalRounds}
              </p>
            )}
          </div>
          <Badge variant={variant} dot={status === 'active'}>
            {label}
          </Badge>
        </div>
      </header>

      {/* Event Content */}
      <main className="admin-event-content">{children}</main>

      {/* Event Footer (Controls) */}
      {footer && <footer className="admin-event-footer">{footer}</footer>}
    </div>
  );
}
