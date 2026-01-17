'use client';

import EventCard from '@/components/events/EventCard';
import { events } from '@/data/events';
import gsap from 'gsap';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function EventsPage() {
  const headingRef = useRef<HTMLDivElement>(null);

  // Animation on Mount
  useEffect(() => {
    // Animate Heading
    if (headingRef.current) {
      gsap.fromTo(
        headingRef.current.children,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
      );
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-200/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-200/20 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div ref={headingRef} className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center justify-center mb-6">
              <span className="px-5 py-2 rounded-full bg-white border border-primary-100 shadow-sm text-sm font-semibold text-primary-700 uppercase tracking-wider flex items-center gap-2">
                <span className="text-lg">🚀</span> Explore Events
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-gray-900 mb-6 tracking-tight">
              Discover Our <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                Events
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Compete, collaborate, and showcase your skills across 7 exciting events. From
              hackathons to gaming tournaments, there&apos;s a stage for every talent.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-primary-600 text-white font-semibold rounded-full shadow-lg shadow-primary-500/25 hover:bg-primary-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Register Now
              </Link>
              <Link
                href="/schedule"
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300"
              >
                View Schedule
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-12 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12 lg:space-y-24">
            {events.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto bg-gray-800 rounded-[2.5rem] p-12 sm:p-20 text-center relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary-500/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-[80px]" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to make your mark?
            </h2>
            <p className="text-gray-400 mb-10 text-lg sm:text-xl max-w-2xl mx-auto">
              Join hundreds of students in the ultimate tech showdown. Registration is open now.
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-4 bg-primary-600 text-white font-bold text-lg rounded-full shadow-lg hover:text-primary-600 hover:bg-gray-50 hover:scale-105 transition-all duration-300"
            >
              Register for Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
