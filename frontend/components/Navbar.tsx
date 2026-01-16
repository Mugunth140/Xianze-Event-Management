'use client';

import gsap from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const menuLinksRef = useRef<HTMLDivElement[]>([]);
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // GSAP animation for mobile menu
  useEffect(() => {
    if (menuContainerRef.current) {
      if (isMenuOpen) {
        // Open Animation
        const tl = gsap.timeline();

        tl.to(menuContainerRef.current, {
          opacity: 1,
          duration: 0.4,
          ease: 'power2.out',
        });

        // Stagger links
        tl.fromTo(
          menuLinksRef.current,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'back.out(1.7)',
          },
          '-=0.2'
        );

        // Animate decoration
        if (circleRef.current) {
          tl.fromTo(
            circleRef.current,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: 'elastic.out(1, 0.7)' },
            '-=0.6'
          );
        }
      } else {
        // Close Animation
        gsap.to(menuContainerRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
        });

        gsap.to(menuLinksRef.current, {
          y: 20,
          opacity: 0,
          duration: 0.2,
        });
      }
    }
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navLinks = [
    { href: '/events', label: 'Events' },
    { href: '/schedule', label: 'Schedule' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? 'liquid-glass-navbar' : 'bg-white/60 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group relative z-50">
              <div className="relative w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary-600/10 to-purple-600/10 border border-primary-200/50 shadow-lg shadow-primary-500/5 group-hover:scale-105 transition-transform duration-300 overflow-hidden backdrop-blur-sm">
                <Image
                  src="/event.png"
                  alt="Xianze Logo"
                  width={32}
                  height={32}
                  className="relative z-10 object-contain"
                />
                <div className="absolute inset-0 bg-white/40" />
              </div>
              <span className="text-2xl font-display font-bold tracking-tight text-gray-900 group-hover:text-primary-600 transition-colors duration-300">
                Xianze
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-gray-600 font-medium hover:text-primary-600 transition-colors duration-200 group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary-600 rounded-full transition-all duration-300 group-hover:w-1/2" />
                </Link>
              ))}
            </div>

            {/* CTA Button - Desktop */}
            <div className="hidden md:block">
              <Link
                href="/register"
                className="liquid-glass-btn inline-flex items-center px-7 py-3 rounded-full font-semibold text-white"
              >
                <span>Register Now</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden relative z-50 w-12 h-12 flex items-center justify-center rounded-full text-primary-600 hover:bg-primary-50 transition-colors"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-3 relative flex flex-col justify-between overflow-hidden">
                <span
                  className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 transform origin-center ${
                    isMenuOpen ? 'rotate-45 translate-y-[5px]' : ''
                  }`}
                />
                <span
                  className={`w-full h-0.5 bg-current rounded-full transition-all duration-300 transform origin-center ${
                    isMenuOpen ? '-rotate-45 -translate-y-[5px]' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Full Screen Mobile Menu Overlay */}
      <div
        ref={menuContainerRef}
        className={`fixed inset-0 z-40 md:hidden bg-white/90 backdrop-blur-3xl flex items-center justify-center pointer-events-none opacity-0 ${
          isMenuOpen ? 'pointer-events-auto' : ''
        }`}
      >
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[20%] w-[80%] h-[80%] bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
          <div className="absolute -bottom-[20%] -left-[20%] w-[80%] h-[80%] bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
          <div
            ref={circleRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary-200/30 rounded-full opacity-0"
          />
        </div>

        {/* Menu Items */}
        <div className="relative z-10 w-full px-8 pb-12 text-center">
          <div className="flex flex-col gap-8">
            {navLinks.map((link, index) => (
              <div
                key={link.href}
                ref={(el) => {
                  if (el) menuLinksRef.current[index] = el;
                }}
                className="overflow-hidden"
              >
                <Link
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-4xl sm:text-5xl font-display font-bold text-gray-900 hover:text-primary-600 transition-colors"
                >
                  {link.label}
                </Link>
              </div>
            ))}

            {/* Mobile CTA */}
            <div
              ref={(el) => {
                if (el) menuLinksRef.current[navLinks.length] = el;
              }}
              className="mt-8"
            >
              <Link
                href="/register"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center px-10 py-5 bg-primary-600 text-white text-xl font-bold rounded-full shadow-xl shadow-primary-600/30 hover:scale-105 transition-transform"
              >
                Register Now
              </Link>
            </div>
          </div>

          {/* Footer Info */}
          <div
            ref={(el) => {
              if (el) menuLinksRef.current[navLinks.length + 1] = el;
            }}
            className="mt-16 text-gray-500 text-sm font-medium"
          >
            <p>© 2026 Xianze Event Management</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
