import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bug Smash | XIANZE',
  description: 'Test your debugging skills at XIANZE Bug Smash - Find and fix bugs to win!',
};

/**
 * Bug Smash Event Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * Event Type: Technical (Debugging competition)
 *
 * TODO: Implement the following features
 * - Event details and rules
 * - Round 1: MCQ Quiz interface
 * - Round 2+: Debugging challenges
 * - Timer and scoring
 * - Leaderboard
 *
 * Redis Integration:
 * - Session state management
 * - Question caching
 * See /CACHE_STRATEGY.md for details
 */
export default function BugSmashPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            Technical Event
          </span>
          <h1 className="text-4xl font-bold mt-2">Bug Smash</h1>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">🐛 Coming Soon</h2>
          <p className="opacity-90">
            This event page is under construction. Check back later for registration!
          </p>
        </div>

        {/* Placeholder content */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>About Bug Smash</h2>
          <p>
            Bug Smash is a multi-round debugging competition. Round 1 is an MCQ-based quiz testing
            your knowledge of common bugs and debugging techniques.
          </p>

          <h2>Competition Format</h2>
          <ul>
            <li>
              <strong>Round 1:</strong> MCQ Quiz (powered by backend + Redis)
            </li>
            <li>
              <strong>Round 2:</strong> Live debugging challenges
            </li>
            <li>
              <strong>Finals:</strong> Complex bug hunting
            </li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-medium">⚠️ Implementation Note</p>
            <p className="text-sm mt-1">
              This is a placeholder page. The quiz interface and Redis integration should be
              implemented by contributors.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
