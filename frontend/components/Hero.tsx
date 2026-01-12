'use client';

import gsap from 'gsap';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Entrance animations with GSAP
    const tl = gsap.timeline({ delay: 0.1 });

    if (badgeRef.current) {
      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }

    if (headlineRef.current) {
      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.3'
      );
    }

    if (descriptionRef.current) {
      tl.fromTo(
        descriptionRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.3'
      );
    }

    if (ctaRef.current) {
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      );
    }

    if (videoRef.current) {
      tl.fromTo(
        videoRef.current,
        { opacity: 0, y: 30, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
        '-=0.3'
      );
    }
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative pt-28 sm:pt-32 pb-12 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #faf8ff 50%, #f5f0ff 100%)',
      }}
    >
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none">
        <div
          className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(109, 64, 212, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Split Layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left Column - Headline & CTAs */}
          <div>
            {/* Badge */}
            <div
              ref={badgeRef}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-200 mb-6 opacity-0"
            >
              <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary-700 tracking-wide">
                <span className="font-bold text-sm">
                  {Math.max(
                    0,
                    Math.floor(
                      (new Date('2026-02-07').getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}
                </span>{' '}
                Days Left
              </span>
            </div>

            {/* Headline */}
            <h1
              ref={headlineRef}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-display font-bold leading-[1.1] tracking-tight text-gray-900 mb-8 opacity-0"
            >
              Unleash Your <span className="text-primary-600">Tech Skills</span> at XIANZE 2K26.
            </h1>

            {/* CTA Buttons */}
            <div ref={ctaRef} className="flex flex-wrap items-center gap-4 opacity-0">
              <Link
                href="/register"
                className="liquid-glass-btn inline-flex items-center justify-center px-7 py-3.5 text-white font-semibold rounded-full"
              >
                Register Now
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 px-4 py-3 text-gray-700 font-medium hover:text-primary-600 transition-colors group"
              >
                <span>View Events</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Column - Description */}
          <div>
            <p ref={descriptionRef} className="text-lg text-gray-600 leading-relaxed opacity-0">
              Join the ultimate inter-collegiate tech symposium. Compete, collaborate, and showcase
              your skills across coding, design, and innovation challenges. Be part of something
              extraordinary.
            </p>
          </div>
        </div>

        {/* Video Section */}
        <div ref={videoRef} className="mt-16 lg:mt-20 opacity-0">
          <div className="relative w-full overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl shadow-primary-500/10">
            <div className="relative w-full aspect-[9/14] sm:aspect-[16/10] lg:aspect-video">
              <video
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                poster="/event.png" // Using event.png as a placeholder/poster
              >
                <source
                  src="https://framerusercontent.com/modules/assets/dIzxOpo2vafKbdKB2yyZi8bt5o~CwtI99P76DbvF7z19Hr01mXKUlQXrWPBySz_UaKKHqY.mp4"
                  type="video/mp4"
                />
                Your browser does not support the video tag.
              </video>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

              {/* Play indicator */}
              <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-full text-gray-700 text-xs font-medium border border-gray-200">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                LIVE PREVIEW
              </div>
            </div>
          </div>

          {/* Purple accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 rounded-b-full" />
        </div>
      </div>
    </section>
  );
}
