import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Events | XIANZE',
  description: 'Browse all XIANZE events - Buildathon, Bug Smash, Ctrl + Quiz, and more',
};

/**
 * Events Listing Page
 *
 * ⚠️ PLACEHOLDER - No business logic implemented
 *
 * This page should display a grid/list of all available events.
 *
 * TODO: Implement the following features
 * - Event cards with thumbnails
 * - Category filtering (Technical, Non-technical, Special)
 * - Registration status indicators
 * - Search functionality
 */
export default function EventsPage() {
  // Placeholder event data - replace with API call
  const events = [
    { slug: 'buildathon', name: 'Buildathon', type: 'Technical' },
    { slug: 'bug-smash', name: 'Bug Smash', type: 'Technical' },
    { slug: 'paper-presentation', name: 'Paper Presentation', type: 'Non-technical' },
    { slug: 'gaming', name: 'Gaming (Free Fire)', type: 'Non-technical' },
    { slug: 'ctrl-quiz', name: 'Ctrl + Quiz', type: 'Technical' },
    { slug: 'code-hunt', name: 'Code Hunt', type: 'Activity' },
    { slug: 'think-link', name: 'Think & Link', type: 'Visual' },
    { slug: 'fun-games', name: 'Fun Games', type: 'Special' },
  ];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">XIANZE Events</h1>

        <p className="text-gray-600 dark:text-gray-400 mb-8">
          ⚠️ This is a placeholder page. Event UI should be implemented here.
        </p>

        {/* Placeholder event grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <a
              key={event.slug}
              href={`/events/${event.slug}`}
              className="block p-6 border rounded-lg hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
              <span className="text-sm text-gray-500">{event.type}</span>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
