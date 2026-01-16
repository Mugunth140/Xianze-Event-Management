'use client';

import gsap from 'gsap';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Intersection Observer for lazy video loading
  useEffect(() => {
    const videoContainer = videoRef.current;
    if (!videoContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVideoVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    observer.observe(videoContainer);
    return () => observer.disconnect();
  }, []);

  // Start video playback when visible
  useEffect(() => {
    if (isVideoVisible && videoElementRef.current) {
      setIsVideoLoading(true);
      videoElementRef.current.play().catch(() => {
        // Auto-play might be blocked on some browsers
      });
      videoElementRef.current.oncanplaythrough = () => setIsVideoLoading(false);
    }
  }, [isVideoVisible]);

  useEffect(() => {
    // Entrance animations with GSAP
    const tl = gsap.timeline({ delay: 0.1 });

    if (badgeRef.current) {
      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power4.out' }
      );
    }

    if (headlineRef.current) {
      tl.fromTo(
        headlineRef.current,
        { opacity: 0, y: 40, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power4.out' },
        '-=0.6'
      );
    }

    if (descriptionRef.current) {
      tl.fromTo(
        descriptionRef.current,
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power4.out' },
        '-=0.6'
      );
    }

    if (ctaRef.current) {
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power4.out' },
        '-=0.6'
      );
    }

    if (videoRef.current) {
      tl.fromTo(
        videoRef.current,
        { opacity: 0, y: 60, scale: 0.95, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.0,
          ease: 'power4.out',
        },
        '-=0.6'
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
                className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-gray-700 transition-all duration-300 bg-white/50 border border-gray-200/50 hover:bg-white/80 hover:border-primary-200/50 hover:text-primary-600 rounded-full backdrop-blur-sm shadow-sm hover:shadow-md hover:shadow-primary-500/10"
              >
                <span>View Events</span>
              </Link>
            </div>
          </div>

          {/* Right Column - Description */}
          <div>
            <p
              ref={descriptionRef}
              className="text-center lg:text-left text-lg text-gray-600 leading-relaxed opacity-0"
            >
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
                ref={videoElementRef}
                className="absolute inset-0 w-full h-full object-cover"
                loop
                muted
                playsInline
                preload="auto"
                poster="/video_image.webp"
              >
                {isVideoVisible && (
                  <source
                    src="https://framerusercontent.com/modules/assets/dIzxOpo2vafKbdKB2yyZi8bt5o~CwtI99P76DbvF7z19Hr01mXKUlQXrWPBySz_UaKKHqY.mp4"
                    type="video/mp4"
                  />
                )}
                Your browser does not support the video tag.
              </video>

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

              {/* Loading indicator */}
              {isVideoLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* Play indicator */}
              {!isVideoLoading && (
                <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 text-xs font-medium border border-gray-200">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  LIVE PREVIEW
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
