import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Think & Link | XIANZE',
  description: 'Visual connection game at XIANZE - Find the hidden links!',
};

/**
 * Think & Link Event Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * Event Type: Visual / Connection-based
 *
 * NOTE: This event is primarily frontend-driven.
 * Backend provides metadata only.
 *
 * TODO: Implement the following features
 * - Slideshow display system
 * - Answer input interface
 * - Timer
 * - Scoring
 *
 * Redis Integration (Optional):
 * - Session state
 * - Real-time leaderboard
 */
export default function ThinkLinkPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            Visual Event
          </span>
          <h1 className="text-4xl font-bold mt-2">Think &amp; Link</h1>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">🔗 Coming Soon</h2>
          <p className="opacity-90">
            This event page is under construction. Check back later for registration!
          </p>
        </div>

        {/* Placeholder content */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>About Think &amp; Link</h2>
          <p>
            Think &amp; Link is a visual puzzle game where participants find connections between
            seemingly unrelated images or concepts.
          </p>

          <h2>How It Works</h2>
          <ul>
            <li>Slides show multiple images/clues</li>
            <li>Find the common connection</li>
            <li>Type your answer before time runs out</li>
            <li>Points for speed and accuracy</li>
          </ul>

          <h2>Example Round</h2>
          <p>
            <em>Images shown: Apple logo, Newton, New York City</em>
            <br />
            <strong>Connection:</strong> &quot;Apple&quot; (company, newton discovered gravity via
            apple, Big Apple)
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-medium">⚠️ Implementation Note</p>
            <p className="text-sm mt-1">
              This is a placeholder page. The slideshow system is frontend-driven with minimal
              backend for configuration.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
