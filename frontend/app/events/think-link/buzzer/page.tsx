'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type BuzzerState =
  | 'connecting'
  | 'no-session'
  | 'register'
  | 'waiting'
  | 'ready'
  | 'pressed'
  | 'locked'
  | 'disconnected';

interface BuzzerStatus {
  isActive: boolean;
  isBuzzerEnabled: boolean;
  canPress: boolean;
}

interface SessionCheckResponse {
  success: boolean;
  isActive: boolean;
  isBuzzerEnabled: boolean;
}

export default function BuzzerPage() {
  const [state, setState] = useState<BuzzerState>('connecting');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [_isPressed, setIsPressed] = useState(false);
  const [wasFirst, setWasFirst] = useState(false);
  const [winnerNames, setWinnerNames] = useState('');
  const [_isRegistered, setIsRegistered] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isRegisteredRef = useRef(false);
  const isPressedRef = useRef(false);
  const winnerNamesRef = useRef('');

  const getApiUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    // Remove /api suffix if present for WebSocket connection
    return apiUrl.replace(/\/api$/, '');
  };

  useEffect(() => {
    const socket = io(`${getApiUrl()}/buzzer`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setError('');
      // Check if session is active
      socket.emit('participant:check-session', (response: SessionCheckResponse) => {
        if (response.success && response.isActive) {
          // If already registered (reconnect), go to waiting
          if (isRegisteredRef.current) {
            setState('waiting');
          } else {
            setState('register');
          }
        } else {
          setState('no-session');
        }
      });
    });

    socket.on('disconnect', () => {
      setState('disconnected');
    });

    socket.on('connect_error', () => {
      setError('Unable to connect to server. Please try again.');
      setState('disconnected');
    });

    // Buzzer state updates
    socket.on('buzzer:state', (status: BuzzerStatus) => {
      if (!status.isActive) {
        setState('no-session');
        isRegisteredRef.current = false;
        setIsRegistered(false);
        setMessage('Session ended. Thank you for participating!');
      } else if (isRegisteredRef.current) {
        if (status.isBuzzerEnabled && status.canPress) {
          setState('ready');
          isPressedRef.current = false;
          setIsPressed(false);
          setMessage('');
        } else if (!status.canPress && !isPressedRef.current) {
          setState('waiting');
          setMessage('Stand by for the next question...');
        }
      }
    });

    // Buzzer enabled
    socket.on('buzzer:enabled', () => {
      if (isRegisteredRef.current) {
        setState('ready');
        isPressedRef.current = false;
        setIsPressed(false);
        setWasFirst(false);
        winnerNamesRef.current = '';
        setWinnerNames('');
        setMessage('');
      }
    });

    // Buzzer disabled (paused)
    socket.on('buzzer:disabled', () => {
      if (isRegisteredRef.current && !isPressedRef.current) {
        setState('waiting');
        setMessage('Stand by...');
      }
    });

    // Session started - allow registration
    socket.on('session:started', () => {
      if (!isRegisteredRef.current) {
        setState('register');
        setMessage('');
      }
    });

    // Session ended
    socket.on('session:ended', () => {
      setState('no-session');
      isRegisteredRef.current = false;
      setIsRegistered(false);
      setMessage('Session ended. Thank you for participating!');
    });

    // Buzzer locked (someone won)
    socket.on('buzzer:locked', (data: { winnerNames: string }) => {
      winnerNamesRef.current = data.winnerNames;
      setWinnerNames(data.winnerNames);
      if (!isPressedRef.current) {
        setState('locked');
        setMessage(`${data.winnerNames} pressed first!`);
      }
    });

    // Correct answer
    socket.on('answer:correct', () => {
      if (isRegisteredRef.current) {
        setMessage('Correct answer! Waiting for next question...');
        setState('waiting');
        isPressedRef.current = false;
        setIsPressed(false);
        setWasFirst(false);
      }
    });

    // Wrong answer
    socket.on('answer:wrong', (data: { wrongTeam: string }) => {
      if (isRegisteredRef.current) {
        if (data.wrongTeam && winnerNamesRef.current === data.wrongTeam) {
          // The team that buzzed gave wrong answer
          setMessage('Wrong answer! Buzzer continuing...');
        }
        isPressedRef.current = false;
        setIsPressed(false);
        setWasFirst(false);
      }
    });

    // Reset
    socket.on('buzzer:reset', () => {
      if (isRegisteredRef.current) {
        setState('waiting');
        isPressedRef.current = false;
        setIsPressed(false);
        setWasFirst(false);
        winnerNamesRef.current = '';
        setWinnerNames('');
        setMessage('Waiting for next question...');
      }
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = useCallback(() => {
    if (!name1.trim() || !name2.trim()) {
      setError('Please enter both team member names');
      return;
    }

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit(
      'team:join',
      { name1: name1.trim(), name2: name2.trim() },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          isRegisteredRef.current = true;
          setIsRegistered(true);
          setState('waiting');
          setMessage('Joined! Waiting for buzzer to be enabled...');
          setError('');
        } else {
          setError(response.error || 'Failed to join');
        }
      }
    );
  }, [name1, name2]);

  const handleBuzzerPress = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || state !== 'ready') return;

    isPressedRef.current = true;
    setIsPressed(true);
    setState('pressed');

    socket.emit(
      'buzzer:press',
      (response: { success: boolean; first?: boolean; error?: string }) => {
        if (response.success) {
          if (response.first) {
            setWasFirst(true);
            setMessage('🎉 You pressed first! Answer the question!');
          } else {
            setMessage('Someone was faster...');
            setState('locked');
          }
        } else {
          setError(response.error || 'Failed to register buzz');
          isPressedRef.current = false;
          setIsPressed(false);
          setState('ready');
        }
      }
    );
  }, [state]);

  // Handle reconnection
  const handleReconnect = useCallback(() => {
    setState('connecting');
    socketRef.current?.connect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-4 text-center">
        <h1 className="text-2xl font-bold text-white">Think & Link</h1>
        <p className="text-purple-200 text-sm">Buzzer Round</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {/* Connecting State */}
        {state === 'connecting' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white text-lg">Connecting to server...</p>
          </div>
        )}

        {/* Disconnected State */}
        {state === 'disconnected' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-10 h-10 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <p className="text-white text-lg">Disconnected from server</p>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={handleReconnect}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-colors"
            >
              Reconnect
            </button>
          </div>
        )}

        {/* No Active Session State */}
        {state === 'no-session' && (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">No Active Session</h2>
              <p className="text-purple-200">
                {message || 'Please wait for the coordinator to start the buzzer session.'}
              </p>
            </div>
            <p className="text-purple-400 text-sm">
              This page will update automatically when a session starts.
            </p>
          </div>
        )}

        {/* Registration Form */}
        {state === 'register' && (
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Enter Team Names</h2>
              <p className="text-purple-200 text-sm mt-1">
                Both team members&apos; names are required
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm mb-2">Team Member 1</label>
                <input
                  type="text"
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-purple-200 text-sm mb-2">Team Member 2</label>
                <input
                  type="text"
                  value={name2}
                  onChange={(e) => setName2(e.target.value)}
                  placeholder="Enter second name"
                  className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={50}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={!name1.trim() || !name2.trim()}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-lg transition-colors"
            >
              Join Buzzer
            </button>
          </div>
        )}

        {/* Waiting State */}
        {state === 'waiting' && (
          <div className="text-center space-y-6">
            <div className="w-32 h-32 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <svg
                className="w-16 h-16 text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Stand By</h2>
              <p className="text-purple-200">{message || 'Waiting for coordinator...'}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-purple-300">
              <span className="text-sm">Team:</span>
              <span className="font-semibold">
                {name1} & {name2}
              </span>
            </div>
          </div>
        )}

        {/* Ready State - Buzzer Button */}
        {state === 'ready' && (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-purple-300 mb-4">
              <span className="text-sm">Team:</span>
              <span className="font-semibold">
                {name1} & {name2}
              </span>
            </div>

            <button
              onClick={handleBuzzerPress}
              className="w-64 h-64 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 shadow-2xl shadow-red-500/50 transform hover:scale-105 active:scale-95 transition-all duration-150 flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-red-400"
            >
              <span className="text-4xl font-bold text-white drop-shadow-lg">BUZZ!</span>
            </button>

            <p className="text-green-400 font-semibold animate-pulse">Press when ready!</p>
          </div>
        )}

        {/* Pressed State */}
        {state === 'pressed' && (
          <div className="text-center space-y-6">
            <div
              className={`w-64 h-64 rounded-full ${wasFirst ? 'bg-gradient-to-br from-green-500 to-green-700 shadow-green-500/50' : 'bg-gradient-to-br from-gray-500 to-gray-700 shadow-gray-500/50'} shadow-2xl flex items-center justify-center mx-auto`}
            >
              {wasFirst ? (
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
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <div>
              <h2
                className={`text-2xl font-bold ${wasFirst ? 'text-green-400' : 'text-gray-300'} mb-2`}
              >
                {wasFirst ? '🎉 First!' : 'Pressed!'}
              </h2>
              <p className="text-purple-200">{message}</p>
            </div>
          </div>
        )}

        {/* Locked State - Someone else pressed */}
        {state === 'locked' && (
          <div className="text-center space-y-6">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 shadow-xl flex items-center justify-center mx-auto">
              <svg
                className="w-24 h-24 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-300 mb-2">Buzzer Locked</h2>
              <p className="text-purple-200">{message || `${winnerNames} pressed first!`}</p>
            </div>
            <p className="text-purple-400 text-sm">Wait for the next question...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-purple-300/50 text-xs">
        XIANZE 2026 • Think & Link
      </footer>
    </div>
  );
}
