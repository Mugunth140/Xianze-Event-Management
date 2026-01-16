'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        toggleActions: 'play none none none',
      },
    });

    if (headingRef.current) {
      tl.fromTo(
        headingRef.current,
        { opacity: 0, y: 60, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power4.out' }
      );
    }

    if (textRef.current) {
      tl.fromTo(
        textRef.current,
        { opacity: 0, y: 30, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power4.out' },
        '-=0.6'
      );
    }

    if (statsRef.current) {
      const statItems = statsRef.current.querySelectorAll('.stat-item');
      tl.fromTo(
        statItems,
        { opacity: 0, y: 40, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.1,
          ease: 'power4.out',
        },
        '-=0.6'
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          {/* Section Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-6">
            <span className="text-sm font-medium text-primary-600">About XIANZE</span>
          </div>

          {/* Heading */}
          <h2
            ref={headingRef}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-6 opacity-0"
          >
            Where Innovation Meets <span className="text-primary-600">Competition</span>
          </h2>

          {/* Description */}
          <p ref={textRef} className="text-lg text-gray-600 leading-relaxed mb-12 opacity-0">
            XIANZE 2K26 is the premier inter-collegiate tech symposium bringing together the
            brightest minds from across campuses. Experience a day packed with coding challenges,
            design battles, innovative workshops, and exciting prizes.
          </p>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto"
        >
          <div className="stat-item text-center p-6 rounded-2xl bg-gradient-to-b from-primary-50 to-white border border-primary-100 opacity-0">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-primary-600 mb-2">
              300+
            </div>
            <div className="text-sm sm:text-base text-gray-500 font-medium">Participants</div>
          </div>
          <div className="stat-item text-center p-6 rounded-2xl bg-gradient-to-b from-primary-50 to-white border border-primary-100 opacity-0">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-primary-600 mb-2">
              25+
            </div>
            <div className="text-sm sm:text-base text-gray-500 font-medium">Colleges</div>
          </div>
          <div className="stat-item text-center p-6 rounded-2xl bg-gradient-to-b from-primary-50 to-white border border-primary-100 opacity-0">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-primary-600 mb-2">
              ₹20K+
            </div>
            <div className="text-sm sm:text-base text-gray-500 font-medium">Prizes</div>
          </div>
        </div>
      </div>
    </section>
  );
}
