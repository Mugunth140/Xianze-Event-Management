import Link from 'next/link';

/**
 * XIANZE Home Page
 *
 * This is a placeholder page. Replace with actual content when implementing features.
 */
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-4">
        {/* Logo/Title */}
        <h1 className="text-5xl font-bold text-gray-900 mb-4">🎪 XIANZE</h1>
        <p className="text-xl text-gray-600 mb-8">Event Management System</p>

        {/* Status Card */}
        <div className="card mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-green-600">System Online</span>
          </div>
          <p className="text-gray-500 text-sm">
            Backend API:{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}
            </code>
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/admin" className="btn-primary inline-flex items-center justify-center gap-2">
            <span>🔐</span>
            <span>Admin Dashboard</span>
          </Link>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/health`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex items-center justify-center gap-2"
          >
            <span>❤️</span>
            <span>API Health Check</span>
          </a>
        </div>

        {/* Footer */}
        <p className="mt-12 text-sm text-gray-400">
          This is a boilerplate. Implement your features in the respective modules.
        </p>
      </div>
    </div>
  );
}
