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

interface SessionInfo {
  sessionId: string;
  questionNumber: number;
  buzzerEnabled: boolean;
}

const EVENT_SLUG = 'code-hunt';

const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  // Remove /api suffix if present for WebSocket connection
  return apiUrl.replace(/\/api$/, '');
};

export default function CodeHuntBuzzerPage() {
  const [state, setState] = useState<BuzzerState>('connecting');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [message, setMessage] = useState<string>('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [wasFirst, setWasFirst] = useState(false);
  const [winnerNames, setWinnerNames] = useState<string>('');

  const socketRef = useRef<Socket | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const newSocket = io(`${getApiUrl()}/buzzer`, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Join the Code Hunt event room
      newSocket.emit('selectEvent', EVENT_SLUG);
    });

    // Event room joined
    newSocket.on('eventSelected', (data: { event: string; sessionActive: boolean }) => {
      if (data.sessionActive) {
        setState('register');
        setMessage('Session active! Register your team.');
      } else {
        setState('no-session');
        setMessage('No active session. Wait for coordinator to start.');
      }
    });

    newSocket.on('sessionStarted', (_info: SessionInfo) => {
      setState('register');
      setMessage('Session started! Register your team.');
    });

    newSocket.on('sessionEnded', () => {
      setState('no-session');
      setMessage('Session ended.');
    });

    newSocket.on('buzzerReady', (data: { questionNumber: number }) => {
      setWasFirst(false);
      setWinnerNames('');
      setState('ready');
      setMessage(`Question ${data.questionNumber} - Press when ready!`);
    });

    newSocket.on('buzzResult', (data: { isFirst: boolean; position?: number }) => {
      setState('pressed');
      setWasFirst(data.isFirst);
      if (data.isFirst) {
        setMessage("🎉 You're first! Wait for the question.");
      } else {
        setMessage(`Position: ${data.position || '?'}`);
      }
    });

    newSocket.on('buzzerWinner', (data: { names: string; socketId: string }) => {
      // Only lock if we didn't win
      if (newSocket.id !== data.socketId) {
        setState('locked');
        setWinnerNames(data.names);
        setMessage(`${data.names} pressed first!`);
      }
    });

    newSocket.on('buzzerReset', () => {
      setState('waiting');
      setWasFirst(false);
      setWinnerNames('');
      setMessage('Waiting for next question...');
    });

    newSocket.on('error', (error: { message: string }) => {
      setMessage(error.message);
    });

    newSocket.on('disconnect', () => {
      setState('disconnected');
    });

    newSocket.on('connect_error', (_error) => {
      setState('disconnected');
      setMessage('Connection failed. Please refresh.');
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleRegister = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!socket || !name1.trim() || !name2.trim()) return;

      socket.emit('joinSession', { name1: name1.trim(), name2: name2.trim() });
      setState('waiting');
      setMessage('Registered! Waiting for coordinator...');
    },
    [socket, name1, name2]
  );

  const handleBuzzerPress = useCallback(() => {
    if (!socket || state !== 'ready') return;

    socket.emit('pressBuzzer');
  }, [socket, state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 flex flex-col">
      {/* Header */}
      <header className="p-4 text-center border-b border-teal-700/30">
        <h1 className="text-2xl font-bold text-white">Code Hunt</h1>
        <p className="text-teal-300 text-sm">Buzzer System</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {/* Connecting State */}
        {state === 'connecting' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-teal-200">Connecting...</p>
          </div>
        )}

        {/* Disconnected State */}
        {state === 'disconnected' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-12 h-12 text-red-400"
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
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Connection Lost</h2>
              <p className="text-teal-200">{message || 'Please refresh to reconnect'}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold transition-colors"
            >
              Refresh
            </button>
          </div>
        )}

        {/* No Session State */}
        {state === 'no-session' && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-12 h-12 text-teal-400"
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
              <h2 className="text-xl font-bold text-white mb-2">No Active Session</h2>
              <p className="text-teal-200">{message}</p>
            </div>
          </div>
        )}

        {/* Register State */}
        {state === 'register' && (
          <div className="w-full max-w-sm">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Join Session</h2>
                <p className="text-teal-200">Enter your team names</p>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Team Member 1"
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-teal-500/30 text-white placeholder-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Team Member 2"
                  value={name2}
                  onChange={(e) => setName2(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-teal-500/30 text-white placeholder-teal-300/50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white rounded-lg font-bold text-lg shadow-lg shadow-teal-500/30 transition-all"
              >
                Join
              </button>
            </form>
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
              <p className="text-teal-200">{message || 'Waiting for coordinator...'}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-teal-300">
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
            <div className="flex items-center justify-center gap-2 text-teal-300 mb-4">
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
              <p className="text-teal-200">{message}</p>
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
              <p className="text-teal-200">{message || `${winnerNames} pressed first!`}</p>
            </div>
            <p className="text-teal-400 text-sm">Wait for the next question...</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-teal-300/50 text-xs">XIANZE 2026 • Code Hunt</footer>
    </div>
  );
}
