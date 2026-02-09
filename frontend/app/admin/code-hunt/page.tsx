'use client';

import LeaderboardPanel from '../components/events/LeaderboardPanel';
import { PageHeader } from '../components/layout';

export default function CodeHuntPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Code Hunt" subtitle="Coding treasure hunt leaderboard" />

      <LeaderboardPanel defaultEvent="code-hunt" />
    </div>
  );
}
