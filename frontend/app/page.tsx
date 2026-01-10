import Link from 'next/link';

/**
 * XIANZE Home Page
 * Modern, vibrant hero section with bold typography
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-8 overflow-hidden">
        {/* Floating Decorative Elements */}
        <div className="absolute top-40 left-10 w-4 h-4 bg-primary-400 rounded-full animate-float opacity-60" />
        <div className="absolute top-60 right-20 w-3 h-3 bg-accent-yellow rounded-full animate-float-slow opacity-70" />
        <div className="absolute top-48 right-40 w-2 h-2 bg-accent-orange rounded-full animate-float-delayed opacity-50" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Main Headline */}
          <div className="max-w-4xl">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-display leading-[1.1] tracking-tight text-gray-900">
              Get Started with Xianze 2K26
            </h1>
          </div>

          {/* Tagline with Icon */}
          <div className="flex items-start gap-3 mt-8 max-w-sm ml-auto mr-8 lg:mr-20">
            <div className="flex-shrink-0 mt-1">
              <svg
                className="w-5 h-5 text-accent-orange"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Register now to get started with Xianze 2K26
            </p>
          </div>

          {/* Circular Badge */}
          <div className="absolute right-8 lg:right-20 top-64 lg:top-72">
            <div className="relative w-20 h-20 lg:w-24 lg:h-24">
              <div className="absolute inset-0 rounded-full bg-gray-900 flex items-center justify-center shadow-2xl">
                <div className="text-white">
                  <svg
                    className="w-8 h-8 lg:w-10 lg:h-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              {/* Rotating text around badge */}
              <svg
                className="absolute inset-0 w-full h-full animate-spin-slow"
                viewBox="0 0 100 100"
              >
                <defs>
                  <path
                    id="circlePath"
                    d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
                  />
                </defs>
                <text fontSize="8" fill="#ffffff" fontWeight="600" letterSpacing="2">
                  <textPath href="#circlePath">
                    XIANZE • GET STARTED • XIANZE • GET STARTED •
                  </textPath>
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Hero Video Section */}
        <div className="mt-12 mx-4 lg:mx-8">
          <div className="relative w-full overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl">
            {/* Aspect ratio container for responsiveness */}
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <video
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                poster=""
              >
                <source
                  src="https://framerusercontent.com/modules/assets/dIzxOpo2vafKbdKB2yyZi8bt5o~CwtI99P76DbvF7z19Hr01mXKUlQXrWPBySz_UaKKHqY.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>
              {/* Optional overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dashboard Card */}
            <Link
              href="/admin"
              className="group card flex items-center gap-4 hover:border-primary-200"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Admin Dashboard</h3>
                <p className="text-sm text-gray-500">Manage your events</p>
              </div>
            </Link>

            {/* Events Card */}
            <Link
              href="/events"
              className="group card flex items-center gap-4 hover:border-accent-orange/50"
            >
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-accent-orange flex items-center justify-center group-hover:bg-accent-orange group-hover:text-white transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Browse Events</h3>
                <p className="text-sm text-gray-500">Discover what&apos;s happening</p>
              </div>
            </Link>

            {/* Register Card */}
            <Link
              href="/register"
              className="group card flex items-center gap-4 hover:border-teal-200 sm:col-span-2 lg:col-span-1"
            >
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-accent-teal flex items-center justify-center group-hover:bg-accent-teal group-hover:text-white transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Register Now</h3>
                <p className="text-sm text-gray-500">Join our community</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            © 2026 XIANZE Event Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
