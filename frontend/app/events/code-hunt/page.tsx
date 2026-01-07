import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Code Hunt | XIANZE',
  description: 'Team-based word guessing game at XIANZE - Tech charades!',
};

/**
 * Code Hunt Event Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * Event Type: Team / Activity-based
 *
 * TODO: Implement the following features
 * - Event details and rules
 * - Team registration
 * - Word/term bank (tech-themed)
 * - Timer display
 * - Scoring interface
 */
export default function CodeHuntPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Activity Event
          </span>
          <h1 className="text-4xl font-bold mt-2">Code Hunt</h1>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">🎭 Coming Soon</h2>
          <p className="opacity-90">
            This event page is under construction. Check back later for registration!
          </p>
        </div>

        {/* Placeholder content */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>About Code Hunt</h2>
          <p>
            Code Hunt is a team-based word guessing game (like charades) with a tech twist. Act out
            programming terms, tech concepts, and more!
          </p>

          <h2>How It Works</h2>
          <ul>
            <li>Teams of 3-4 players</li>
            <li>One team member acts, others guess</li>
            <li>Tech-themed words and phrases</li>
            <li>No speaking the actual word!</li>
          </ul>

          <h2>Example Terms</h2>
          <ul>
            <li>&quot;Debugging&quot;</li>
            <li>&quot;Cloud Computing&quot;</li>
            <li>&quot;Merge Conflict&quot;</li>
            <li>&quot;Stack Overflow&quot;</li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-medium">⚠️ Implementation Note</p>
            <p className="text-sm mt-1">
              This is a placeholder page. Timer and scoring interface should be implemented by
              contributors.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
