import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gaming (Free Fire) | XIANZE',
  description: 'Compete in the XIANZE Free Fire Mobile gaming tournament',
};

/**
 * Gaming Event Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * Event Type: Non-technical (Esports)
 *
 * NOTE: This event requires NO backend logic.
 * Tournament management is handled externally.
 *
 * TODO: Implement the following features
 * - Event details and rules
 * - Tournament bracket display
 * - Schedule
 * - Results/standings
 */
export default function GamingPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Non-Technical Event
          </span>
          <h1 className="text-4xl font-bold mt-2">Gaming (Free Fire Mobile)</h1>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">🎮 Coming Soon</h2>
          <p className="opacity-90">
            This event page is under construction. Check back later for registration!
          </p>
        </div>

        {/* Placeholder content */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>About Gaming Event</h2>
          <p>
            Join the ultimate Free Fire Mobile esports tournament at XIANZE. Compete against the
            best players for glory and prizes!
          </p>

          <h2>Tournament Format</h2>
          <ul>
            <li>Squad-based competition (4 players per team)</li>
            <li>Multiple rounds leading to finals</li>
            <li>Points-based scoring system</li>
            <li>Live streaming of finals</li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-medium">⚠️ Implementation Note</p>
            <p className="text-sm mt-1">
              This is a placeholder page. No backend required - tournament managed externally.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
