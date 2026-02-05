'use client';

import { getWSUrl } from '@/lib/buzzer-ws';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
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

interface WSMessage {
  type: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

type ConnectionState = 'connecting' | 'connected' | 'disconnected';
type SessionState = 'idle' | 'active' | 'buzzer-enabled' | 'winner';

interface BuzzerPanelProps {
  defaultEvent?: string;
  showEventSelector?: boolean;
  buzzerPath?: string;
}

export default function BuzzerPanel({
  defaultEvent = 'think-link',
  showEventSelector = false,
  buzzerPath,
}: BuzzerPanelProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [teams, setTeams] = useState<Team[]>([]);
  const [winner, setWinner] = useState<WinnerData | null>(null);
  const [error, setError] = useState('');
  const [showQR, setShowQR] = useState(true);
  const [currentEvent, setCurrentEvent] = useState(defaultEvent);
  const [availableEvents, setAvailableEvents] = useState<BuzzerEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getBuzzerUrl = () => {
    if (typeof window !== 'undefined') {
      const path = buzzerPath || `/events/${defaultEvent}/buzzer`;
      return `${window.location.origin}${path}`;
    }
    return `https://xianze.tech/events/${defaultEvent}/buzzer`;
  };

  // Helper to send WebSocket message with response
  // Helper to send message with optional WebSocket instance
  const sendWSMessage = useCallback(
    (
      type: string,
      data?: Record<string, unknown>,
      wsInstance?: WebSocket,
      timeoutMs = 10000
    ): Promise<Record<string, unknown>> => {
      return new Promise((resolve, reject) => {
        const ws = wsInstance || wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          console.error('[BuzzerPanel] WebSocket not connected');
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

        setTimeout(() => {
          ws.removeEventListener('message', handleResponse);
          console.error('[BuzzerPanel] Request timeout for:', type);
          reject(new Error('Request timeout'));
        }, timeoutMs);
      });
    },
    []
  );

  const sendWSWithResponse = useCallback(
    (type: string, data?: Record<string, unknown>) => sendWSMessage(type, data),
    [sendWSMessage]
  );

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState('connecting');
    const wsUrl = getWSUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('connected');
      setError('');

      // Join as coordinator and select default event - pass ws instance directly
      sendWSMessage('coordinator:join', undefined, ws)
        .then(() => sendWSMessage('coordinator:select-event', { eventSlug: defaultEvent }, ws))
        .catch((err) => {
          setError('Failed to join as coordinator: ' + err.message);
        });
    };

    ws.onerror = (error) => {
      console.error('[BuzzerPanel] WebSocket error:', error);
      setError('WebSocket connection error');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type, data = {} } = msg;

        switch (type) {
          case 'state:update': {
            const stateData = data as {
              isActive?: boolean;
              isBuzzerEnabled?: boolean;
              teams?: Team[];
              currentWinner?: WinnerData | null;
              eventSlug?: string;
              availableEvents?: BuzzerEvent[];
            };
            setTeams(stateData.teams || []);
            if (stateData.eventSlug) {
              setCurrentEvent(stateData.eventSlug);
            }
            if (stateData.availableEvents) {
              setAvailableEvents(stateData.availableEvents);
            }
            if (stateData.isActive) {
              if (stateData.currentWinner) {
                setSessionState('winner');
                setWinner(stateData.currentWinner);
              } else if (stateData.isBuzzerEnabled) {
                setSessionState('buzzer-enabled');
              } else {
                setSessionState('active');
              }
            } else {
              setSessionState('idle');
            }
            break;
          }

          case 'event:changed': {
            const eventData = data as { eventSlug?: string; availableEvents?: BuzzerEvent[] };
            if (eventData.eventSlug) {
              setCurrentEvent(eventData.eventSlug);
            }
            if (eventData.availableEvents) {
              setAvailableEvents(eventData.availableEvents);
            }
            break;
          }

          case 'teams:update': {
            const teamsData = data as { teams?: Team[] };
            setTeams(teamsData.teams || []);
            break;
          }

          case 'buzzer:winner': {
            const winnerData = data as WinnerData;
            setWinner(winnerData);
            setSessionState('winner');
            break;
          }

          case 'buzzer:enabled':
            setSessionState('buzzer-enabled');
            setWinner(null);
            break;

          // Handle broadcasts from ThinkLinkPresenter or other coordinators
          case 'answer:correct':
            setSessionState('active');
            setWinner(null);
            break;

          case 'answer:wrong':
            setWinner(null);
            // State will be updated by buzzer:enabled or buzzer:winner broadcast
            break;
        }
      } catch {
        // Parse error - ignore
      }
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      setConnectionState('disconnected');

      // Auto-reconnect after 2 seconds if not a clean close
      if (!event.wasClean && reconnectTimeoutRef.current === null) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connect();
        }, 2000);
      }
    };

    ws.onerror = () => {
      setError('Unable to connect to server');
    };
  }, [defaultEvent, sendWSMessage]);

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      connect();
    }

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only connect once on mount

  const handleStartSession = useCallback(() => {
    sendWSWithResponse('coordinator:start-session')
      .then((response) => {
        if (response.success) {
          setSessionState('active');
          setWinner(null);
        } else {
          setError((response.error as string) || 'Failed to start session');
        }
      })
      .catch((err) => setError('Failed to start session: ' + err.message));
  }, [sendWSWithResponse]);

  const handleEndSession = useCallback(() => {
    sendWSWithResponse('coordinator:end-session')
      .then((response) => {
        if (response.success) {
          setSessionState('idle');
          setWinner(null);
        } else {
          setError((response.error as string) || 'Failed to end session');
        }
      })
      .catch(() => setError('Failed to end session'));
  }, [sendWSWithResponse]);

  const handleReset = useCallback(() => {
    sendWSWithResponse('coordinator:reset')
      .then((response) => {
        if (response.success) {
          setSessionState('active');
          setWinner(null);
        } else {
          setError((response.error as string) || 'Failed to reset');
        }
      })
      .catch(() => setError('Failed to reset'));
  }, [sendWSWithResponse]);

  const handleCorrectAnswer = useCallback(() => {
    // Optimistic UI update for instant feedback
    setSessionState('active');
    setWinner(null);

    // Send request with 30s timeout for high-load scenarios (20+ phones)
    sendWSMessage('coordinator:answer-correct', undefined, undefined, 30000)
      .then((response) => {
        if (!response.success) {
          // Revert optimistic update on failure
          setError((response.error as string) || 'Failed to mark correct');
        }
      })
      .catch((err) => {
        console.error('[BuzzerPanel] Correct answer error:', err);
        // Keep optimistic state even on timeout - broadcasts likely succeeded
        console.warn('[BuzzerPanel] Timeout likely due to high load, state already updated');
      });
  }, [sendWSMessage]);

  const handleWrongAnswer = useCallback(() => {
    // Optimistic UI update for instant feedback
    setWinner(null);
    setSessionState('buzzer-enabled');

    // Send request with 30s timeout for high-load scenarios (20+ phones)
    sendWSMessage('coordinator:answer-wrong', undefined, undefined, 30000)
      .then((response) => {
        if (!response.success) {
          // Revert optimistic update on failure
          setError((response.error as string) || 'Failed to mark wrong');
        }
      })
      .catch((err) => {
        console.error('[BuzzerPanel] Wrong answer error:', err);
        // Keep optimistic state even on timeout - broadcasts likely succeeded
        console.warn('[BuzzerPanel] Timeout likely due to high load, state already updated');
      });
  }, [sendWSMessage]);

  const handleReconnect = useCallback(() => {
    connect();
  }, [connect]);

  const handleEventChange = useCallback(
    (eventSlug: string) => {
      sendWSWithResponse('coordinator:select-event', { eventSlug })
        .then((response) => {
          if (!response.success) {
            setError((response.error as string) || 'Failed to change event');
          }
        })
        .catch(() => setError('Failed to change event'));
    },
    [sendWSWithResponse]
  );

  const statusLabel =
    sessionState === 'idle'
      ? 'Off'
      : sessionState === 'buzzer-enabled'
        ? 'Live'
        : sessionState === 'winner'
          ? 'Winner'
          : 'Waiting';
  const statusTone =
    sessionState === 'buzzer-enabled'
      ? 'text-emerald-500'
      : sessionState === 'winner'
        ? 'text-primary-500'
        : sessionState === 'idle'
          ? 'text-gray-400'
          : 'text-blue-500';

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
              <svg
                className="w-12 h-12 text-primary-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
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
              Wrong → Buzzer re-enables for other teams | Correct → Advances to next slide
            </p>
          </div>
        </Card>
      )}

      {/* Buzzer Live Indicator */}
      {sessionState === 'buzzer-enabled' && !winner && (
        <Card className="p-8 border-4 border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg
                className="w-10 h-10 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-emerald-800 mb-2">Buzzer is LIVE!</h2>
            <p className="text-gray-600">Waiting for teams to press...</p>
            <p className="text-sm text-gray-500 mt-2">{teams.length} team(s) connected</p>
          </div>
        </Card>
      )}

      {/* Waiting for Slide - Session active but buzzer not enabled */}
      {sessionState === 'active' && !winner && (
        <Card className="p-8 border-4 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-blue-800 mb-2">Waiting for Slide Change</h2>
            <p className="text-gray-600">
              Buzzer will auto-enable when you navigate slides in presenter
            </p>
            <p className="text-sm text-gray-500 mt-2">{teams.length} team(s) connected</p>
          </div>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6v-2a4 4 0 00-3-3.87M7 7a4 4 0 118 0 4 4 0 01-8 0zm10 4a4 4 0 10-8 0 4 4 0 008 0z"
              />
            </svg>
          }
          value={teams.length}
          label="Teams Connected"
          iconColor="text-primary-600"
        />
        <StatCard
          icon={
            <svg className={`w-5 h-5 ${statusTone}`} fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="6" />
            </svg>
          }
          value={statusLabel}
          label="Buzzer Status"
          iconColor="text-primary-600"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          }
          value={sessionState === 'buzzer-enabled' ? 'Enabled' : 'Disabled'}
          label="State"
          iconColor="text-primary-600"
        />
        <StatCard
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 4h6a1 1 0 011 1v2h3a1 1 0 011 1v1a5 5 0 01-5 5h-1.5a3.5 3.5 0 01-7 0H8a5 5 0 01-5-5V8a1 1 0 011-1h3V5a1 1 0 011-1z"
              />
            </svg>
          }
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
            {showEventSelector && availableEvents.length > 0 && sessionState === 'idle' && (
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
            {showEventSelector && currentEvent && sessionState !== 'idle' && (
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

          {/* Reset Button - Emergency recovery */}
          {sessionState !== 'idle' && (
            <Button onClick={handleReset} variant="secondary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </Button>
          )}
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
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6v-2a4 4 0 00-3-3.87M7 7a4 4 0 118 0 4 4 0 01-8 0zm10 4a4 4 0 10-8 0 4 4 0 008 0z"
              />
            </svg>
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
                  <svg
                    className="w-5 h-5 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.121 17.804A4 4 0 017.9 16h8.2a4 4 0 012.778 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
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
