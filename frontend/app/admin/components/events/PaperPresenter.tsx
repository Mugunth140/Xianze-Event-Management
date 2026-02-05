'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PaperPresenterProps {
  submissionId: number;
  teamName: string;
  onClose: () => void;
}

/**
 * Fullscreen PDF Presenter for Paper Presentation
 * - Loads PDF and renders slides on canvas
 * - Next/Previous navigation with visible controls
 * - Keyboard shortcuts: ← → Space Esc F
 * - Fullscreen support with auto-hiding controls
 */
export default function PaperPresenter({ submissionId, teamName, onClose }: PaperPresenterProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showControls, setShowControls] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const pdfjsRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls in fullscreen after 3s of no mouse movement
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isFullscreen) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) {
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      resetHideTimer();
    }
  }, [isFullscreen, resetHideTimer]);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        if (!pdfjsRef.current) {
          const pdfjs = await import(
            /* webpackIgnore: true */
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs'
          );
          pdfjs.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
          pdfjsRef.current = pdfjs;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(getApiUrl(`/paper-presentation/slideshow/${submissionId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to load PDF');

        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsRef.current.getDocument({ data: arrayBuffer }).promise;
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
        pdfDocRef.current = null;
      }
    };
  }, [submissionId]);

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocRef.current || !canvasRef.current || loading) return;

      // Cancel any previous render
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          /* ignore */
        }
      }

      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const viewport = page.getViewport({ scale: 1 });

        // Use the stage container size for proper scaling
        const stage = stageRef.current;
        const containerWidth = stage ? stage.clientWidth : window.innerWidth;
        const containerHeight = stage ? stage.clientHeight : window.innerHeight;

        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const task = page.render({
          canvasContext: context,
          viewport: scaledViewport,
        });
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering page:', err);
        }
      }
    };

    renderPage();

    const handleResize = () => renderPage();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage, loading, isFullscreen]);

  const goToNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const goToPrevious = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = document.getElementById('paper-presenter');
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            onClose();
          }
          break;
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goToNext();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
      }
    },
    [onClose, goToNext, goToPrevious, toggleFullscreen]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Fullscreen tracking
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin" />
          <p className="text-white text-lg">Loading presentation…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col items-center justify-center gap-4">
        <svg
          className="w-16 h-16 text-red-500"
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
        <p className="text-red-400 text-xl font-semibold">{error}</p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      id="paper-presenter"
      className="fixed inset-0 z-[100] bg-gray-900 flex flex-col"
      onMouseMove={resetHideTimer}
    >
      {/* ── Header bar ── */}
      <div
        className={`flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 transition-opacity duration-300 ${
          isFullscreen ? (showControls ? 'opacity-100' : 'opacity-0 pointer-events-none') : ''
        } ${isFullscreen ? 'absolute top-0 left-0 right-0 z-20' : ''}`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <h2 className="text-white font-bold text-lg truncate">{teamName}</h2>
          <span className="text-gray-400 text-sm whitespace-nowrap">
            Slide {currentPage} of {totalPages}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                />
              )}
            </svg>
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* ── Slide canvas ── */}
      <div className="flex-1 relative bg-gray-900">
        <div
          ref={stageRef}
          className={`absolute inset-0 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-6'}`}
        >
          <canvas ref={canvasRef} className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>

        {/* Fullscreen page indicator */}
        {isFullscreen && showControls && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-10">
            <div className="px-5 py-2 rounded-full bg-black/50 backdrop-blur text-white text-sm font-medium">
              {currentPage} / {totalPages}
            </div>
          </div>
        )}

        {/* Invisible click zones for navigation (always active) */}
        <button
          onClick={goToPrevious}
          disabled={currentPage === 1}
          className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-w-resize opacity-0 disabled:cursor-default"
          aria-label="Previous slide"
        />
        <button
          onClick={goToNext}
          disabled={currentPage === totalPages}
          className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-e-resize opacity-0 disabled:cursor-default"
          aria-label="Next slide"
        />
      </div>

      {/* ── Bottom control bar ── */}
      {!isFullscreen && (
        <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex items-center justify-between">
          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevious}
              disabled={currentPage === 1}
              className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <span className="text-white font-medium text-sm min-w-[80px] text-center">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={goToNext}
              disabled={currentPage === totalPages}
              className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Next slide button */}
          <button
            onClick={goToNext}
            disabled={currentPage >= totalPages}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center gap-2 text-sm"
          >
            Next Slide
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Keyboard hints ── */}
      {!isFullscreen && (
        <div className="px-6 py-2 bg-gray-900 text-gray-500 text-xs flex justify-center gap-6">
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 mr-1">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 mr-1.5">→</kbd>
            Navigate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 mr-1.5">Space</kbd>
            Next
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 mr-1.5">F</kbd>
            Fullscreen
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded text-gray-300 mr-1.5">Esc</kbd>
            Exit
          </span>
        </div>
      )}
    </div>
  );
}
