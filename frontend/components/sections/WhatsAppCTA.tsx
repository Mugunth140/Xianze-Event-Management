'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';
import { FaCommentDots, FaPhoneAlt, FaShareAlt, FaWhatsapp } from 'react-icons/fa';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function WhatsAppCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const iconsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !cardRef.current) return;

    // Main Card Animation - Cinematic Fast
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        once: true,
      },
    });

    tl.fromTo(
      cardRef.current,
      { opacity: 0, y: 40, scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.65,
        ease: 'power3.out',
      }
    );

    // Floating Icons Animation
    if (iconsRef.current) {
      const icons = iconsRef.current.children;
      Array.from(icons).forEach((icon, index) => {
        gsap.to(icon, {
          y: -20,
          rotation: index % 2 === 0 ? 15 : -15,
          duration: 2.5 + index * 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: index * 0.3,
        });
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  // Replace with actual WhatsApp community link
  const whatsappLink =
    process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://chat.whatsapp.com/GObiBOjDxn5KTC2GVwCXXp';

  return (
    <section ref={sectionRef} className="py-12 lg:py-20 bg-transparent relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-green-900/20 group opacity-0"
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          }}
        >
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 opacity-40 mix-blend-overlay">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-green-300 rounded-full mix-blend-multiply filter blur-3xl animate-blob opacity-70" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-800 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 opacity-60" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 opacity-50" />
          </div>

          {/* Noise Overlay */}
          <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none" />

          <div className="relative z-10 px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24 text-center">
            {/* Floating Icons Container */}
            <div ref={iconsRef} className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Top Left - Basic Icon */}
              <div className="absolute top-12 left-12 text-white/10 text-7xl transform -rotate-12">
                <FaCommentDots />
              </div>
              {/* Top Right - Share */}
              <div className="absolute top-16 right-20 text-white/10 text-6xl transform rotate-12">
                <FaShareAlt />
              </div>
              {/* Bottom Left - Phone */}
              <div className="absolute bottom-16 left-20 text-white/10 text-5xl transform -rotate-6">
                <FaPhoneAlt />
              </div>
              {/* Bottom Right - Whatsapp Logo */}
              <div className="absolute bottom-12 right-16 text-white/20 text-8xl transform rotate-12">
                <FaWhatsapp />
              </div>
            </div>

            <div className="relative z-20 max-w-4xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white text-green-600 shadow-xl shadow-black/10 mb-8 transform transition-transform duration-500 hover:scale-110">
                <FaWhatsapp className="w-10 h-10" />
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold text-white mb-6 drop-shadow-sm">
                Join the <span className="text-green-100">Conversation</span>
              </h2>

              <p className="text-lg sm:text-xl text-green-50 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                Get instant updates, exclusive announcements, and connect with thousands of other
                tech enthusiasts in our official WhatsApp community.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center px-8 py-4 bg-white text-green-700 font-bold rounded-full shadow-xl shadow-green-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <FaWhatsapp className="w-5 h-5" />
                    <span>Join Community</span>
                  </span>
                  <div className="absolute inset-0 bg-green-50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
