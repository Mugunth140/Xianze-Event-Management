import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fun Games | XIANZE',
  description: 'Casual fun activities at XIANZE - No registration required!',
};

/**
 * Fun Games Event Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * Event Type: Special
 *
 * ⚠️ IMPORTANT: This event is SPECIAL
 * - NO registration required
 * - NO backend participation logic
 * - Public display ONLY
 *
 * TODO: Implement the following features
 * - Activity schedule display
 * - Location/venue information
 * - Photo gallery (optional)
 */
export default function FunGamesPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
            Special Event
          </span>
          <h1 className="text-4xl font-bold mt-2">Fun Games</h1>
        </div>

        {/* Special Notice */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">🎉 No Registration Required!</h2>
          <p className="opacity-90">
            Just show up and have fun! This is a drop-in event for everyone.
          </p>
        </div>

        {/* Placeholder content */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>About Fun Games</h2>
          <p>
            Fun Games is a collection of casual, entertainment-focused activities during the event.
            No registration needed - just drop in and enjoy!
          </p>

          <h2>What to Expect</h2>
          <ul>
            <li>Casual mini-games</li>
            <li>Social activities</li>
            <li>Prizes and giveaways</li>
            <li>Photo opportunities</li>
          </ul>

          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 my-6">
            <p className="font-medium">ℹ️ Why No Registration?</p>
            <p className="text-sm mt-1">
              Fun Games is designed to be inclusive and accessible. Anyone can participate without
              prior registration - just show up and join!
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-medium">⚠️ Implementation Note</p>
            <p className="text-sm mt-1">
              This is a placeholder page. Display-only - no backend logic required. See{' '}
              <code>/EVENTS.md</code> for details on special event handling.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
