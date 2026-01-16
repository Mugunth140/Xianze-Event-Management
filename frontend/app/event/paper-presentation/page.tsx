import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paper Presentation | XIANZE',
  description: 'Present your research at XIANZE Paper Presentation event',
};

/**
 * Paper Presentation Event Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * Event Type: Non-technical
 *
 * NOTE: This event requires minimal backend logic.
 * Registration uses the shared registration system.
 *
 * TODO: Implement the following features
 * - Event details and guidelines
 * - Topic suggestions
 * - Submission guidelines
 * - Schedule display
 */
export default function PaperPresentationPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            Non-Technical Event
          </span>
          <h1 className="text-4xl font-bold mt-2">Paper Presentation</h1>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl p-8 text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">📄 Coming Soon</h2>
          <p className="opacity-90">
            This event page is under construction. Check back later for registration!
          </p>
        </div>

        {/* Placeholder content */}
        <div className="prose dark:prose-invert max-w-none">
          <h2>About Paper Presentation</h2>
          <p>
            Paper Presentation is a non-technical event where participants present research papers
            or project proposals to a panel of judges.
          </p>

          <h2>Guidelines</h2>
          <ul>
            <li>Original research or innovative project proposals</li>
            <li>10-15 minute presentation time</li>
            <li>Q&A session with judges</li>
            <li>PowerPoint or PDF format</li>
          </ul>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 my-6">
            <p className="font-medium">⚠️ Implementation Note</p>
            <p className="text-sm mt-1">
              This is a placeholder page. Minimal backend required - uses shared registration
              system.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
