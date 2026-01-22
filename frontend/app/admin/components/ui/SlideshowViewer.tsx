'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

interface SlideshowViewerProps {
  submissionId: number;
  teamName: string;
  onClose: () => void;
}

/**
 * Fullscreen PDF Slideshow Viewer
 * - Opens PDF in fullscreen mode
 * - Uses browser's native PDF viewer
 * - Supports keyboard navigation (arrows for PDF, Esc to exit)
 */
export default function SlideshowViewer({ submissionId, teamName, onClose }: SlideshowViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch PDF blob and create object URL
  useEffect(() => {
    const fetchPdf = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(getApiUrl(`/paper-presentation/slideshow/${submissionId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load presentation');
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load presentation');
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    // Cleanup blob URL on unmount
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Enter fullscreen
  const enterFullscreen = () => {
    const container = document.getElementById('slideshow-container');
    if (container && container.requestFullscreen) {
      container.requestFullscreen();
    }
  };

  // Exit and close
  const exitAndClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onClose();
  };

  return (
    <div id="slideshow-container" className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-lg">{teamName}</h2>
            <span className="text-sm text-gray-400">Paper Presentation</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={enterFullscreen}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              Fullscreen
            </button>
            <button
              onClick={exitAndClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-lg">Loading presentation...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-xl font-semibold mb-2">Unable to load presentation</p>
            <p className="text-gray-400 mb-6 max-w-md text-center">{error}</p>
            <button
              onClick={exitAndClose}
              className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {pdfUrl && !loading && !error && (
          <iframe src={pdfUrl} className="w-full h-full border-0" title="Presentation Slideshow" />
        )}
      </div>

      {/* Footer hints - Hidden in fullscreen */}
      {!isFullscreen && pdfUrl && !loading && !error && (
        <div className="px-4 py-2 bg-gray-900 text-gray-400 text-sm flex justify-center gap-6">
          <span>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-1">←</kbd>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">→</kbd>
            Navigate slides
          </span>
          <span>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">F11</kbd>
            Browser fullscreen
          </span>
          <span>
            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-2">Esc</kbd>
            Exit
          </span>
        </div>
      )}
    </div>
  );
}
