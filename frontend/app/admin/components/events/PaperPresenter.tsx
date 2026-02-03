'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
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

        // Calculate container dimensions - Use full window size
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;

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

    // Add resize listener
    const handleResize = () => {
      renderPage();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage, loading, isFullscreen]);

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
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading presentation...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center gap-4">
        <div className="text-red-500 text-xl">{error}</div>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      id="paper-presenter"
      className="fixed inset-0 z-[100] bg-black flex flex-col cursor-none hover:cursor-default"
    >
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="absolute top-0 left-0 w-full z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/50 to-transparent hover:opacity-100 opacity-0 transition-opacity duration-300">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold text-xl drop-shadow-md">{teamName}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={enterFullscreen}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-lg text-sm font-medium transition-colors border border-white/20"
            >
              Fullscreen
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-md text-white rounded-lg text-sm font-medium transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* PDF Slide Canvas */}
        <canvas ref={canvasRef} className="shadow-2xl" />
      </div>
    </div>
  );
}
