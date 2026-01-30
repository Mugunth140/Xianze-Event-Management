'use client';

import { Html5Qrcode } from 'html5-qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import useAuth from '../hooks/useAuth';

interface ScanResult {
  success: boolean;
  message: string;
  warning?: boolean;
  registration?: {
    id: number;
    name: string;
    email: string;
    college: string;
    event: string;
    passId: string;
  };
}

interface EventOption {
  slug: string;
  name: string;
}

const EVENTS: EventOption[] = [
  { slug: 'buildathon', name: 'Buildathon' },
  { slug: 'bug-smash', name: 'Bug Smash' },
  { slug: 'paper-presentation', name: 'Paper Presentation' },
  { slug: 'ctrl-quiz', name: 'Ctrl+ Quiz' },
  { slug: 'code-hunt', name: 'Code Hunt' },
  { slug: 'think-link', name: 'Think & Link' },
  { slug: 'gaming', name: 'Gaming' },
];

type ScanMode = 'event' | 'round';

export default function EventScanPage() {
  const { token, user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Event and round selection
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [scanMode, setScanMode] = useState<ScanMode>('event');
  const [roundNumber, setRoundNumber] = useState<number>(1);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Determine available events based on user role
  const availableEvents =
    user?.role === 'admin'
      ? EVENTS
      : EVENTS.filter(
          (e) => user?.assignedEvent === e.slug || user?.assignedEvents?.includes(e.slug)
        );

  // Auto-select event for coordinators
  useEffect(() => {
    if (user?.role === 'coordinator' && user.assignedEvent) {
      setSelectedEvent(user.assignedEvent);
    } else if (availableEvents.length === 1) {
      setSelectedEvent(availableEvents[0].slug);
    }
  }, [user, availableEvents]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {
        // Scanner may already be stopped
      }
    }
    setIsScanning(false);
  }, []);

  const handleQRCodeSuccess = useCallback(
    async (decodedText: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;
      setIsProcessing(true);

      // Vibrate on scan
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      await stopScanner();

      try {
        const endpoint = scanMode === 'event' ? '/attendance/event-scan' : '/attendance/round-scan';

        const body =
          scanMode === 'event'
            ? { qrHash: decodedText, eventSlug: selectedEvent }
            : { qrHash: decodedText, eventSlug: selectedEvent, roundNumber };

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const data: ScanResult = await response.json();
        setResult(data);

        // Different vibration patterns
        if (navigator.vibrate) {
          if (data.success && !data.warning) {
            navigator.vibrate([100, 50, 100]); // Success
          } else if (data.warning) {
            navigator.vibrate([200, 100, 200]); // Warning (duplicate)
          } else {
            navigator.vibrate([300]); // Error
          }
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    },
    [token, stopScanner, selectedEvent, scanMode, roundNumber]
  );

  const startScanner = useCallback(async () => {
    if (!selectedEvent) {
      setError('Please select an event first');
      return;
    }

    try {
      setError(null);
      setResult(null);
      setIsScanning(true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        handleQRCodeSuccess,
        () => {}
      );
    } catch {
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setIsScanning(false);
    }
  }, [handleQRCodeSuccess, selectedEvent]);

  const resetScanner = useCallback(() => {
    setResult(null);
    setError(null);
    startScanner();
  }, [startScanner]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const getEventName = (slug: string) => {
    return EVENTS.find((e) => e.slug === slug)?.name || slug;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Event Participation Scanner</h1>
        <p className="text-sm text-gray-500 mt-1">
          Scan QR codes to record event and round participation
        </p>
      </div>

      {/* Event & Mode Selection */}
      {!isScanning && !isProcessing && (
        <div className="bg-white border-b border-gray-200 px-4 py-4 space-y-4">
          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={user?.role === 'coordinator' && !!user?.assignedEvent}
            >
              <option value="">Choose an event...</option>
              {availableEvents.map((event) => (
                <option key={event.slug} value={event.slug}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          {/* Scan Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scan Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setScanMode('event')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  scanMode === 'event' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Event Entry
              </button>
              <button
                onClick={() => setScanMode('round')}
                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                  scanMode === 'round' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Round Scan
              </button>
            </div>
          </div>

          {/* Round Selection (only visible in round mode) */}
          {scanMode === 'round' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Round Number</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setRoundNumber(num)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-colors ${
                      roundNumber === num
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!isScanning && !result && !error && !isProcessing && (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {scanMode === 'event' ? 'Event Entry Scanner' : `Round ${roundNumber} Scanner`}
            </h2>
            <p className="text-gray-500 text-sm mb-2">
              {selectedEvent
                ? `Recording for: ${getEventName(selectedEvent)}`
                : 'Select an event above to begin'}
            </p>
            <p className="text-gray-400 text-xs mb-6">
              {scanMode === 'event'
                ? 'Scan at event hall entrance'
                : `Scan to mark Round ${roundNumber} participation`}
            </p>
            <button
              onClick={startScanner}
              disabled={!selectedEvent}
              className={`px-8 py-3 rounded-xl font-semibold text-base shadow-lg active:scale-95 transition-transform ${
                selectedEvent
                  ? 'bg-blue-600 text-white shadow-blue-600/20'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Start Scanner
            </button>
          </div>
        )}

        {isScanning && (
          <div className="w-full max-w-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-center">
              <span className="text-blue-800 font-medium">
                {getEventName(selectedEvent)} -{' '}
                {scanMode === 'event' ? 'Entry' : `Round ${roundNumber}`}
              </span>
            </div>
            <div
              id="qr-reader"
              className="w-full rounded-2xl overflow-hidden bg-black min-h-[300px]"
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
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-gray-600">Recording participation...</p>
          </div>
        )}

        {result && (
          <div className="w-full max-w-sm">
            <div
              className={`rounded-2xl p-6 text-center ${
                result.success && !result.warning
                  ? 'bg-green-50 border-2 border-green-200'
                  : result.warning
                    ? 'bg-amber-50 border-2 border-amber-200'
                    : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  result.success && !result.warning
                    ? 'bg-green-100'
                    : result.warning
                      ? 'bg-amber-100'
                      : 'bg-red-100'
                }`}
              >
                {result.success && !result.warning ? (
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
                ) : result.warning ? (
                  <svg
                    className="w-8 h-8 text-amber-600"
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
                  result.success && !result.warning
                    ? 'text-green-800'
                    : result.warning
                      ? 'text-amber-800'
                      : 'text-red-800'
                }`}
              >
                {result.success && !result.warning
                  ? 'Recorded!'
                  : result.warning
                    ? 'Already Scanned'
                    : 'Scan Failed'}
              </h3>

              <p
                className={`text-sm mb-4 ${
                  result.success && !result.warning
                    ? 'text-green-600'
                    : result.warning
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
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
                      <span className="text-gray-500 text-sm">Registered Event</span>
                      <span className="text-blue-600 text-sm font-medium">
                        {result.registration.event}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">College</span>
                      <span className="text-gray-900 text-sm font-medium">
                        {result.registration.college}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 text-sm">Pass ID</span>
                      <span className="text-gray-600 text-xs font-mono">
                        {result.registration.passId}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={resetScanner}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform"
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
