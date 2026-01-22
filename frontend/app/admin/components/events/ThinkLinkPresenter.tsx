'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

interface Puzzle {
  id: number;
  imagePath: string;
  roundNumber: number;
  hint: string | null;
  result: 'pending' | 'correct' | 'wrong';
}

interface ThinkLinkPresenterProps {
  puzzles: Puzzle[];
  timerDuration: number;
  onMarkResult: (id: number, result: 'correct' | 'wrong') => Promise<void>;
  onClose: () => void;
}

/**
 * Fullscreen Think & Link Presenter
 * - Arrow key navigation (← →)
 * - Countdown timer
 * - Mark correct/wrong buttons
 * - Visual overlays for results
 * - ESC to exit
 */
export default function ThinkLinkPresenter({
  puzzles,
  timerDuration,
  onMarkResult,
  onClose,
}: ThinkLinkPresenterProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showResult, setShowResult] = useState<'correct' | 'wrong' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentPuzzle = puzzles[currentIndex];

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
        onClose();
      } else if (e.key === 'ArrowRight' && currentIndex < puzzles.length - 1) {
        goToNext();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        goToPrevious();
      } else if (e.key === ' ') {
        // Space to start/pause timer
        e.preventDefault();
        setTimerRunning((prev) => !prev);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex, puzzles.length]
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
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning]);

  // Fullscreen tracking
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleTimeout = async () => {
    setShowResult('wrong');
    await onMarkResult(currentPuzzle.id, 'wrong');
  };

  const handleMarkCorrect = async () => {
    setTimerRunning(false);
    setShowResult('correct');
    await onMarkResult(currentPuzzle.id, 'correct');
  };

  const handleMarkWrong = async () => {
    setTimerRunning(false);
    setShowResult('wrong');
    await onMarkResult(currentPuzzle.id, 'wrong');
  };

  const goToNext = () => {
    if (currentIndex < puzzles.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetTimer();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      resetTimer();
    }
  };

  const resetTimer = () => {
    setTimeLeft(timerDuration);
    setTimerRunning(false);
    setShowResult(null);
  };

  const startTimer = () => {
    setShowResult(null);
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

  return (
    <div id="think-link-presenter" className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Header - Hidden in fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-bold text-xl">Think & Link</h2>
            <span className="text-gray-400">
              Puzzle {currentIndex + 1} of {puzzles.length}
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
        {/* Puzzle Image */}
        <div className="relative max-w-6xl max-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getApiUrl(`/think-link/puzzles/${currentPuzzle.id}/image`)}
            alt={`Puzzle ${currentPuzzle.roundNumber}`}
            className="max-h-[70vh] object-contain rounded-xl shadow-2xl"
          />

          {/* Result overlay */}
          {showResult && (
            <div
              className={`absolute inset-0 flex items-center justify-center rounded-xl ${
                showResult === 'correct' ? 'bg-emerald-500/80' : 'bg-red-500/80'
              } animate-pulse`}
            >
              {showResult === 'correct' ? (
                <svg
                  className="w-32 h-32 text-white"
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
                  className="w-32 h-32 text-white"
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
          )}
        </div>

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

        {/* Round number - top left */}
        <div className="absolute top-8 left-8">
          <div className="text-4xl font-bold text-white/70">#{currentPuzzle.roundNumber}</div>
        </div>

        {/* Hint - coordinator only, top right */}
        {currentPuzzle.hint && (
          <div className="absolute top-8 right-8 max-w-xs">
            <div className="px-4 py-2 bg-black/60 rounded-lg text-white/80 text-sm">
              <span className="text-xs text-gray-400 block mb-1">Hint:</span>
              {currentPuzzle.hint}
            </div>
          </div>
        )}
      </div>

      {/* Controls - bottom */}
      <div className="px-8 py-6 bg-gray-800 flex items-center justify-between">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
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
            disabled={currentIndex === puzzles.length - 1}
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
        </div>

        {/* Result buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleMarkCorrect}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Correct
          </button>
          <button
            onClick={handleMarkWrong}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Wrong
          </button>
        </div>
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
