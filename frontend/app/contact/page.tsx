'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface Coordinator {
  name: string;
  phone: string;
  role: string;
}

const coordinators: Coordinator[] = [
  { name: 'Sharulatha', phone: '8148529920', role: 'Student Coordinator' },
  { name: 'Rajakavika', phone: '8072390391', role: 'Student Coordinator' },
  { name: 'Mugunth', phone: '6384761234', role: 'Student Coordinator' },
];

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

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

    // Cards stagger animation
    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.contact-card');
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

    // Form animation
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: formRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatusMessage('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setStatusMessage('Failed to send message. Please try again.');
      }
    } catch {
      setStatusMessage('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }

    setTimeout(() => setStatusMessage(''), 5000);
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
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 border border-primary-200 mb-6 shadow-sm">
            <span className="text-2xl">📬</span>
            <span className="text-sm font-semibold text-primary-700 uppercase tracking-wider">
              Get In Touch
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-4">
            Let&apos;s{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary-600">Connect</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-primary-200/60 -rotate-1 -z-0" />
            </span>
            ! 💬
          </h1>

          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Have questions about XIANZE 2K26? We&apos;re here to help you out. Reach out through any
            of the channels below!
          </p>
        </div>

        {/* Quick Contact Options */}
        <div ref={cardsRef} className="grid sm:grid-cols-2 gap-4 mb-12">
          {/* WhatsApp Community Card */}
          <Link
            href="https://chat.whatsapp.com/GObiBOjDxn5KTC2GVwCXXp"
            target="_blank"
            className="contact-card group p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-100 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-green-100 group-hover:bg-green-500 group-hover:shadow-lg group-hover:shadow-green-500/30 flex items-center justify-center text-3xl transition-all duration-300">
                <FaWhatsapp className="text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  WhatsApp Community
                </h3>
                <p className="text-sm text-gray-500 mt-1">Join our community for updates</p>
              </div>
            </div>
          </Link>

          {/* Email Card */}
          <a
            href="mailto:support@xianze.tech"
            className="contact-card group p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-100 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-100 group-hover:bg-primary-500 group-hover:shadow-lg group-hover:shadow-primary-500/30 flex items-center justify-center text-2xl transition-all duration-300">
                <span className="group-hover:scale-110 transition-transform">✉️</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  Email Us
                </h3>
                <p className="text-sm text-gray-500 mt-1">support@xianze.tech</p>
              </div>
            </div>
          </a>
        </div>

        {/* Student Coordinators */}
        <div className="mb-12">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-6 text-center">
            Student Coordinators 📞
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {coordinators.map((coordinator, index) => (
              <a
                key={index}
                href={`tel:+91${coordinator.phone}`}
                className="contact-card group p-5 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-100 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-purple-100 flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform">
                  👤
                </div>
                <h4 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {coordinator.name}
                </h4>
                <p className="text-sm text-primary-600 font-medium mt-1">{coordinator.phone}</p>
                <span className="inline-block mt-2 text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                  {coordinator.role}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Contact Form Section */}
        <div
          ref={formRef}
          className="relative rounded-3xl bg-white border border-gray-100 p-8 sm:p-12 overflow-hidden"
        >
          {/* Subtle background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(#6D40D4 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10">
            <div className="w-16 h-16 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center mb-6 text-3xl">
              ✍️
            </div>

            <h3 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3 text-center">
              Send us a Message
            </h3>
            <p className="text-gray-500 text-center mb-8 max-w-md mx-auto">
              Have something specific to ask? Fill out the form below and we&apos;ll get back to you
              soon!
            </p>

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`text-center py-3 px-4 rounded-xl font-medium mb-6 transition-all ${
                  statusMessage.includes('successfully')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {statusMessage.includes('successfully') ? '✅' : '❌'} {statusMessage}
              </div>
            )}

            {/* Loader */}
            {isLoading && (
              <div className="flex justify-center mb-6">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
              </div>
            )}

            {/* Form */}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-4 rounded-xl text-gray-800 bg-gray-50 border-2 border-gray-100 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full p-4 rounded-xl text-gray-800 bg-gray-50 border-2 border-gray-100 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us what's on your mind..."
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full p-4 rounded-xl text-gray-800 bg-gray-50 border-2 border-gray-100 placeholder:text-gray-400 transition-all duration-300 hover:border-primary-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none focus:bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full liquid-glass-btn inline-flex items-center justify-center px-8 py-4 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>Send Message</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
