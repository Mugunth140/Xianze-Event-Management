'use client';

import { animate, motion, useMotionValue } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { events } from '../../data/events';

export default function EventsSection() {
  const [width, setWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const scroll = (direction: 'left' | 'right') => {
    const currentX = x.get();
    const scrollAmount = direction === 'left' ? 400 : -400;
    let newX = currentX + scrollAmount;

    // Clamp values
    if (newX > 0) newX = 0;
    if (newX < -width) newX = -width;

    animate(x, newX, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  };

  useLayoutEffect(() => {
    if (carouselRef.current && innerRef.current) {
      const updateWidth = () => {
        if (carouselRef.current && innerRef.current) {
          const newWidth = innerRef.current.scrollWidth - carouselRef.current.offsetWidth;
          setWidth(Math.max(0, newWidth));
        }
      };

      // Initial calculation
      updateWidth();

      // Recalculate on resize
      window.addEventListener('resize', updateWidth);

      return () => {
        window.removeEventListener('resize', updateWidth);
      };
    }
  }, []);

  return (
    <section className="py-20 lg:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-4">
              <span className="text-sm font-medium text-primary-600">Featured Events</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900">
              Exciting <span className="text-primary-600">Competitions</span> Await
            </h2>
          </motion.div>
          <Link
            href="/events"
            className="liquid-glass-btn inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-full self-start sm:self-auto"
          >
            <span>Explore All Events</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Navigation Buttons */}
          <div className="hidden lg:block">
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-lg hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all duration-300 opacity-0 group-hover:opacity-100"
              aria-label="Previous slide"
            >
              <FaChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-lg hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-all duration-300 opacity-0 group-hover:opacity-100"
              aria-label="Next slide"
            >
              <FaChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Carousel */}
          <motion.div
            ref={carouselRef}
            className="cursor-grab active:cursor-grabbing overflow-hidden py-4"
          >
            <motion.div
              ref={innerRef}
              style={{ x }}
              drag="x"
              dragConstraints={{ right: 0, left: -width }}
              whileTap={{ cursor: 'grabbing' }}
              dragElastic={0.1}
              className="flex gap-6"
            >
              {events.map((event) => (
                <motion.div key={event.id} className="min-w-[320px] sm:min-w-[360px] h-[400px]">
                  <Link href={`/events`} className="block h-full group/card">
                    <div className="h-full p-6 rounded-2xl bg-white border border-gray-100 shadow-md hover:shadow-xl hover:border-primary-200 hover:-translate-y-2 transition-all duration-300">
                      {/* Image */}
                      <div
                        className={`relative w-full h-48 rounded-xl ${event.bgColor} mb-6 overflow-hidden`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center p-6">
                          <Image
                            src={event.image}
                            alt={event.name}
                            width={150}
                            height={150}
                            className="object-contain transition-transform duration-500 group-hover/card:scale-110"
                          />
                        </div>
                        <div className="absolute top-4 left-4">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${event.color} text-white font-display font-bold text-sm shadow-md`}
                          >
                            {String(event.id).padStart(2, '0')}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <h3 className="text-xl font-display font-bold text-gray-900 mb-2 group-hover/card:text-primary-600 transition-colors">
                          {event.name}
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">
                          {event.tagline}
                        </p>

                        {/* Link indicator */}
                        <div className="flex items-center gap-2 text-primary-600 font-medium">
                          <span>View Details</span>
                          <svg
                            className="w-4 h-4 transition-transform group-hover/card:translate-x-1"
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
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Drag hint for mobile */}
        <div className="flex items-center justify-center gap-2 mt-8 text-gray-400 text-sm lg:hidden">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16l-4-4m0 0l4-4m-4 4h18"
            />
          </svg>
          <span>Drag to explore</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
