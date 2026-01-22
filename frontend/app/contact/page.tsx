'use client';

import { ApiError, createSubmitDebounce, fetchWithRetry, getApiUrl } from '@/lib/api';
import { sanitizeInput, validateEmail, validateMessage, validateName } from '@/lib/validation';
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
  { name: 'Sri Rajakavika', phone: '8072390391', role: 'Student Coordinator' },
  { name: 'Karthick Raja', phone: '9944910261', role: 'Student Coordinator' },
  { name: 'Sowdhanya Laxna', phone: '9361077188', role: 'Student Coordinator' },
  { name: 'Saran', phone: '9025744404', role: 'Student Coordinator' },
  { name: 'Kaviyadharshini', phone: '8438437557', role: 'Student Coordinator' }
];

// Debounce for preventing double submissions
const submitDebounce = createSubmitDebounce(3000);

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    message?: string;
  }>({});

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const coordinatorsRef = useRef<HTMLDivElement>(null); // New Ref for Coordinators
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        toggleActions: 'play none none none',
      },
    });

    // Header
    if (headerRef.current) {
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: 60, filter: 'blur(10px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power4.out' }
      );
    }

    // Contact Cards
    const cards = document.querySelectorAll('.contact-card-item'); // Changed class name targeting
    if (cards.length > 0) {
      tl.fromTo(
        cards,
        { opacity: 0, y: 50, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.1,
          ease: 'power4.out',
        },
        '-=0.6'
      );
    }

    // Student Coordinators Section
    if (coordinatorsRef.current) {
      tl.fromTo(
        coordinatorsRef.current,
        { opacity: 0, y: 50, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          ease: 'power4.out',
        },
        '-=0.6'
      );
    }

    // Form
    if (formRef.current) {
      tl.fromTo(
        formRef.current,
        { opacity: 0, y: 60, filter: 'blur(10px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          ease: 'power4.out',
        },
        '-=0.6'
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submissions with debounce
    if (!submitDebounce()) {
      setStatusMessage('Please wait before submitting again.');
      setStatusType('error');
      return;
    }

    // Prevent submission while already loading
    if (isLoading) return;

    setIsLoading(true);
    setFieldErrors({});
    setStatusMessage('');
    setStatusType('');

    // Validate fields
    const errors: { name?: string; email?: string; message?: string } = {};

    const nameResult = validateName(formData.name);
    if (!nameResult.isValid) errors.name = nameResult.error!;

    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid) errors.email = emailResult.error!;

    const messageResult = validateMessage(formData.message, 2000);
    if (!messageResult.isValid) errors.message = messageResult.error!;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStatusMessage('Please fix the errors below.');
      setStatusType('error');
      setIsLoading(false);
      return;
    }

    // Sanitize before sending
    const sanitizedData = {
      name: sanitizeInput(formData.name),
      email: formData.email.trim().toLowerCase(),
      message: sanitizeInput(formData.message),
    };

    try {
      // Use fetchWithRetry for automatic retry on network/server errors
      const response = await fetchWithRetry(getApiUrl('/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedData),
      });

      if (response.ok) {
        setStatusMessage('Message sent! A confirmation email has been sent to your inbox.');
        setStatusType('success');
        setFormData({ name: '', email: '', message: '' });
      } else if (response.status === 429) {
        setStatusMessage('Too many requests. Please wait a moment and try again.');
        setStatusType('error');
      } else if (response.status >= 500) {
        setStatusMessage('Server is busy. Please try again in a few moments.');
        setStatusType('error');
      } else {
        setStatusMessage('Failed to send message. Please try again.');
        setStatusType('error');
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'TIMEOUT') {
          setStatusMessage('Request timed out. Please check your connection and try again.');
        } else if (error.code === 'NETWORK_ERROR') {
          setStatusMessage('Network error. Please check your internet connection.');
        } else {
          setStatusMessage(error.message);
        }
      } else {
        setStatusMessage('An unexpected error occurred. Please try again later.');
      }
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-clear success messages
  useEffect(() => {
    if (statusType === 'success' && statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage('');
        setStatusType('');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [statusType, statusMessage]);

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
        <div ref={headerRef} className="text-center mb-16 opacity-0">
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
            </span>{' '}
            !
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
            href={process.env.NEXT_PUBLIC_WHATSAPP_URL || '#'}
            target="_blank"
            className="contact-card-item group p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-100 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 opacity-0"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-green-100 group-hover:bg-green-500 group-hover:shadow-lg group-hover:shadow-green-500/30 flex items-center justify-center text-3xl transition-all duration-300">
                <FaWhatsapp className="text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  WhatsApp Community
                </h2>
                <p className="text-sm text-gray-600 mt-1">Join our community for updates</p>
              </div>
            </div>
          </Link>

          {/* Email Card */}
          <a
            href="mailto:contact@xianze.tech"
            className="contact-card-item group p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-gray-100 hover:border-primary-400 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 opacity-0"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-100 group-hover:bg-primary-500 group-hover:shadow-lg group-hover:shadow-primary-500/30 flex items-center justify-center text-2xl transition-all duration-300">
                <span className="group-hover:scale-110 transition-transform">✉️</span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  Email Us
                </h2>
                <p className="text-sm text-gray-600 mt-1">contact@xianze.tech</p>
              </div>
            </div>
          </a>
        </div>

        {/* Student Coordinators */}
        <div ref={coordinatorsRef} className="mb-12 opacity-0">
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
          className="relative rounded-3xl bg-white border border-gray-100 p-8 sm:p-12 overflow-hidden opacity-0"
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

            <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-3 text-center">
              Send us a Message
            </h2>
            <p className="text-gray-600 text-center mb-8 max-w-md mx-auto">
              Have something specific to ask? Fill out the form below and we&apos;ll get back to you
              soon!
            </p>

            {/* Status Message */}
            {statusMessage && (
              <div
                className={`text-center py-3 px-4 rounded-xl font-medium mb-6 transition-all ${
                  statusMessage.includes('sent')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {statusMessage.includes('sent') ? '✅' : '❌'} {statusMessage}
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
