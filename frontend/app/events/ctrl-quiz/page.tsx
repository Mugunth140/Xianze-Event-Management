import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ctrl + Quiz | XIANZE',
  description: 'Test your keyboard shortcut knowledge at XIANZE Ctrl + Quiz',
};

/**
 * Ctrl + Quiz Event Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * Event Type: Technical / Knowledge-based
 *
 * TODO: Implement the following features
 * - Quiz interface with timer
 * - Keyboard shortcut questions
 * - Real-time scoring
 * - Leaderboard
 *
 * Redis Integration:
 * - Session state management
 * - Question caching
 * - Real-time leaderboard
 * See /CACHE_STRATEGY.md for details
 */
export default function CtrlQuizPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
            Technical Event
          </span>
          <h1 className="text-4xl font-bold mt-2">Ctrl + Quiz</h1>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">⌨️ Coming Soon</h2>
          <p className="opacity-90">
            This event page is under construction. Check back later for registration!
          </p>
        </div>

        {/* Placeholder content */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>About Ctrl + Quiz</h2>
          <p>
            How well do you know your keyboard shortcuts? Ctrl + Quiz tests your knowledge of
            shortcuts across different software and operating systems.
          </p>

          <h2>Sample Questions</h2>
          <ul>
            <li>
              What does <code>Ctrl + Shift + Esc</code> do in Windows?
            </li>
            <li>Which shortcut copies selected text?</li>
            <li>How do you open a new tab in most browsers?</li>
          </ul>

          <h2>Format</h2>
          <ul>
            <li>Timed multiple-choice questions</li>
            <li>Points based on speed and accuracy</li>
            <li>Real-time leaderboard updates</li>
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
