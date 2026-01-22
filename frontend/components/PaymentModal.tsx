'use client';

import gsap from 'gsap';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId1: string;
  upiId2: string; // Alternative UPI ID
  amount: string;
  name: string; // Payee Name (e.g. Xianze2K26)
}

const PaymentModal = ({ isOpen, onClose, upiId1, upiId2, amount, name }: PaymentModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [useAlternative, setUseAlternative] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Animate In
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { y: '100%' },
        { y: '0%', duration: 0.4, ease: 'power3.out', delay: 0.1 }
      );
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(modalRef.current, {
      y: '100%',
      duration: 0.3,
      ease: 'power3.in',
      onComplete: onClose,
    });
  };

  if (!isOpen) return null;

  const currentUpiId = useAlternative ? upiId2 : upiId1;
  const note = 'Xianze 2K26 Registration';

  // Standard UPI URL format (works as fallback)
  const upiUrl = `upi://pay?pa=${encodeURIComponent(currentUpiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

  // App-specific deep links
  const getAppLink = (appName: string) => {
    const params = `pa=${encodeURIComponent(currentUpiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

    switch (appName) {
      case 'Google Pay':
        // GPay uses tez:// or intent scheme
        return `tez://upi/pay?${params}`;
      case 'PhonePe':
        // PhonePe uses its custom scheme with /pay path
        return `phonepe://pay?${params}`;
      case 'Paytm':
        // Paytm uses paytmmp:// scheme
        return `paytmmp://pay?${params}`;
      default:
        // Standard UPI for other apps
        return upiUrl;
    }
  };

  const apps = [
    {
      name: 'Google Pay',
      bg: 'bg-white hover:bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      image: '/google-pay-icon.png',
    },
    {
      name: 'PhonePe',
      bg: 'bg-white hover:bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      image: '/phonepe-icon.png',
    },
    {
      name: 'Paytm',
      bg: 'bg-white hover:bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-800',
      image: '/paytm-icon.png',
    },
    {
      name: 'Other App',
      bg: 'bg-gray-50 hover:bg-gray-100',
      border: 'border-transparent',
      text: 'text-gray-600',
      // Fallback SVG for generic
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="w-8 h-8 text-gray-400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
            fill="currentColor"
          />
          <path d="M11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none sm:items-center">
      {/* Overlay - Light/Transparent */}
      <div
        ref={overlayRef}
        onClick={handleClose}
        className="absolute inset-0 bg-white/80 backdrop-blur-sm pointer-events-auto transition-opacity"
      />

      {/* Modal - Modern Card Design */}
      <div
        ref={modalRef}
        className="relative w-full sm:max-w-sm max-h-[85dvh] overflow-y-auto bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-10 shadow-2xl pointer-events-auto transform transition-transform border border-gray-200"
      >
        {/* Handle for mobile feel */}
        <div className="sticky top-0 w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Select Payment App</h3>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full text-primary-700 font-medium text-sm">
            <span>₹{amount} per head</span>
          </div>
        </div>

        {/* Selected UPI Info */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">
            Paying To
          </p>
          <p className="font-mono text-sm text-gray-600 bg-gray-50 inline-block px-3 py-1 rounded-lg border border-gray-100">
            {currentUpiId}
          </p>
        </div>

        {/* Apps Grid - Clean and Minimal */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {apps.map((app) => (
            <a
              key={app.name}
              href={getAppLink(app.name)}
              className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all active:scale-95 ${app.bg} ${app.border} shadow-sm group`}
            >
              <div className="mb-3 transform transition-transform group-hover:scale-110">
                {app.image ? (
                  <div className="relative w-12 h-12">
                    <Image src={app.image} alt={app.name} fill className="object-contain" />
                  </div>
                ) : (
                  app.icon
                )}
              </div>
              <span className={`text-sm font-semibold ${app.text}`}>{app.name}</span>
            </a>
          ))}
        </div>

        {/* Alternative Toggle - Clean Bottom Bar */}
        <div
          onClick={() => setUseAlternative(!useAlternative)}
          className="border-t border-gray-100 pt-4 pb-4 cursor-pointer group"
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  useAlternative
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                }`}
              >
                {useAlternative ? '✓' : '⚡'}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">
                  {useAlternative ? 'Using Alternative UPI' : 'Payment Failing?'}
                </p>
                <p className="text-xs text-gray-500">
                  {useAlternative ? 'Tap to switch back' : 'Tap to try alternative ID'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Explicit Cancel Button */}
        <button
          onClick={handleClose}
          className="w-full bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 active:scale-95 transition-all mb-8"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PaymentModal;
