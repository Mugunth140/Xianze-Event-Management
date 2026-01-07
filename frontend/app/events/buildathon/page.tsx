import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buildathon | XIANZE',
  description:
    'Build something amazing at XIANZE Buildathon - A technical hackathon-style competition',
};

/**
 * Buildathon Event Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * Event Type: Technical (Hackathon-style)
 *
 * TODO: Implement the following features
 * - Event details and rules
 * - Team registration form
 * - Problem statements
 * - Submission portal
 * - Leaderboard
 */
export default function BuildathonPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            Technical Event
          </span>
          <h1 className="text-4xl font-bold mt-2">Buildathon</h1>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">🚀 Coming Soon</h2>
          <p className="opacity-90">
            This event page is under construction. Check back later for registration!
          </p>
        </div>

        {/* Placeholder content */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>About Buildathon</h2>
          <p>
            Buildathon is a technical hackathon-style competition where participants build
            innovative projects using the XIANZE platform APIs.
          </p>

          <h2>What to Expect</h2>
          <ul>
            <li>Team-based competition</li>
            <li>Access to platform APIs</li>
            <li>Mentorship from industry experts</li>
            <li>Prizes for top teams</li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-medium">⚠️ Implementation Note</p>
            <p className="text-sm mt-1">
              This is a placeholder page. Contributors should implement the full event UI following
              the design system.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
