'use client';

import { getApiUrl } from '@/lib/api';
import { getWSUrl } from '@/lib/buzzer-ws';
import { useCallback, useEffect, useRef, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFDocumentProxy = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PDFLib = any;

interface WSMessage {
  type: string;
  requestId?: string;
  data?: Record<string, unknown>;
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
  const [buzzerWinner, setBuzzerWinner] = useState('');
  const [wsReady, setWsReady] = useState(false);
  const hasAutoStartedRef = useRef(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const pdfjsRef = useRef<PDFLib | null>(null);
  const buzzerSocketRef = useRef<WebSocket | null>(null);
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(0);
  const timeLeftRef = useRef(timerDuration);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Load PDF document
  useEffect(() => {
    const loadPdf = async () => {
      try {
        // Dynamic import to avoid webpack bundling issues with pdfjs-dist
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
        const response = await fetch(
          getApiUrl(`/think-link/presentations/${presentationId}/file`),
          { headers: { Authorization: `Bearer ${token}` } }
        );

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
      }
    };
  }, [presentationId]);

  useEffect(() => {
    // Prevent double connection in React Strict Mode
    if (buzzerSocketRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = getWSUrl();
    const ws = new WebSocket(wsUrl);
    buzzerSocketRef.current = ws;

    // Helper to send message with response using this specific WebSocket instance
    const sendWSMessage = (
      type: string,
      data?: Record<string, unknown>
    ): Promise<Record<string, unknown>> => {
      return new Promise((resolve, reject) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket not connected'));
          return;
        }

        const requestId = crypto.randomUUID();
        const message: WSMessage = { type, requestId, data };

        const handleResponse = (event: MessageEvent) => {
          try {
            const response = JSON.parse(event.data);
            if (response.requestId === requestId) {
              ws.removeEventListener('message', handleResponse);
              resolve(response.data || {});
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.addEventListener('message', handleResponse);
        ws.send(JSON.stringify(message));

        // Timeout after 10 seconds
        setTimeout(() => {
          ws.removeEventListener('message', handleResponse);
          reject(new Error('Request timeout'));
        }, 10000);
      });
    };

    ws.onopen = () => {
      // Join as coordinator and start session
      sendWSMessage('coordinator:join')
        .then(() => sendWSMessage('coordinator:select-event', { eventSlug: 'think-link' }))
        .then(() => sendWSMessage('coordinator:start-session'))
        .then(() => {
          setWsReady(true);
        })
        .catch((err) => {
          console.error('[ThinkLinkPresenter] Setup failed:', err);
          setWsReady(true); // Set ready anyway to unblock UI
        });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data = {} } = message;

        switch (type) {
          case 'buzzer:locked':
            setBuzzerWinner((data as { winnerNames?: string }).winnerNames || '');
            setTimerRunning(false);
            break;

          case 'buzzer:reset':
          case 'buzzer:enabled':
            setBuzzerWinner('');
            break;

          case 'answer:correct':
            setBuzzerWinner('');
            advanceFromCorrect();
            break;

          case 'answer:wrong':
            setBuzzerWinner('');
            resumeTimer();
            enableBuzzerForSlide();
            break;

          case 'session:ended':
            setBuzzerWinner('');
            setTimerRunning(false);
            break;
        }
      } catch {
        // Parse error - ignore
      }
    };

    ws.onclose = () => {
      buzzerSocketRef.current = null;
      setWsReady(false);
    };

    ws.onerror = () => {
      setWsReady(false);
    };

    return () => {
      // Don't close on first cleanup (React Strict Mode), only on actual unmount
      if (ws.readyState === WebSocket.OPEN) {
        // Try to end session gracefully, but don't wait for response
        try {
          ws.send(JSON.stringify({ type: 'coordinator:end-session' }));
        } catch {
          // Ignore errors during cleanup
        }
        // Close immediately since we're in cleanup
        ws.close();
      }
      buzzerSocketRef.current = null;
    };
    // Empty dependency array - only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render current page
  useEffect(() => {
    const renderPage = async () => {
      if (!pdfDocRef.current || !canvasRef.current || loading) return;

      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Scale to fit stage container while maintaining aspect ratio
        const stage = stageRef.current;
        const containerWidth = stage?.clientWidth ?? window.innerWidth;
        const containerHeight = stage?.clientHeight ?? window.innerHeight;
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

  // Cleanup handler to end session properly
  const handleClose = useCallback(() => {
    const ws = buzzerSocketRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'coordinator:end-session' }));
      } catch {
        // Ignore errors during cleanup
      }
      // Close WebSocket after brief delay
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }, 100);
    }
    onClose();
  }, [onClose]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        handleClose();
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
    [currentPage, totalPages, isTimedOut, handleClose]
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
      resetAndStartTimer();
      enableBuzzerForSlide();
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      resetAndStartTimer();
      enableBuzzerForSlide();
    }
  };

  const resetTimer = () => {
    setTimeLeft(timerDuration);
    setTimerRunning(false);
    setIsTimedOut(false);
  };

  const resetAndStartTimer = useCallback(() => {
    setTimeLeft(timerDuration);
    setIsTimedOut(false);
    setTimerRunning(true);
  }, [timerDuration]);

  const resumeTimer = useCallback(() => {
    if (timeLeftRef.current > 0) {
      setTimerRunning(true);
    }
  }, []);

  const enableBuzzerForSlide = useCallback(() => {
    const ws = buzzerSocketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    ws.send(JSON.stringify({ type: 'coordinator:enable-buzzer' }));
  }, []);

  const startTimer = () => {
    setIsTimedOut(false);
    setTimeLeft(timerDuration);
    setTimerRunning(true);
  };

  const advanceFromCorrect = useCallback(() => {
    if (currentPageRef.current < totalPagesRef.current) {
      setCurrentPage((prev) => prev + 1);
      resetAndStartTimer();
      enableBuzzerForSlide();
    }
  }, [resetAndStartTimer, enableBuzzerForSlide]);

  useEffect(() => {
    if (!loading && wsReady && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      // Just start the timer, don't enable buzzer yet
      // Buzzer will be enabled when user presses arrow key to go to next slide
      resetAndStartTimer();
    }
  }, [loading, wsReady, resetAndStartTimer]);

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
          onClick={handleClose}
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
              onClick={handleClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 relative bg-gray-900">
        <div
          ref={stageRef}
          className={`absolute inset-0 flex items-center justify-center ${isFullscreen ? '' : 'p-8'}`}
        >
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
            <canvas ref={canvasRef} className="max-w-full max-h-full rounded-xl shadow-2xl" />
          )}

          {/* Timer display - top right */}
          <div className="absolute top-6 right-6 pointer-events-none">
            <div
              className={`px-4 py-2 rounded-xl bg-black/40 backdrop-blur text-5xl font-bold font-mono ${
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

          {/* Buzzer winner - bottom center */}
          {buzzerWinner && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none z-20">
              <div className="px-8 py-3 rounded-xl bg-emerald-500/95 backdrop-blur text-white text-2xl font-bold shadow-2xl animate-none border-4 border-white/30">
                {buzzerWinner}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls - bottom */}
      {!isFullscreen && (
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
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
      )}

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
