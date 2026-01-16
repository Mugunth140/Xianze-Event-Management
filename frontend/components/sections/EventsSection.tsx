'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { events } from '../../data/events';

export default function EventsSection() {
  return (
    <section className="py-8 lg:py-12 bg-transparent overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
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
            className="liquid-glass-btn inline-flex items-center px-6 py-3 text-white font-semibold rounded-full self-start sm:self-auto"
          >
            <span>Explore All Events</span>
          </Link>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full group">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-[#f8f5ff] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-[#f8f5ff] to-transparent z-10" />

        {/* Marquee Content */}
        <div className="flex overflow-hidden">
          {/* First List */}
          <div className="flex gap-6 animate-marquee py-4 px-3">
            {events.map((event) => (
              <EventCard key={`list1-${event.id}`} event={event} />
            ))}
            {/* Duplicate list for seamless loop - immediately following first list in same container if needed,
                but usually better to have two siblings for the marquee trick.
                Actually, the standard trick is:
                <div container flex>
                  <div animate-marquee> items... </div>
                  <div animate-marquee> items... </div>
                </div>
                Let's adjust the structure to be correct for the CSS we added:
                .animate-marquee { animation: marquee ... }
                
                Wait, the CSS I added was:
                .animate-marquee { animation: ... translateX(-50%) }
                This implies the content should be double width. 
                
                So I will render the list twice INSIDE the single animating container.
            */}
            {events.map((event) => (
              <EventCard key={`list2-${event.id}`} event={event} />
            ))}
          </div>

          {/* 
             NOTE: The CSS `translateX(-50%)` works if the container is 200% width of the viewport or simply if the content inside is long enough. 
             Ideally the `animate-marquee` class is on the WRAPPER moving left.
             Inside it, we have the items.
             
             To make it truly seamless, the animation should move by exactly 50% of the TOTAL width (which is the width of one set of items).
             
             Let's ensure the structure matches:
             <div className="flex animate-marquee ...">
                {items}
                {items}
             </div>
             
             This single div moves left. When it hits -50%, it resets to 0. 
             Since the second half is identical to the first, the reset is invisible.
          */}
        </div>
      </div>
    </section>
  );
}

function EventCard({ event }: { event: any }) {
  return (
    <div className="min-w-[320px] sm:min-w-[360px] h-[400px]">
      <Link href={`/events`} className="block h-full group/card">
        <div className="h-full p-6 rounded-2xl bg-white border border-gray-100 shadow-md hover:shadow-xl hover:border-primary-200 hover:-translate-y-2 transition-all duration-300">
          {/* Image */}
          <div className={`relative w-full h-48 rounded-xl ${event.bgColor} mb-6 overflow-hidden`}>
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
                {event.id}
              </span>
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-xl font-display font-bold text-gray-900 mb-2 group-hover/card:text-primary-600 transition-colors">
              {event.name}
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">{event.tagline}</p>

            {/* Link indicator */}
            <div className="flex items-center text-primary-600 font-medium">
              <span>View Details</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
