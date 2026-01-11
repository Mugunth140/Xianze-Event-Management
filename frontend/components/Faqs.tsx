'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface FAQItem {
  question: string;
  answer: string;
  emoji: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is Xianze?',
    answer:
      "Xianze is an inter-college technical event where students showcase their skills in various competitions and workshops. It's where innovation meets fun! 🚀",
    emoji: '🎯',
  },
  {
    question: 'How can I register?',
    answer:
      "You can register online through our official website. Just hit that Register button and you're set! Quick and easy.",
    emoji: '📝',
  },
  {
    question: 'Is there a cash prize for winners?',
    answer:
      'Yes! Winners of competitions can win cash prizes of up to ₹20,000 along with certificates and other exciting rewards. Time to flex! 💰',
    emoji: '🏆',
  },
  {
    question: 'Is food provided?',
    answer:
      "Absolutely! Lunch will be provided for participants from other colleges. We've got your belly covered! 🍕",
    emoji: '🍔',
  },
  {
    question: 'Who can participate?',
    answer:
      "Anyone with an interest in technology and innovation can participate. Doesn't matter if you're a pro or just starting — everyone's welcome!",
    emoji: '👥',
  },
  {
    question: 'Will I get a certificate?',
    answer:
      'Yes! All participants will receive certificates, and winners will get special recognition and prizes. Proof of your awesomeness! 📜',
    emoji: '🎖️',
  },
];

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Header animation
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // FAQ cards stagger animation
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.faq-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: 'back.out(1.2)',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      ref={sectionRef}
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          {/* Fun badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-200 mb-6 shadow-sm">
            <span className="text-2xl">🤔</span>
            <span className="text-sm font-semibold text-primary-700 uppercase tracking-wider">
              Got Questions?
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-4">
            We&apos;ve Got{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary-600">Answers</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-primary-200/60 -rotate-1 -z-0" />
            </span>
            ! 🎉
          </h1>

          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Everything you need to know about XIANZE 2K26. Can&apos;t find what you&apos;re looking
            for? Hit us up!
          </p>
        </div>

        {/* FAQ Cards */}
        <div ref={cardsRef} className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              onClick={() => toggleFAQ(index)}
              className={`
                                faq-card group cursor-pointer
                                p-5 sm:p-6 rounded-2xl
                                bg-white/80 backdrop-blur-sm
                                border-2 transition-all duration-300
                                ${
                                  openIndex === index
                                    ? 'border-primary-400 shadow-lg shadow-primary-500/10'
                                    : 'border-gray-100 hover:border-primary-200 hover:shadow-md'
                                }
                            `}
            >
              {/* Question */}
              <div className="flex items-start gap-4">
                {/* Emoji */}
                <div
                  className={`
                                        flex-shrink-0 w-12 h-12 rounded-xl
                                        flex items-center justify-center text-2xl
                                        transition-all duration-300
                                        ${
                                          openIndex === index
                                            ? 'bg-primary-500 shadow-lg shadow-primary-500/30 scale-110'
                                            : 'bg-primary-100 group-hover:bg-primary-200'
                                        }
                                    `}
                >
                  {openIndex === index ? '✨' : faq.emoji}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <h3
                      className={`
                                            text-lg font-semibold transition-colors duration-200
                                            ${openIndex === index ? 'text-primary-700' : 'text-gray-900'}
                                        `}
                    >
                      {faq.question}
                    </h3>

                    {/* Toggle icon */}
                    <div
                      className={`
                                                flex-shrink-0 w-8 h-8 rounded-full
                                                flex items-center justify-center
                                                text-lg font-bold
                                                transition-all duration-300
                                                ${
                                                  openIndex === index
                                                    ? 'bg-primary-500 text-white rotate-45'
                                                    : 'bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600'
                                                }
                                            `}
                    >
                      +
                    </div>
                  </div>

                  {/* Answer */}
                  <div
                    className={`
                                            overflow-hidden transition-all duration-300 ease-out
                                            ${openIndex === index ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}
                                        `}
                  >
                    <p className="text-gray-600 leading-relaxed pr-12">{faq.answer}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Contact CTA Section */}
        <div className="mt-24 mb-12">
          <div className="relative rounded-3xl bg-white border border-gray-100 p-12 text-center overflow-hidden">
            {/* Subtle background pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(#6D40D4 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="w-16 h-16 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center mb-8 text-3xl">
                👋
              </div>

              <h3 className="text-3xl font-display font-bold text-gray-900 mb-4">
                Still have questions?
              </h3>
              <p className="text-gray-500 text-lg mb-10 leading-relaxed">
                Can&apos;t find the answer you&apos;re looking for? Please chat to our friendly
                team.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/contact"
                  className="min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors duration-200"
                >
                  <span>Get in touch</span>
                </a>
                <a
                  href="mailto:xianze2026@gmail.com"
                  className="min-w-[160px] inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  <span>Email us</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
