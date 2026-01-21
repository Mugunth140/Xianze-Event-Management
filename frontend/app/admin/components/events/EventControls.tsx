'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '../ui/Button';

interface EventControlsProps {
  status: 'waiting' | 'active' | 'paused' | 'completed';
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onNextRound?: () => void;
  onPublish?: () => void;
  timer?: {
    enabled: boolean;
    seconds: number;
    onTick?: (seconds: number) => void;
    onComplete?: () => void;
  };
  disabled?: boolean;
}

export default function EventControls({
  status,
  onStart,
  onPause,
  onResume,
  onStop,
  onNextRound,
  onPublish,
  timer,
  disabled = false,
}: EventControlsProps) {
  const [timeLeft, setTimeLeft] = useState(timer?.seconds || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Timer logic
  useEffect(() => {
    if (!timer?.enabled || !isTimerRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        timer.onTick?.(newTime);
        if (newTime <= 0) {
          setIsTimerRunning(false);
          timer.onComplete?.();
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, isTimerRunning, timeLeft]);

  // Reset timer when seconds prop changes
  useEffect(() => {
    if (timer?.seconds) {
      setTimeLeft(timer.seconds);
    }
  }, [timer?.seconds]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerClass = () => {
    if (timeLeft <= 10) return 'admin-timer danger';
    if (timeLeft <= 30) return 'admin-timer warning';
    return 'admin-timer';
  };

  const handleStart = () => {
    onStart?.();
    if (timer?.enabled) {
      setIsTimerRunning(true);
    }
  };

  const handlePause = () => {
    onPause?.();
    setIsTimerRunning(false);
  };

  const handleResume = () => {
    onResume?.();
    setIsTimerRunning(true);
  };

  const handleStop = () => {
    onStop?.();
    setIsTimerRunning(false);
    setTimeLeft(timer?.seconds || 0);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      {/* Timer display */}
      {timer?.enabled && (
        <div className="flex items-center gap-4">
          <span className={getTimerClass()}>{formatTime(timeLeft)}</span>
          {status === 'active' && (
            <span className="admin-live-pulse text-sm text-green-400">LIVE</span>
          )}
        </div>
      )}

      {/* Control buttons */}
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-end">
        {status === 'waiting' && (
          <Button size="lg" onClick={handleStart} disabled={disabled}>
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
            Start
          </Button>
        )}

        {status === 'active' && (
          <>
            <Button size="lg" variant="secondary" onClick={handlePause} disabled={disabled}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Pause
            </Button>
            <Button size="lg" variant="danger" onClick={handleStop} disabled={disabled}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                />
              </svg>
              Stop
            </Button>
          </>
        )}

        {status === 'paused' && (
          <>
            <Button size="lg" onClick={handleResume} disabled={disabled}>
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
              Resume
            </Button>
            <Button size="lg" variant="danger" onClick={handleStop} disabled={disabled}>
              Stop
            </Button>
          </>
        )}

        {status === 'completed' && (
          <>
            {onNextRound && (
              <Button size="lg" variant="secondary" onClick={onNextRound} disabled={disabled}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
                Next Round
              </Button>
            )}
            {onPublish && (
              <Button size="lg" onClick={onPublish} disabled={disabled}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Publish Results
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
