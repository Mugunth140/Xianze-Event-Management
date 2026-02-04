'use client';

import { getWSUrl } from '@/lib/buzzer-ws';
import { useCallback, useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface TeamScore {
  teamKey: string;
  name1: string;
  name2: string;
  score: number;
  correctAnswers: number;
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

interface LeaderboardPanelProps {
  defaultEvent?: string;
}

export default function LeaderboardPanel({ defaultEvent = 'think-link' }: LeaderboardPanelProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [leaderboard, setLeaderboard] = useState<TeamScore[]>([]);
  const [currentEvent, setCurrentEvent] = useState(defaultEvent);
  const [availableEvents, setAvailableEvents] = useState<BuzzerEvent[]>([]);
  const [error, setError] = useState('');
  const wsRef = useRef<WebSocket | null>(null);

  // Helper to send WebSocket message with response
  const sendWSWithResponse = useCallback(
    (type: string, data?: Record<string, unknown>): Promise<Record<string, unknown>> => {
      return new Promise((resolve, reject) => {
        const ws = wsRef.current;
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

        setTimeout(() => {
          ws.removeEventListener('message', handleResponse);
          reject(new Error('Request timeout'));
        }, 10000);
      });
    },
    []
  );

  const fetchLeaderboard = useCallback(
    (eventSlug?: string) => {
      sendWSWithResponse('coordinator:get-leaderboard', { eventSlug })
        .then((res) => {
          if (res.success && res.leaderboard) {
            setLeaderboard(res.leaderboard as TeamScore[]);
            if (res.eventSlug) {
              setCurrentEvent(res.eventSlug as string);
            }
          }
        })
        .catch(() => {
          // Ignore fetch errors
        });
    },
    [sendWSWithResponse]
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

      // Join as coordinator and fetch initial leaderboard
      sendWSWithResponse('coordinator:join')
        .then(() => {
          fetchLeaderboard(defaultEvent);
          // Get available events
          return sendWSWithResponse('coordinator:get-events');
        })
        .then((res) => {
          if (res.success && res.events) {
            setAvailableEvents(res.events as BuzzerEvent[]);
            if (res.currentEvent) {
              setCurrentEvent(res.currentEvent as string);
            }
          }
        })
        .catch(() => {
          setError('Failed to join as coordinator');
        });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type, data = {} } = msg;

        switch (type) {
          case 'leaderboard:update': {
            const lbData = data as { leaderboard?: TeamScore[]; eventSlug?: string };
            if (lbData.leaderboard) {
              setLeaderboard(lbData.leaderboard);
            }
            if (lbData.eventSlug) {
              setCurrentEvent(lbData.eventSlug);
            }
            break;
          }

          case 'event:changed': {
            const eventData = data as { eventSlug?: string; availableEvents?: BuzzerEvent[] };
            if (eventData.eventSlug) {
              setCurrentEvent(eventData.eventSlug);
              fetchLeaderboard(eventData.eventSlug);
            }
            if (eventData.availableEvents) {
              setAvailableEvents(eventData.availableEvents);
            }
            break;
          }
        }
      } catch {
        // Parse error - ignore
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConnectionState('disconnected');
    };

    ws.onerror = () => {
      setError('Unable to connect to server');
    };
  }, [defaultEvent, sendWSWithResponse, fetchLeaderboard]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only connect once on mount

  const handleEventChange = useCallback(
    (eventSlug: string) => {
      setCurrentEvent(eventSlug);
      fetchLeaderboard(eventSlug);
    },
    [fetchLeaderboard]
  );

  const handleResetLeaderboard = useCallback(() => {
    if (!confirm('Are you sure you want to reset the leaderboard? All scores will be cleared.')) {
      return;
    }

    sendWSWithResponse('coordinator:reset-leaderboard')
      .then((response) => {
        if (!response.success) {
          setError((response.error as string) || 'Failed to reset leaderboard');
        }
      })
      .catch(() => setError('Failed to reset leaderboard'));
  }, [sendWSWithResponse]);

  const handleReconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

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

      {/* Leaderboard Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">Leaderboard</h3>
              {availableEvents.length > 0 && (
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
            </div>
            <p className="text-gray-500 text-sm">
              {leaderboard.length} team(s) • Points awarded for correct answers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                connectionState === 'connected'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionState === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              {connectionState === 'connected' ? 'Live' : 'Offline'}
            </div>
            <Button variant="danger" onClick={handleResetLeaderboard}>
              Reset Scores
            </Button>
          </div>
        </div>

        {/* Leaderboard Table */}
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 4h6a1 1 0 011 1v2h3a1 1 0 011 1v1a5 5 0 01-5 5h-1.5a3.5 3.5 0 01-7 0H8a5 5 0 01-5-5V8a1 1 0 011-1h3V5a1 1 0 011-1z"
              />
            </svg>
            <p className="text-lg font-medium">No scores yet</p>
            <p className="text-sm mt-1">
              Points will appear here when teams answer correctly in the buzzer round
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 w-16">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Team</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 w-32">
                    Correct
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 w-32">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((team, index) => (
                  <tr
                    key={team.teamKey}
                    className={`${
                      index === 0
                        ? 'bg-yellow-50'
                        : index === 1
                          ? 'bg-gray-50'
                          : index === 2
                            ? 'bg-amber-50/50'
                            : 'bg-white'
                    } hover:bg-primary-50/50 transition-colors`}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center">
                        {index === 0 ? (
                          <span className="w-8 h-8 bg-yellow-400 text-yellow-900 rounded-full flex items-center justify-center font-bold">
                            1
                          </span>
                        ) : index === 1 ? (
                          <span className="w-8 h-8 bg-gray-300 text-gray-800 rounded-full flex items-center justify-center font-bold">
                            2
                          </span>
                        ) : index === 2 ? (
                          <span className="w-8 h-8 bg-amber-300 text-amber-900 rounded-full flex items-center justify-center font-bold">
                            3
                          </span>
                        ) : (
                          <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
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
                              d="M17 20h5v-2a4 4 0 00-4-4h-1m-4 6v-2a4 4 0 00-3-3.87M7 7a4 4 0 118 0 4 4 0 01-8 0zm10 4a4 4 0 10-8 0 4 4 0 008 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{team.name1}</p>
                          <p className="text-sm text-gray-500">{team.name2}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        ✓ {team.correctAnswers}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold text-xl ${
                          index === 0
                            ? 'bg-yellow-400 text-yellow-900'
                            : index === 1
                              ? 'bg-gray-300 text-gray-800'
                              : index === 2
                                ? 'bg-amber-300 text-amber-900'
                                : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {team.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Top 3 Podium Display for Presentation */}
      {leaderboard.length >= 1 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Top Performers</h3>
          <div className="flex items-end justify-center gap-4">
            {/* Second Place */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold text-gray-700">2</span>
                </div>
                <div className="bg-gray-200 rounded-t-xl w-28 h-24 flex flex-col items-center justify-center">
                  <p className="font-bold text-gray-800 text-sm text-center px-1">
                    {leaderboard[1].name1}
                  </p>
                  <p className="text-xs text-gray-600">&amp; {leaderboard[1].name2}</p>
                  <p className="text-2xl font-bold text-gray-700 mt-1">{leaderboard[1].score}</p>
                </div>
              </div>
            )}

            {/* First Place */}
            {leaderboard[0] && (
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-yellow-300 rounded-full flex items-center justify-center mb-2 shadow-lg">
                  <span className="text-3xl font-bold text-yellow-900">1</span>
                </div>
                <div className="bg-yellow-400 rounded-t-xl w-32 h-32 flex flex-col items-center justify-center shadow-lg">
                  <p className="font-bold text-yellow-900 text-center px-1">
                    {leaderboard[0].name1}
                  </p>
                  <p className="text-xs text-yellow-800">&amp; {leaderboard[0].name2}</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{leaderboard[0].score}</p>
                </div>
              </div>
            )}

            {/* Third Place */}
            {leaderboard[2] && (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mb-2">
                  <span className="text-xl font-bold text-amber-900">3</span>
                </div>
                <div className="bg-amber-200 rounded-t-xl w-24 h-20 flex flex-col items-center justify-center">
                  <p className="font-bold text-amber-900 text-xs text-center px-1">
                    {leaderboard[2].name1}
                  </p>
                  <p className="text-xs text-amber-700">&amp; {leaderboard[2].name2}</p>
                  <p className="text-xl font-bold text-amber-800 mt-1">{leaderboard[2].score}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
