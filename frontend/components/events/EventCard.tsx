'use client';

import { Event } from '@/data/events';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface EventCardProps {
  event: Event;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isEven = index % 2 === 0;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Slide up and Fade in animation on scroll
    gsap.fromTo(
      card,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
        },
      }
    );
  }, []);

  return (
    <div
      ref={cardRef}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-start py-8 sm:py-12 opacity-0`}
    >
      {/* Visual Section */}
      <div className="w-full lg:w-5/12 shrink-0">
        <div
          ref={imageRef}
          className={`relative rounded-[2.5rem] overflow-hidden ${event.bgColor} p-10 group shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary-500/10`}
        >
          {/* ID Badge */}
          <div className="absolute top-6 left-6 z-10">
            <span
              className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${event.color} text-white font-display font-bold text-lg shadow-lg`}
            >
              {String(event.id).padStart(2, '0')}
            </span>
          </div>

          {/* Image */}
          <div className="relative aspect-square w-full transition-transform duration-700 group-hover:scale-105">
            <Image src={event.image} alt={event.name} fill className="object-contain" />
          </div>

          {/* Decorative Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
      </div>

      {/* Content Section */}
      <div ref={contentRef} className="flex-1 w-full">
        <div className="flex flex-col h-full justify-center">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-gray-900 mb-3">
              {event.name}
            </h2>
            <div
              className={`inline-block px-4 py-1.5 rounded-full ${event.bgColor} text-gray-700 font-medium text-sm border border-black/5`}
            >
              {event.tagline}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-8 mb-8">
            {/* Rules */}
            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                <span className={`w-2 h-2 rounded-full ${event.color}`} />
                Rules
              </h3>
              <ul className="space-y-3">
                {event.rules.map((rule, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed"
                  >
                    <svg
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${event.color.replace('bg-', 'text-')}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                <span className={`w-2 h-2 rounded-full ${event.color}`} />
                Instructions
              </h3>
              <ul className="space-y-3">
                {event.instructions.map((inst, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-gray-600 leading-relaxed"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>{inst}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Notes */}
          {event.notes.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100/50 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-amber-900">
                <span className="font-bold">Note: </span>
                {event.notes.join('. ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
