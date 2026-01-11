'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

const Countdown = dynamic(() => import('./Countdown'), { ssr: false });

const RegisterCounter = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const badgeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section || !cardRef.current) return;

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
            },
        });

        tl.fromTo(
            cardRef.current,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
        );

        if (badgeRef.current) {
            tl.fromTo(
                badgeRef.current,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.6 },
                '-=0.4'
            );
        }

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill());
        };
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative w-full py-20 px-6 flex items-center justify-center bg-white overflow-hidden"
        >
            {/* Subtle background gradient */}
            <div
                className="absolute inset-0 bg-gradient-to-b from-primary-50/60 via-white to-white pointer-events-none"
            />

            <div
                ref={cardRef}
                className="relative z-10 w-full max-w-[720px] rounded-3xl bg-white/80 backdrop-blur-xl border border-primary-200/40 shadow-[0_20px_40px_rgba(109,64,212,0.15)] px-10 py-12 text-center md:px-6 md:py-10"
            >
                {/* Badge */}
                <div
                    ref={badgeRef}
                    className="inline-flex items-center gap-2 rounded-full bg-primary-100/70 px-4 py-1.5 text-sm font-semibold text-primary-700 border border-primary-200 shadow-sm"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-600" />
                    </span>
                    Limited Availability
                </div>

                <p className="text-neutral-600 text-[1.05rem] max-w-[520px] mx-auto mb-8 mt-5 md:text-[0.95rem]">
                    Secure your spot before it's too late. Register now and be part of
                    <span className="font-semibold text-primary-600"> Xianze 2K26</span>.
                </p>

                {/* Countdown */}
                <div className="mb-10 text-3xl font-semibold text-primary-700 md:text-2xl">
                    <Countdown targetDate="2026-02-07T23:59:59" />
                </div>

                {/* CTA */}
                <Link
                    href="/register"
                    className="liquid-glass-btn inline-flex items-center justify-center rounded-xl px-8 py-3 text-white font-semibold text-[1rem] md:px-6 md:py-2.5 md:text-[0.95rem]"
                >
                    Register Now
                </Link>
            </div>
        </section>
    );
};

export default RegisterCounter;
