'use client';

import { useState } from 'react';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Input from '../ui/Input';

interface Attendee {
  id: string;
  name: string;
  email: string;
  college: string;
  checkedInAt: string;
  status: 'verified' | 'pending' | 'rejected';
}

interface AttendanceListProps {
  attendees: Attendee[];
  loading?: boolean;
  onVerify?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function AttendanceList({
  attendees,
  loading = false,
  onVerify,
  onReject,
}: AttendanceListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAttendees = attendees.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const counts = {
    total: attendees.length,
    verified: attendees.filter((a) => a.status === 'verified').length,
    pending: attendees.filter((a) => a.status === 'pending').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[var(--admin-text-muted)] text-sm">Total:</span>
          <Badge variant="purple">{counts.total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--admin-text-muted)] text-sm">Verified:</span>
          <Badge variant="success">{counts.verified}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--admin-text-muted)] text-sm">Pending:</span>
          <Badge variant="warning">{counts.pending}</Badge>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Search attendees..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* List */}
      <Card className="p-0 divide-y divide-[var(--admin-border)]">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-[rgba(139,92,246,0.3)] border-t-[rgb(139,92,246)] rounded-full animate-spin mx-auto" />
            <p className="text-[var(--admin-text-muted)] mt-4 text-sm">Loading attendees...</p>
          </div>
        ) : filteredAttendees.length === 0 ? (
          <div className="p-8 text-center text-[var(--admin-text-muted)]">
            {searchQuery ? 'No matching attendees found' : 'No attendees yet'}
          </div>
        ) : (
          filteredAttendees.map((attendee) => (
            <div
              key={attendee.id}
              className="flex items-center justify-between p-4 hover:bg-[rgba(139,92,246,0.05)] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.15)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[rgb(139,92,246)] font-semibold">
                    {attendee.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[var(--admin-text-primary)] truncate">
                    {attendee.name}
                  </p>
                  <p className="text-sm text-[var(--admin-text-muted)] truncate">
                    {attendee.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    attendee.status === 'verified'
                      ? 'success'
                      : attendee.status === 'pending'
                        ? 'warning'
                        : 'error'
                  }
                >
                  {attendee.status}
                </Badge>

                {attendee.status === 'pending' && (
                  <div className="flex gap-2">
                    {onVerify && (
                      <button
                        onClick={() => onVerify(attendee.id)}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        title="Verify"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    )}
                    {onReject && (
                      <button
                        onClick={() => onReject(attendee.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Reject"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
