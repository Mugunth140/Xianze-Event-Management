'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

interface EventCard {
    id: string;
    title: string;
    category: string;
    description: string;
    icon: string;
    color: string;
}

const events: EventCard[] = [
    {
        id: 'coding',
        title: 'Code Sprint',
        category: 'Coding',
        description: 'Test your programming skills in our intense coding competition. Solve algorithmic challenges and compete for glory.',
        icon: '💻',
        color: 'from-blue-500 to-indigo-600',
    },
    {
        id: 'design',
        title: 'Design Duel',
        category: 'Design',
        description: 'Unleash your creativity in the ultimate design battle. Create stunning visuals and innovative UI/UX solutions.',
        icon: '🎨',
        color: 'from-pink-500 to-rose-600',
    },
    {
        id: 'quiz',
        title: 'Tech Quiz',
        category: 'Knowledge',
        description: 'Put your tech knowledge to the test. From programming fundamentals to cutting-edge technologies.',
        icon: '🧠',
        color: 'from-amber-500 to-orange-600',
    },
];

export default function EventsSection() {
    const sectionRef = useRef<HTMLElement>(null);
    const headingRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section) return;

        // Heading animation
        if (headingRef.current) {
            gsap.fromTo(
                headingRef.current,
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: section,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse',
                    },
                }
            );
        }

        // Cards stagger animation
        if (scrollerRef.current) {
            const cards = scrollerRef.current.querySelectorAll('.event-card');
            gsap.fromTo(
                cards,
                { opacity: 0, x: 50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 0.6,
                    stagger: 0.15,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: scrollerRef.current,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse',
                    },
                }
            );
        }

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            className="py-20 lg:py-28 bg-white overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div ref={headingRef} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 mb-4">
                            <span className="text-sm font-medium text-primary-600">Featured Events</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gray-900">
                            Exciting <span className="text-primary-600">Competitions</span> Await
                        </h2>
                    </div>
                    <Link
                        href="/events"
                        className="liquid-glass-btn inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-full self-start sm:self-auto"
                    >
                        <span>Explore All Events</span>
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>

                {/* Horizontally Scrollable Cards */}
                <div
                    ref={scrollerRef}
                    className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {events.map((event) => (
                        <Link
                            key={event.id}
                            href={`/event/${event.id}`}
                            className="event-card flex-shrink-0 w-[320px] sm:w-[360px] snap-start group"
                        >
                            <div className="h-full p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary-200 hover:-translate-y-2 transition-all duration-300">
                                {/* Icon */}
                                <div
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${event.color} flex items-center justify-center text-2xl mb-5 shadow-lg`}
                                >
                                    {event.icon}
                                </div>

                                {/* Category */}
                                <span className="text-sm font-medium text-primary-600 mb-2 block">
                                    {event.category}
                                </span>

                                {/* Title */}
                                <h3 className="text-xl font-display font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                                    {event.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 leading-relaxed mb-4">
                                    {event.description}
                                </p>

                                {/* Link indicator */}
                                <div className="flex items-center gap-2 text-primary-600 font-medium">
                                    <span>Learn more</span>
                                    <svg
                                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Scroll hint for mobile */}
                <div className="flex items-center justify-center gap-2 mt-6 text-gray-400 text-sm lg:hidden">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    <span>Swipe to explore</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </section>
    );
}
