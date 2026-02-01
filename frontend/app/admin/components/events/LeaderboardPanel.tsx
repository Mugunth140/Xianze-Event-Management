'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
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
  const socketRef = useRef<Socket | null>(null);

  const getApiUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return apiUrl.replace(/\/api$/, '');
  };

  const fetchLeaderboard = useCallback((socket: Socket, eventSlug?: string) => {
    socket.emit(
      'coordinator:get-leaderboard',
      { eventSlug },
      (res: { success: boolean; leaderboard?: TeamScore[]; eventSlug?: string }) => {
        if (res.success && res.leaderboard) {
          setLeaderboard(res.leaderboard);
          if (res.eventSlug) {
            setCurrentEvent(res.eventSlug);
          }
        }
      }
    );
  }, []);

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

      // Register as coordinator
      socket.emit(
        'coordinator:join',
        (response: { success: boolean; eventSlug?: string; availableEvents?: BuzzerEvent[] }) => {
          if (response.success) {
            // Fetch initial leaderboard for the default event
            fetchLeaderboard(socket, defaultEvent);
          } else {
            setError('Failed to join as coordinator');
          }
        }
      );
    });

    socket.on('disconnect', () => {
      setConnectionState('disconnected');
    });

    socket.on('connect_error', () => {
      setError('Unable to connect to server');
      setConnectionState('disconnected');
    });

    // Listen for leaderboard updates
    socket.on('leaderboard:update', (data: { leaderboard: TeamScore[]; eventSlug?: string }) => {
      setLeaderboard(data.leaderboard);
      if (data.eventSlug) {
        setCurrentEvent(data.eventSlug);
      }
    });

    // Listen for event changes
    socket.on('event:changed', (data: { eventSlug: string; availableEvents: BuzzerEvent[] }) => {
      setCurrentEvent(data.eventSlug);
      setAvailableEvents(data.availableEvents);
      // Fetch leaderboard for new event
      fetchLeaderboard(socket, data.eventSlug);
    });

    // Get available events
    socket.emit(
      'coordinator:get-events',
      (res: { success: boolean; events?: BuzzerEvent[]; currentEvent?: string }) => {
        if (res.success && res.events) {
          setAvailableEvents(res.events);
          if (res.currentEvent) {
            setCurrentEvent(res.currentEvent);
          }
        }
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [fetchLeaderboard, defaultEvent]);

  const handleEventChange = useCallback(
    (eventSlug: string) => {
      setCurrentEvent(eventSlug);
      if (socketRef.current) {
        fetchLeaderboard(socketRef.current, eventSlug);
      }
    },
    [fetchLeaderboard]
  );

  const handleResetLeaderboard = useCallback(() => {
    if (!confirm('Are you sure you want to reset the leaderboard? All scores will be cleared.')) {
      return;
    }

    socketRef.current?.emit(
      'coordinator:reset-leaderboard',
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          setError(response.error || 'Failed to reset leaderboard');
        }
      }
    );
  }, []);

  const handleReconnect = useCallback(() => {
    setConnectionState('connecting');
    socketRef.current?.connect();
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

      {/* Leaderboard Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">🏆 Leaderboard</h3>
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
            <span className="text-5xl block mb-4">🏆</span>
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
                          <span className="text-2xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-2xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-2xl">🥉</span>
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
                          <span className="text-lg">👥</span>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            🎉 Top Performers
          </h3>
          <div className="flex items-end justify-center gap-4">
            {/* Second Place */}
            {leaderboard[1] && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                  <span className="text-3xl">🥈</span>
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
                  <span className="text-4xl">🥇</span>
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
                  <span className="text-2xl">🥉</span>
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
