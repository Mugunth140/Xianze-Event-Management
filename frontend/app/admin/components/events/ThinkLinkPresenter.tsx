'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface ThinkLinkPresenterProps {
  presentationId: number;
  presentationName: string;
  timerDuration: number;
  onClose: () => void;
}

/**
 * Fullscreen PDF Presenter for Think & Link
 * - Loads PDF and renders slides on canvas
 * - 60-second countdown timer per slide
 * - Blank screen with "Time's Up!" after timer expires
 * - Next/Previous navigation
 * - Keyboard shortcuts: ← → Space Esc
 */
export default function ThinkLinkPresenter({
  presentationId,
  presentationName,
  timerDuration,
  onClose,
}: ThinkLinkPresenterProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          getApiUrl(`/think-link/presentations/${presentationId}/file`),
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) throw new Error('Failed to load PDF');

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
        setLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
      }
    };
  }, [presentationId]);

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocRef.current || !canvasRef.current || loading) return;

      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Scale to fit container while maintaining aspect ratio
        const containerWidth = window.innerWidth * 0.9;
        const containerHeight = window.innerHeight * 0.7;
        const viewport = page.getViewport({ scale: 1 });

        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [currentPage, loading]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        onClose();
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        goToNext();
      } else if (e.key === 'ArrowLeft' && currentPage > 1) {
        goToPrevious();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isTimedOut) {
          // If timed out, space advances to next
          goToNext();
        } else {
          setTimerRunning((prev) => !prev);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPage, totalPages, isTimedOut]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Timer countdown
  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          setIsTimedOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning]);

  // Fullscreen tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      resetTimer();
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      resetTimer();
    }
  };

  const resetTimer = () => {
    setTimeLeft(timerDuration);
    setTimerRunning(false);
    setIsTimedOut(false);
  };

  const startTimer = () => {
    setIsTimedOut(false);
    setTimeLeft(timerDuration);
    setTimerRunning(true);
  };

  const enterFullscreen = () => {
    const container = document.getElementById('think-link-presenter');
    if (container && container.requestFullscreen) {
      container.requestFullscreen();
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading presentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 text-xl">{error}</div>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div id="think-link-presenter" className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold text-xl">{presentationName}</h2>
            <span className="text-gray-400">
              Slide {currentPage} of {totalPages}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={enterFullscreen}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Fullscreen
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative flex items-center justify-center p-8">
        {/* Timed Out Overlay - Blank Screen */}
        {isTimedOut ? (
          <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-10">
            <div className="text-6xl font-bold text-red-500 mb-8 animate-pulse">
              Time&apos;s Up!
            </div>
            <button
              onClick={goToNext}
              disabled={currentPage >= totalPages}
              className="px-8 py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl rounded-lg font-semibold transition-colors flex items-center gap-3"
            >
              Next Slide
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            {currentPage >= totalPages && (
              <p className="text-gray-400 mt-4">This was the last slide</p>
            )}
          </div>
        ) : (
          /* PDF Slide Canvas */
          <canvas ref={canvasRef} className="max-h-[70vh] rounded-xl shadow-2xl" />
        )}

        {/* Timer display - bottom right */}
        <div className="absolute bottom-8 right-8">
          <div
            className={`text-6xl font-bold font-mono ${
              timeLeft <= 10
                ? 'text-red-500 animate-pulse'
                : timeLeft <= 30
                  ? 'text-amber-400'
                  : 'text-white'
            }`}
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Slide number - top left */}
        <div className="absolute top-8 left-8">
          <div className="text-4xl font-bold text-white/70">
            {currentPage} / {totalPages}
          </div>
        </div>
      </div>

      {/* Controls - bottom */}
      <div className="px-8 py-6 bg-gray-800 flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevious}
            disabled={currentPage === 1}
            className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={goToNext}
            disabled={currentPage === totalPages}
            className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Timer controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={startTimer}
            disabled={timerRunning}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Start Timer
          </button>
          <button
            onClick={resetTimer}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Next button */}
        <button
          onClick={goToNext}
          disabled={currentPage >= totalPages}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          Next Slide
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints - bottom */}
      {!isFullscreen && (
        <div className="px-8 py-2 bg-gray-900 text-gray-500 text-xs flex justify-center gap-8">
          <span>
            <kbd className="px-2 py-1 bg-gray-700 rounded mr-1">←</kbd>
            <kbd className="px-2 py-1 bg-gray-700 rounded mr-2">→</kbd>
            Navigate
          </span>
          <span>
            <kbd className="px-2 py-1 bg-gray-700 rounded mr-2">Space</kbd>
            Start/Pause Timer
          </span>
          <span>
            <kbd className="px-2 py-1 bg-gray-700 rounded mr-2">Esc</kbd>
            Exit
          </span>
        </div>
      )}
    </div>
  );
}
