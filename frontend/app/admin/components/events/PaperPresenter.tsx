'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PaperPresenterProps {
  submissionId: number;
  teamName: string;
  onClose: () => void;
}

/**
 * Fullscreen PDF Presenter for Paper Presentation
 * - Loads PDF and renders slides on canvas
 * - Next/Previous navigation
 * - Keyboard shortcuts: ← → Space Esc
 * - Fullscreen support
 */
export default function PaperPresenter({ submissionId, teamName, onClose }: PaperPresenterProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
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
        const response = await fetch(getApiUrl(`/paper-presentation/slideshow/${submissionId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

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
  }, [submissionId]);

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
        const viewport = page.getViewport({ scale: 1 });

        // Calculate container dimensions
        const containerWidth = window.innerWidth * 0.9;
        const containerHeight = window.innerHeight * 0.8;

        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions to match the scaled viewport
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        } as any).promise;
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
        goToNext();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPage, totalPages]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const enterFullscreen = () => {
    const container = document.getElementById('paper-presenter');
    if (container && container.requestFullscreen) {
      container.requestFullscreen();
    }
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
    <div id="paper-presenter" className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold text-xl">{teamName}</h2>
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
        {/* PDF Slide Canvas */}
        <canvas ref={canvasRef} className="max-h-[80vh] rounded-xl shadow-2xl" />

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

        {/* Page indicator */}
        <div className="text-white font-semibold">
          Page {currentPage} of {totalPages}
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
            Next Slide
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
