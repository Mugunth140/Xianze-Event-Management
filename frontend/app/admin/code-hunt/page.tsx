'use client';

import { useState } from 'react';
import BuzzerPanel from '../components/events/BuzzerPanel';
import LeaderboardPanel from '../components/events/LeaderboardPanel';
import { PageHeader } from '../components/layout';
import Card from '../components/ui/Card';

type Tab = 'buzzer' | 'leaderboard';

export default function CodeHuntPage() {
  const [activeTab, setActiveTab] = useState<Tab>('buzzer');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Code Hunt"
        subtitle="Coding treasure hunt with buzzer round for final answers"
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('buzzer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'buzzer'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          Buzzer Round
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Leaderboard
        </button>
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-blue-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2a7 7 0 00-4 12.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26A7 7 0 0012 2zm-3 19h6"
            />
          </svg>
          <div>
            <h4 className="font-semibold text-blue-900">Code Hunt Buzzer System</h4>
            <p className="text-sm text-blue-700 mt-1">
              This buzzer is separate from Think & Link. Teams participating in Code Hunt will have
              their own leaderboard. Scores persist even after page refresh.
            </p>
          </div>
        </div>
      </Card>

      {/* Buzzer Tab */}
      {activeTab === 'buzzer' && <BuzzerPanel defaultEvent="code-hunt" />}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && <LeaderboardPanel defaultEvent="code-hunt" />}
    </div>
  );
}
