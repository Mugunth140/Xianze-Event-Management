'use client';

import gsap from 'gsap';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  const [mounted, setMounted] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Animate In - scale and fade for centered modal
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out', delay: 0.1 }
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
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: 'power3.in',
      onComplete: onClose,
    });
  };

  if (!isOpen || !mounted) return null;

  const currentUpiId = useAlternative ? upiId2 : upiId1;
  const note = 'Xianze 2K26 Registration';

  // Copy UPI ID to clipboard
  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(currentUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

  const modalContent = (
    <>
      {/* Overlay - Fixed to Screen */}
      <div
        ref={overlayRef}
        onClick={handleClose}
        className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity"
      />

      {/* Modal - Fixed and Centered on Screen */}
      <div
        ref={modalRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        className="z-[100] w-[90%] max-w-sm h-auto max-h-[80vh] bg-white rounded-3xl sm:rounded-2xl shadow-2xl pointer-events-auto border border-gray-200 flex flex-col will-change-transform overflow-hidden"
      >
        {/* Handle for mobile feel */}
        <div className="flex-shrink-0 w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-3 mb-2" />

        {/* Scrollable Content Area */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden px-5 pb-2"
          style={{ maxHeight: 'calc(80vh - 120px)' }}
        >
          <div className="text-center mb-3">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
              {showQR ? 'Scan QR Code' : 'Pay via UPI'}
            </h3>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full text-primary-700 font-medium text-xs sm:text-sm">
              <span>₹{amount} per head</span>
            </div>
          </div>

          {/* Toggle between UPI Apps and QR */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              type="button"
              onClick={() => setShowQR(false)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                !showQR
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📱 UPI Apps
            </button>
            <button
              type="button"
              onClick={() => setShowQR(true)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                showQR ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📷 QR Code
            </button>
          </div>

          {/* UPI ID Display with Copy Button */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-2 text-center">
              UPI ID
            </p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2 border border-gray-200">
              <code className="flex-1 text-xs sm:text-sm font-mono text-gray-700 px-2 break-all">
                {currentUpiId}
              </code>
              <button
                type="button"
                onClick={handleCopyUpiId}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : useAlternative
                      ? 'bg-amber-500 text-white hover:bg-amber-600'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                }`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* QR Code View */}
          {showQR && (
            <div className="flex flex-col items-center mb-4">
              <div
                className={`relative w-48 h-48 bg-white p-3 rounded-2xl shadow-md border mb-3 ${
                  useAlternative ? 'border-amber-200' : 'border-gray-200'
                }`}
              >
                <Image
                  src={useAlternative ? '/qr2.png' : '/upi_qr.jpeg'}
                  alt="Scan to Pay"
                  fill
                  className="object-contain rounded-xl"
                />
              </div>
              <div
                className={`px-4 py-2 rounded-full border ${
                  useAlternative
                    ? 'bg-amber-100 border-amber-200'
                    : 'bg-primary-50 border-primary-100'
                }`}
              >
                <p
                  className={`text-xs font-bold uppercase tracking-widest ${
                    useAlternative ? 'text-amber-800' : 'text-primary-700'
                  }`}
                >
                  Scan with any UPI App
                </p>
              </div>
            </div>
          )}

          {/* UPI Apps View */}
          {!showQR && (
            <>
              {/* Apps Grid - Clean and Minimal */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {apps.map((app) => (
                  <a
                    key={app.name}
                    href={getAppLink(app.name)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all active:scale-95 ${app.bg} ${app.border} shadow-sm group`}
                  >
                    <div className="mb-2 transform transition-transform group-hover:scale-110">
                      {app.image ? (
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                          <Image src={app.image} alt={app.name} fill className="object-contain" />
                        </div>
                      ) : (
                        app.icon
                      )}
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold text-center ${app.text}`}>
                      {app.name}
                    </span>
                  </a>
                ))}
              </div>
            </>
          )}

          {/* Alternative Toggle - Prominent Button */}
          <div className="border-t border-gray-100 pt-3 pb-2">
            <button
              type="button"
              onClick={() => setUseAlternative(!useAlternative)}
              className={`w-full p-3 rounded-xl transition-all active:scale-95 ${
                useAlternative
                  ? 'bg-amber-100 hover:bg-amber-200 border-2 border-amber-300'
                  : 'bg-orange-50 hover:bg-orange-100 border-2 border-orange-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-bold ${
                      useAlternative ? 'bg-amber-500 text-white' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {useAlternative ? '✓' : '⚠️'}
                  </div>
                  <div className="text-left min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        useAlternative ? 'text-amber-900' : 'text-orange-900'
                      }`}
                    >
                      {useAlternative ? 'Using Alternative UPI' : 'Payment Failing?'}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        useAlternative ? 'text-amber-700' : 'text-orange-700'
                      }`}
                    >
                      {useAlternative ? 'Tap to switch back' : 'Try alternative UPI ID'}
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform ${
                    useAlternative ? 'text-amber-600 rotate-180' : 'text-orange-600'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Fixed Bottom - Explicit Cancel Button */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-3 bg-white rounded-b-2xl">
          <button
            onClick={handleClose}
            className="w-full bg-gray-100 text-gray-600 font-bold py-2.5 sm:py-3 rounded-xl hover:bg-gray-200 active:scale-95 transition-all text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default PaymentModal;
