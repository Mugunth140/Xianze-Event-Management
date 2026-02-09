'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

interface SlideshowViewerProps {
  submissionId: number;
  teamName: string;
  onClose: () => void;
}

export default function SlideshowViewer({ submissionId, teamName, onClose }: SlideshowViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null); // 'pdf' | 'ppt'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch file
  useEffect(() => {
    const fetchFile = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(getApiUrl(`/paper-presentation/slideshow/${submissionId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load presentation');
        }

        const contentType = res.headers.get('content-type');
        const isPdf = contentType?.includes('application/pdf');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setFileUrl(url);
        setFileType(isPdf ? 'pdf' : 'ppt');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load presentation');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (fileUrl) {
        window.URL.revokeObjectURL(fileUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  // Handle keyboard events (Esc)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitAndClose();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const enterFullscreen = () => {
    const container = document.getElementById('slideshow-container');
    if (container?.requestFullscreen) {
      container.requestFullscreen().then(() => setIsFullscreen(true));
    }
  };

  const exitAndClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onClose();
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div
      id="slideshow-container"
      className="fixed inset-0 z-[100] bg-black flex flex-col text-white"
    >
      {/* Header (Top Bar) */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div>
            <h2 className="font-bold text-lg">{teamName}</h2>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Paper Presentation</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={enterFullscreen}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center bg-gray-950">
        {loading && (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400 animate-pulse">Loading presentation...</p>
          </div>
        )}

        {error && (
          <div className="text-center max-w-md p-8 bg-gray-900 rounded-2xl border border-gray-800">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Error Loading File</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button
              onClick={exitAndClose}
              className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Close Viewer
            </button>
          </div>
        )}

        {!loading && !error && fileUrl && (
          <>
            {fileType === 'pdf' ? (
              <iframe
                src={`${fileUrl}#view=FitH`}
                className="w-full h-full border-0 bg-white"
                title="Presentation Slides"
              />
            ) : (
              /* Fallback UI for PPT files */
              <div className="text-center max-w-lg p-10 bg-gray-900 rounded-3xl border border-gray-800 shadow-2xl">
                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3">PowerPoint Presentation</h3>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  Browser can&apos;t display PPT files directly. Download the file or open it in
                  PowerPoint to present.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={fileUrl}
                    download={`presentation-${teamName}.pptx`}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition group"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download File
                  </a>
                  <a
                    href={`ms-powerpoint:ofe|u|${window.location.origin}/api/paper-presentation/slides/${submissionId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition"
                    onClick={() => {
                      // Note: Deep linking to localhost might fail if Office can't reach it, but worth a try or just rely on download.
                      // Actually, let's just keep download mainly. Deep link is bonus.
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open in PowerPoint
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Hints (only for PDF) */}
      {!isFullscreen && fileType === 'pdf' && !loading && (
        <div className="px-4 py-2 bg-gray-900 border-t border-gray-800 text-center text-xs text-gray-500">
          Press <span className="font-bold text-gray-300">Esc</span> to exit • Use{' '}
          <span className="font-bold text-gray-300">F11</span> for full browser immersive mode
        </div>
      )}
    </div>
  );
}
