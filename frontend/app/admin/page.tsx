import Link from 'next/link';

/**
 * Admin Dashboard Page
 *
 * This is a placeholder page for the admin dashboard.
 * Implement actual admin features in this directory.
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎪</span>
              <h1 className="text-xl font-semibold text-gray-900">XIANZE Admin</h1>
            </div>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome, Administrator</h2>
          <p className="text-gray-600">
            This is a placeholder for the admin dashboard. Implement your admin features here.
          </p>
        </div>

        {/* Placeholder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Events Card */}
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📅</span>
              <h3 className="font-medium text-gray-900">Events</h3>
            </div>
            <p className="text-sm text-gray-500">Manage events, schedules, and registrations.</p>
            <p className="text-xs text-gray-400 mt-3 italic">Not implemented</p>
          </div>

          {/* Venues Card */}
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏛️</span>
              <h3 className="font-medium text-gray-900">Venues</h3>
            </div>
            <p className="text-sm text-gray-500">Manage venues and locations for events.</p>
            <p className="text-xs text-gray-400 mt-3 italic">Not implemented</p>
          </div>

          {/* Attendees Card */}
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">👥</span>
              <h3 className="font-medium text-gray-900">Attendees</h3>
            </div>
            <p className="text-sm text-gray-500">View and manage event attendees.</p>
            <p className="text-xs text-gray-400 mt-3 italic">Not implemented</p>
          </div>

          {/* Reports Card */}
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📊</span>
              <h3 className="font-medium text-gray-900">Reports</h3>
            </div>
            <p className="text-sm text-gray-500">Generate reports and analytics.</p>
            <p className="text-xs text-gray-400 mt-3 italic">Not implemented</p>
          </div>

          {/* Settings Card */}
          <div className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚙️</span>
              <h3 className="font-medium text-gray-900">Settings</h3>
            </div>
            <p className="text-sm text-gray-500">Configure system settings and preferences.</p>
            <p className="text-xs text-gray-400 mt-3 italic">Not implemented</p>
          </div>

          {/* API Status Card */}
          <div className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔌</span>
              <h3 className="font-medium text-gray-900">API Status</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3">Backend connection status.</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded block truncate">
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}
            </code>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <span className="font-medium">ℹ️ Development Mode:</span> This is a boilerplate.
            Implement features by adding pages in{' '}
            <code className="bg-blue-100 px-1 rounded">app/admin/</code> directory.
          </p>
        </div>
      </main>
    </div>
  );
}
