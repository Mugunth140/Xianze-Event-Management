'use client';

import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        { label: 'Home', href: '/' },
        { label: 'Events', href: '/events' },
        { label: 'Schedule', href: '/schedule' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Contact', href: '/contact' },
    ];

    return (
        <footer className="bg-gray-950 text-white relative overflow-hidden">

            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Main Footer Content */}
                <div className="py-10 md:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    {/* Brand Column */}
                    <div className="sm:col-span-2 lg:col-span-1 space-y-4">
                        <div className="p-3 inline-block">
                            <Image
                                src="/kgcas_logo.png"
                                alt="KGCAS Logo"
                                width={180}
                                height={100}
                                className="h-auto w-auto max-w-[150px] md:max-w-[180px]"
                            />
                        </div>
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-xs">
                            Department of Software Systems and Computer Science (PG)
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-display font-semibold text-base md:text-lg mb-4 md:mb-6 text-white">
                            Quick Links
                        </h4>
                        <ul className="space-y-2 md:space-y-3">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 hover:text-white flex items-center gap-2 group transition-colors duration-200 text-sm md:text-base"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-display font-semibold text-base md:text-lg mb-4 md:mb-6 text-white">
                            Contact Us
                        </h4>
                        <ul className="space-y-3 md:space-y-4">
                            <li>
                                <a
                                    href="mailto:xianze2026@gmail.com"
                                    className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
                                >
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 group-hover:bg-primary-600/20 flex items-center justify-center transition-colors flex-shrink-0">
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs md:text-sm break-all">xianze2026@gmail.com</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+916384761234"
                                    className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group"
                                >
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 group-hover:bg-primary-600/20 flex items-center justify-center transition-colors flex-shrink-0">
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs md:text-sm">+91 63847 61234</span>
                                </a>
                            </li>
                            <li>
                                <div className="flex items-center gap-3 text-gray-400">
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 md:w-5 md:h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <span className="text-xs md:text-sm">KGCAS, Coimbatore</span>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="py-4 md:py-6 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-gray-500 text-xs md:text-sm text-center sm:text-left">
                            © {currentYear} XIANZE. All rights reserved.
                        </p>
                        <p className="text-gray-500 text-xs md:text-sm">
                            Credits: Sharan, Mugunth
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
