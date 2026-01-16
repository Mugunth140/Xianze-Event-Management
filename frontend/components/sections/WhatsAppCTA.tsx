'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function WhatsAppCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !cardRef.current) return;

    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 40, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Replace with actual WhatsApp community link
  const whatsappLink = 'https://chat.whatsapp.com/your-community-link';

  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-28"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 100%)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-3xl bg-white border border-primary-100 shadow-xl shadow-primary-500/5 p-8 sm:p-12 lg:p-16 text-center"
        >
          {/* Decorative background */}
          <div className="absolute inset-0 opacity-50 pointer-events-none">
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]"
              style={{
                background:
                  'radial-gradient(ellipse, rgba(109, 64, 212, 0.08) 0%, transparent 70%)',
              }}
            />
          </div>

          <div className="relative z-10">
            {/* WhatsApp Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500 shadow-lg shadow-green-500/30 mb-6">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>

            {/* Heading */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">
              Join Our <span className="text-green-500">WhatsApp</span> Community
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 max-w-lg mx-auto mb-8">
              Stay updated with the latest announcements, event schedules, and connect with fellow
              participants. Be part of the XIANZE family!
            </p>

            {/* CTA Button */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-8 py-4 bg-green-500 text-white font-semibold rounded-full shadow-lg shadow-green-500/30 hover:bg-green-600 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <span>Join Community</span>
            </a>

            {/* Member count hint */}
            <p className="mt-6 text-sm text-gray-500">
              <span className="font-medium text-gray-700">200+</span> members already joined
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
