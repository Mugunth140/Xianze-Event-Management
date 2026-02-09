import Link from 'next/link';

export default function XianzeRegistrationRoute() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Registration</h1>
        <p className="text-sm text-gray-600">Please use the main registration page to continue.</p>
        <Link
          href="/register"
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700"
        >
          Go to Register
        </Link>
      </div>
    </main>
  );
}
