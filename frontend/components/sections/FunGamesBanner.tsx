'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import { FaDice, FaGamepad, FaGhost, FaTrophy } from 'react-icons/fa';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function FunGamesBanner() {
  const bannerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const banner = bannerRef.current;
    if (!banner || !contentRef.current) return;

    // Main Card Animation - Cinematic Fast
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: banner,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });

    tl.fromTo(
      contentRef.current,
      { opacity: 0, y: 60, scale: 0.95, filter: 'blur(10px)' },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.8,
        ease: 'power4.out',
      }
    );

    // Floating Icons Animation
    if (iconsRef.current) {
      const icons = iconsRef.current.children;
      Array.from(icons).forEach((icon, index) => {
        gsap.to(icon, {
          y: -15,
          rotation: index % 2 === 0 ? 10 : -10,
          duration: 2 + index * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.2,
        });
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={bannerRef} className="py-8 lg:py-12 relative overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={contentRef}
          className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-primary-500/20 group opacity-0"
          style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #8b5cf6 100%)',
          }}
        >
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-32 left-20 w-[500px] h-[500px] bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
          </div>

          {/* Noise Overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] mix-blend-overlay pointer-events-none" />

          <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24 text-center">
            {/* Floating Icons Container */}
            <div ref={iconsRef} className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Top Left - Gamepad */}
              <div className="absolute top-12 left-12 text-white/10 text-6xl transform -rotate-12">
                <FaGamepad />
              </div>
              {/* Top Right - Ghost */}
              <div className="absolute top-16 right-16 text-white/10 text-5xl transform rotate-12">
                <FaGhost />
              </div>
              {/* Bottom Left - Dice */}
              <div className="absolute bottom-16 left-20 text-white/10 text-7xl transform -rotate-6">
                <FaDice />
              </div>
              {/* Bottom Right - Trophy */}
              <div className="absolute bottom-12 right-24 text-white/10 text-6xl transform rotate-6">
                <FaTrophy />
              </div>
            </div>

            <div className="relative z-20 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 mx-auto">
                <span className="text-2xl">🕹️</span>
                <span className="text-sm font-bold text-white uppercase tracking-widest">
                  Chill Zone
                </span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-7xl font-display font-black text-white mb-6 tracking-tight drop-shadow-sm">
                Fun Games{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                  Unleashed
                </span>
              </h2>

              <p className="text-lg sm:text-2xl text-white/90 leading-relaxed font-medium max-w-2xl mx-auto drop-shadow-sm">
                Take a break from the code and chaos! Dive into our exclusive mini-games arena. Win
                exciting instant prizes, challenge your friends, and recharge your batteries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
