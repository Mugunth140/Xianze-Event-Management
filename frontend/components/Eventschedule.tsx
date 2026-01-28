'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// const itemVariants = {
//   hidden: { opacity: 0, y: 14 },
//   show: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.32, // fast
//       ease: [0.25, 0.8, 0.25, 1],
//     },
//   },
// };

const Eventschedule = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        card,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
            once: true,
          },
        }
      );

      if (contentRef.current) {
        gsap.fromTo(
          Array.from(contentRef.current.children),
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.45,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: card,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }

      if (iconRef.current) {
        gsap.to(iconRef.current, {
          y: -10,
          rotation: 5,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }

      if (titleRef.current) {
        gsap.to(titleRef.current, {
          opacity: 0.7,
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    });

    return () => ctx.revert();
  }, []);
  // const schedule = [
  //   { title: 'Spot Registration', time: '8:30 AM - 9:15 AM' },
  //   { title: 'Inauguration', time: '9:15 AM - 10:30 AM' },
  //   { title: 'Event Timing', time: '10:30 AM - 1:30 PM' },
  //   { title: 'Lunch Timing', time: '1:30 PM - 2:30 PM' },
  //   { title: 'Ceremony', time: '2:30 PM - 3:30 PM' },
  // ];
  return (
    <section
      className="min-h-screen pt-28 pb-20"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 30%, #f0e8ff 100%)',
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed top-20 left-10 w-72 h-72 rounded-full opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(109, 64, 212, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className="fixed bottom-20 right-10 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          {/* Fun badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-200 mb-6 shadow-sm">
            <span className="text-2xl">📅</span>
            <span className="text-sm font-semibold text-primary-700 uppercase tracking-wider">
              Time to Plan
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6">
            Event{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary-600">Schedule</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-primary-200/60 -rotate-1 -z-0" />
            </span>
          </h1>

          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Don&apos;t miss a moment! Here&apos;s the timeline for all the exciting activities at
            Xianze 2026.
          </p>
        </div>

        {/* Schedule Card */}
        <div
          ref={cardRef}
          className="
            relative
            w-full
            mx-auto
            p-8 md:p-10
            bg-white/70 backdrop-blur-xl
            border border-violet-200/40
            rounded-3xl
            shadow-[0_20px_40px_rgba(124,58,237,0.15)]
            text-center
            overflow-hidden
          "
        >
          {/* Soft static glow */}
          <div
            className="
            absolute -top-28 -right-28
            w-80 h-80
            bg-violet-200/10
            rounded-full
            blur-3xl
            pointer-events-none
          "
          />

          <div ref={contentRef} className="space-y-3">
            <div className="flex flex-col items-center justify-center py-12">
              <div ref={iconRef} className="text-6xl mb-6">
                ⏳
              </div>

              <h3 ref={titleRef} className="text-2xl font-bold text-violet-600 mb-2">
                Coming Soon
              </h3>

              <p className="text-neutral-500">
                The event schedule will be updated shortly. <br /> Stay tuned!
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Eventschedule;
