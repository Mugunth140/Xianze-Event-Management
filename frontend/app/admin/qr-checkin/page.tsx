'use client';

import { Html5Qrcode } from 'html5-qrcode';
import { useEffect, useRef, useState } from 'react';
import useAuth from '../hooks/useAuth';

interface CheckInResult {
  success: boolean;
  message: string;
  registration?: {
    id: number;
    name: string;
    event: string;
    college: string;
    isCheckedIn: boolean;
  };
}

export default function QRCheckInPage() {
  const { token } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (!containerRef.current) return;

    try {
      setError(null);
      setResult(null);

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleQRCodeSuccess,
        () => {} // Ignore scan failures
      );

      setIsScanning(true);
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
    }
    setIsScanning(false);
  };

  const handleQRCodeSuccess = async (decodedText: string) => {
    if (isProcessing) return;

    setIsProcessing(true);

    // Vibrate on scan (if supported)
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    // Stop scanner while processing
    await stopScanner();

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/qr-check-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qrHash: decodedText }),
      });

      const data: CheckInResult = await response.json();
      setResult(data);

      if (data.success && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]); // Success pattern
      }
    } catch (err) {
      console.error('Check-in failed:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setError(null);
    startScanner();
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">QR Check-in</h1>
        <p className="text-sm text-gray-500 mt-1">Scan participant QR codes for check-in</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!isScanning && !result && (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Ready to Scan</h2>
            <p className="text-gray-500 text-sm mb-6">
              Point your camera at a participant&apos;s event pass QR code
            </p>
            <button
              onClick={startScanner}
              className="bg-primary-600 text-white px-8 py-3 rounded-xl font-semibold text-base shadow-lg shadow-primary-600/20 active:scale-95 transition-transform"
            >
              Start Scanner
            </button>
          </div>
        )}

        {isScanning && (
          <div className="w-full max-w-sm">
            <div
              id="qr-reader"
              ref={containerRef}
              className="w-full rounded-2xl overflow-hidden bg-black"
            />
            <button
              onClick={stopScanner}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              Cancel
            </button>
          </div>
        )}

        {isProcessing && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            <p className="text-gray-600">Processing check-in...</p>
          </div>
        )}

        {result && (
          <div className="w-full max-w-sm">
            <div
              className={`rounded-2xl p-6 text-center ${
                result.success
                  ? 'bg-green-50 border-2 border-green-200'
                  : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  result.success ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {result.success ? (
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>

              <h3
                className={`text-xl font-bold mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {result.success ? 'Check-in Successful!' : 'Check-in Failed'}
              </h3>

              <p className={`text-sm mb-4 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                {result.message}
              </p>

              {result.registration && (
                <div className="bg-white rounded-xl p-4 text-left mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Name</span>
                      <span className="text-gray-900 text-sm font-medium">
                        {result.registration.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Event</span>
                      <span className="text-primary-600 text-sm font-medium">
                        {result.registration.event}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">College</span>
                      <span className="text-gray-900 text-sm font-medium">
                        {result.registration.college}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={resetScanner}
              className="w-full mt-4 bg-primary-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              Scan Next
            </button>
          </div>
        )}

        {error && (
          <div className="w-full max-w-sm">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-red-800 font-medium mb-4">{error}</p>
              <button
                onClick={resetScanner}
                className="bg-red-600 text-white px-6 py-2 rounded-xl font-semibold active:scale-95 transition-transform"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
