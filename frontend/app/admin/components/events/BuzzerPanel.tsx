'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Button from '../ui/Button';
import Card, { StatCard } from '../ui/Card';

interface Team {
  socketId: string;
  name1: string;
  name2: string;
  joinedAt: number;
}

interface WinnerData {
  team: Team;
  pressedAt: number;
}

interface BuzzerEvent {
  slug: string;
  name: string;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected';
type SessionState = 'idle' | 'active' | 'buzzer-enabled' | 'winner';

interface BuzzerPanelProps {
  defaultEvent?: string;
}

export default function BuzzerPanel({ defaultEvent = 'think-link' }: BuzzerPanelProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [teams, setTeams] = useState<Team[]>([]);
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(true);
  const [currentEvent, setCurrentEvent] = useState(defaultEvent);
  const [availableEvents, setAvailableEvents] = useState<BuzzerEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const getApiUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api$/, '');
  };

  const getBuzzerUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/events/think-link/buzzer`;
    }
    return 'https://xianze.tech/events/think-link/buzzer';
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
      setConnectionState('connected');
      setError('');
      socket.emit('coordinator:join', (response: { success: boolean }) => {
        if (!response.success) {
          setError('Failed to join as coordinator');
        }
      });
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('connect_error', () => {
      setError('Unable to connect to server');
      setConnectionState('disconnected');
    });

    socket.on(
      'state:update',
      (data: {
        isActive: boolean;
        isBuzzerEnabled: boolean;
        teamCount: number;
        teams: Team[];
        currentWinner: WinnerData | null;
        eventSlug?: string;
        availableEvents?: BuzzerEvent[];
      }) => {
        setTeams(data.teams || []);
        if (data.eventSlug) {
          setCurrentEvent(data.eventSlug);
        }
        if (data.availableEvents) {
          setAvailableEvents(data.availableEvents);
        }
        if (data.isActive) {
          if (data.currentWinner) {
            setSessionState('winner');
            setWinner(data.currentWinner);
          } else if (data.isBuzzerEnabled) {
            setSessionState('buzzer-enabled');
          } else {
            setSessionState('active');
          }
        } else {
          setSessionState('idle');
        }
      }
    );

    socket.on('event:changed', (data: { eventSlug: string; availableEvents: BuzzerEvent[] }) => {
      setCurrentEvent(data.eventSlug);
      setAvailableEvents(data.availableEvents);
    });

    socket.on('teams:update', (data: { teamCount: number; teams: Team[] }) => {
      setTeams(data.teams || []);
    });

    socket.on('buzzer:winner', (data: WinnerData) => {
      setWinner(data);
      setSessionState('winner');
    });

    // Listen for buzzer re-enabled after wrong answer
    socket.on('buzzer:enabled', () => {
      setSessionState('buzzer-enabled');
      setWinner(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleStartSession = useCallback(() => {
    socketRef.current?.emit(
      'coordinator:start-session',
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setSessionState('active');
          setWinner(null);
        } else {
          setError(response.error || 'Failed to start session');
        }
      }
    );
  }, []);

  const handleEndSession = useCallback(() => {
    socketRef.current?.emit(
      'coordinator:end-session',
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setSessionState('idle');
          setWinner(null);
        } else {
          setError(response.error || 'Failed to end session');
        }
      }
    );
  }, []);

  const handleEnableBuzzer = useCallback(() => {
    socketRef.current?.emit(
      'coordinator:enable-buzzer',
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setSessionState('buzzer-enabled');
          setWinner(null);
        } else {
          setError(response.error || 'Failed to enable buzzer');
        }
      }
    );
  }, []);

  const handleDisableBuzzer = useCallback(() => {
    socketRef.current?.emit(
      'coordinator:disable-buzzer',
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setSessionState('active');
        } else {
          setError(response.error || 'Failed to pause buzzer');
        }
      }
    );
  }, []);

  const handleCorrectAnswer = useCallback(() => {
    socketRef.current?.emit(
      'coordinator:answer-correct',
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setSessionState('active');
          setWinner(null);
        } else {
          setError(response.error || 'Failed to mark correct');
        }
      }
    );
  }, []);

  const handleWrongAnswer = useCallback(() => {
    socketRef.current?.emit(
      'coordinator:answer-wrong',
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          // Buzzer re-enabled automatically, state updated via socket event
        } else {
          setError(response.error || 'Failed to mark wrong');
        }
      }
    );
  }, []);

  const handleReconnect = useCallback(() => {
    setConnectionState('connecting');
    socketRef.current?.connect();
  }, []);

  const handleEventChange = useCallback((eventSlug: string) => {
    socketRef.current?.emit(
      'coordinator:select-event',
      { eventSlug },
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          setError(response.error || 'Failed to change event');
        }
      }
    );
  }, []);

  // Disconnected state
  if (connectionState === 'disconnected') {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Lost</h3>
        <p className="text-gray-500 mb-4">Unable to connect to the buzzer server</p>
        <Button onClick={handleReconnect}>Reconnect</Button>
      </Card>
    );
  }

  // Connecting state
  if (connectionState === 'connecting') {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Connecting to buzzer server...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Winner Display - Full Width Priority */}
      {sessionState === 'winner' && winner && (
        <Card className="p-8 border-4 border-primary-500 bg-gradient-to-br from-primary-50 to-purple-50">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <span className="text-5xl">🔔</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">First to Buzz!</h2>
            <p className="text-2xl font-semibold text-primary-600 mb-8">
              {winner.team.name1} & {winner.team.name2}
            </p>

            <div className="flex justify-center gap-6">
              <button
                onClick={handleCorrectAnswer}
                className="flex flex-col items-center gap-2 px-12 py-6 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl transition-all hover:scale-105 shadow-lg"
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-xl font-bold">Correct</span>
              </button>
              <button
                onClick={handleWrongAnswer}
                className="flex flex-col items-center gap-2 px-12 py-6 bg-red-500 hover:bg-red-400 text-white rounded-2xl transition-all hover:scale-105 shadow-lg"
              >
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span className="text-xl font-bold">Wrong</span>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Wrong → Buzzer re-enables automatically | Correct → Pause for next question
            </p>
          </div>
        </Card>
      )}

      {/* Buzzer Live Indicator */}
      {sessionState === 'buzzer-enabled' && !winner && (
        <Card className="p-8 border-4 border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-4xl">🔔</span>
            </div>
            <h2 className="text-3xl font-bold text-amber-800 mb-2">Buzzer is LIVE!</h2>
            <p className="text-gray-600">Waiting for teams to press...</p>
            <p className="text-sm text-gray-500 mt-2">{teams.length} team(s) connected</p>
          </div>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<span className="text-2xl">👥</span>}
          value={teams.length}
          label="Teams Connected"
          iconColor="text-primary-600"
        />
        <StatCard
          icon={
            <span className="text-2xl">
              {sessionState === 'buzzer-enabled' ? '🟢' : sessionState === 'idle' ? '⏹️' : '🟡'}
            </span>
          }
          value={
            sessionState === 'idle' ? 'Off' : sessionState === 'buzzer-enabled' ? 'LIVE' : 'Paused'
          }
          label="Buzzer Status"
          iconColor="text-primary-600"
        />
        <StatCard
          icon={<span className="text-2xl">🔔</span>}
          value={sessionState === 'buzzer-enabled' ? 'Enabled' : 'Disabled'}
          label="State"
          iconColor="text-primary-600"
        />
        <StatCard
          icon={<span className="text-2xl">🏆</span>}
          value={winner ? '1' : '0'}
          label="Winner"
          iconColor="text-primary-600"
        />
      </div>

      {/* Control Panel */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Buzzer Controls</h3>
            {availableEvents.length > 0 && sessionState === 'idle' && (
              <select
                value={currentEvent}
                onChange={(e) => handleEventChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {availableEvents.map((event) => (
                  <option key={event.slug} value={event.slug}>
                    {event.name}
                  </option>
                ))}
              </select>
            )}
            {currentEvent && sessionState !== 'idle' && (
              <span className="px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                {availableEvents.find((e) => e.slug === currentEvent)?.name || currentEvent}
              </span>
            )}
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              connectionState === 'connected'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
            {connectionState === 'connected' ? 'Connected' : 'Disconnected'}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Session Start/End */}
          {sessionState === 'idle' ? (
            <Button onClick={handleStartSession} className="!bg-primary-600 hover:!bg-primary-500">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Start Session
            </Button>
          ) : (
            <Button variant="danger" onClick={handleEndSession}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
              End Session
            </Button>
          )}

          {/* Enable/Disable Buzzer */}
          {sessionState !== 'idle' &&
            sessionState !== 'winner' &&
            (sessionState === 'buzzer-enabled' ? (
              <Button onClick={handleDisableBuzzer} className="!bg-amber-500 hover:!bg-amber-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
                Pause Buzzer
              </Button>
            ) : (
              <Button
                onClick={handleEnableBuzzer}
                className="!bg-emerald-600 hover:!bg-emerald-500"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Enable Buzzer
              </Button>
            ))}
        </div>
      </Card>

      {/* QR Code Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Participant QR Code</h3>
          <Button variant="secondary" onClick={() => setShowQR(!showQR)}>
            {showQR ? 'Hide QR' : 'Show QR'}
          </Button>
        </div>

        {showQR && (
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-inner border">
              <QRCodeSVG value={getBuzzerUrl()} size={180} level="H" includeMargin={true} />
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-lg font-bold text-gray-900 mb-2">Scan to Join Buzzer</h4>
              <p className="text-gray-500 mb-4">Participants scan this QR code to join</p>
              <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-sm break-all">
                {getBuzzerUrl()}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Connected Teams */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Connected Teams ({teams.length})
        </h3>

        {teams.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-3">👥</span>
            <p>No teams connected yet</p>
            <p className="text-sm mt-1">Share the QR code for participants to join</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teams.map((team) => (
              <div
                key={team.socketId}
                className="flex items-center gap-3 p-3 bg-primary-50 rounded-xl border border-primary-100"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{team.name1}</p>
                  <p className="text-sm text-gray-500">{team.name2}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
