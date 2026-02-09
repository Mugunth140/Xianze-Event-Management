'use client';

import { getApiUrl } from '@/lib/api';
import { getWSUrl } from '@/lib/buzzer-ws';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { StatCard } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';
import useConfirm from '../hooks/useConfirm';

interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  order: number;
  round: number;
}

interface Participant {
  id: number;
  name: string;
  score: number;
  lastSubmitTime: string | null;
  email?: string | null;
}

interface RoundState {
  status: 'waiting' | 'active' | 'completed';
  roundDuration: number;
  startedAt: string | null;
  activeRound: number;
}

interface Stats {
  totalQuestions: number;
  totalParticipants: number;
}

type Tab = 'overview' | 'mcq' | 'leaderboard';

export default function CtrlQuizPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roundDuration, setRoundDuration] = useState(30);
  const [showQR, setShowQR] = useState(true);
  const [selectedRound, setSelectedRound] = useState<1 | 2>(1);
  const wsRef = useRef<WebSocket | null>(null);

  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });

  const filteredQuestions = questions.filter((q) => q.round === selectedRound);
  const safeLeaderboard = Array.isArray(leaderboard) ? leaderboard : [];

  const getQuizUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/events/ctrl-quiz/mcq`;
    }
    return 'https://xianze.tech/events/ctrl-quiz/mcq';
  };

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const [questionsRes, leaderboardRes, stateRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/ctrl-quiz/questions'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/ctrl-quiz/leaderboard')),
        fetch(getApiUrl('/ctrl-quiz/state'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/ctrl-quiz/stats'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const questionsData = await questionsRes.json();
      const leaderboardData = await leaderboardRes.json();
      const stateData = await stateRes.json();
      const statsData = await statsRes.json();

      setQuestions(questionsData.data || []);
      setLeaderboard(leaderboardData.data || []);
      setRoundState(stateData.data || null);
      setStats(statsData.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket for real-time leaderboard
  useEffect(() => {
    if (activeTab !== 'leaderboard') return;

    const wsUrl = getWSUrl();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'coordinator:join' }));
      ws.send(
        JSON.stringify({ type: 'coordinator:select-event', data: { eventSlug: 'ctrl-quiz' } })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'leaderboard:update') {
          const nextLeaderboard = Array.isArray(message.data?.leaderboard)
            ? message.data.leaderboard
            : Array.isArray(message.data)
              ? message.data
              : [];
          setLeaderboard(nextLeaderboard);
        }
      } catch {
        // Ignore parse errors
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds for overview/mcq tabs
    if (activeTab !== 'leaderboard') {
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchData, activeTab]);

  const handleAddQuestion = async () => {
    const token = localStorage.getItem('token');
    const validOptions = newQuestion.options.filter((o) => o.trim());
    if (!newQuestion.questionText || validOptions.length < 2) {
      setError('Question must have text and at least 2 options');
      return;
    }

    try {
      await fetch(getApiUrl('/ctrl-quiz/questions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newQuestion, options: validOptions, round: selectedRound }),
      });
      setNewQuestion({ questionText: '', options: ['', '', '', ''], correctIndex: 0 });
      fetchData();
    } catch {
      setError('Failed to add question');
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    const ok = await confirm({
      title: 'Delete Question',
      message: 'Delete this question?',
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });
    if (!ok) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(getApiUrl(`/ctrl-quiz/questions/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch {
      setError('Failed to delete question');
    }
  };

  const handleStart = async (round: 1 | 2) => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl('/ctrl-quiz/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ duration: roundDuration, round }),
    });
    fetchData();
  };

  const handlePause = async () => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl('/ctrl-quiz/pause'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleEnd = async () => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl('/ctrl-quiz/end'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Reset Quiz',
      message:
        'This will permanently remove ALL participants and their scores from the leaderboard. The quiz will be reset to a fresh state. Continue?',
      confirmText: 'Reset',
      confirmVariant: 'danger',
    });
    if (!ok) return;
    const token = localStorage.getItem('token');
    // Optimistically clear the leaderboard for instant UI feedback
    setLeaderboard([]);
    try {
      const res = await fetch(getApiUrl('/ctrl-quiz/reset'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to reset quiz');
      }
    } catch {
      setError('Network error while resetting quiz');
    }
    fetchData();
  };

  if (loading) return <PageLoader message="Loading Ctrl + Quiz..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Ctrl + Quiz" subtitle="Technical Shortcut Quiz - Fast-paced MCQ" />

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {(['overview', 'mcq', 'leaderboard'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'mcq' && 'MCQ Questions'}
              {tab === 'leaderboard' && 'Leaderboard'}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                value={stats.totalQuestions}
                label="Questions"
                iconColor="text-primary-600"
              />
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
                value={stats.totalParticipants}
                label="Participants"
                iconColor="text-blue-600"
              />
              <StatCard
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                }
                value={`Round ${roundState?.activeRound || 1}`}
                label="Active Round"
                iconColor="text-indigo-600"
              />
              <StatCard
                icon={
                  <svg
                    className={`w-6 h-6 ${roundState?.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="6" />
                  </svg>
                }
                value={
                  roundState?.status === 'active'
                    ? 'Live'
                    : roundState?.status === 'completed'
                      ? 'Ended'
                      : 'Waiting'
                }
                label="Status"
                iconColor="text-emerald-600"
              />
            </div>
          )}

          {/* Quiz Controls */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Round Controls</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Start and manage rounds individually (Round 1 or Round 2)
                </p>
              </div>
              <Badge
                variant={
                  roundState?.status === 'active'
                    ? 'success'
                    : roundState?.status === 'completed'
                      ? 'purple'
                      : 'warning'
                }
              >
                {roundState?.status === 'active'
                  ? `Round ${roundState?.activeRound || 1} • Live`
                  : roundState?.status || 'waiting'}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {roundState?.status !== 'active' && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Duration (mins):</label>
                    <Input
                      type="number"
                      className="w-20"
                      value={roundDuration}
                      onChange={(e) => setRoundDuration(parseInt(e.target.value) || 30)}
                    />
                  </div>
                  <Button
                    onClick={() => handleStart(1)}
                    className="!bg-emerald-600 hover:!bg-emerald-500"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Round 1
                  </Button>
                  <Button
                    onClick={() => handleStart(2)}
                    className="!bg-indigo-600 hover:!bg-indigo-500"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Start Round 2
                  </Button>
                </>
              )}
              {roundState?.status === 'active' && (
                <>
                  <Button variant="secondary" onClick={handlePause}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                    End Round
                  </Button>
                  {roundState?.activeRound === 2 && (
                    <Button variant="danger" onClick={handleEnd}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h12v12H6z" />
                      </svg>
                      Finish Quiz
                    </Button>
                  )}
                </>
              )}
              {roundState?.status === 'completed' && (
                <Button variant="secondary" onClick={handleReset}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset Quiz
                </Button>
              )}
            </div>
          </Card>

          {/* QR Code */}
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
                  <QRCodeSVG value={getQuizUrl()} size={180} level="H" includeMargin={true} />
                </div>
                <div className="text-center md:text-left">
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Scan to Join Quiz</h4>
                  <p className="text-gray-500 mb-4">
                    Participants scan this QR code to take the quiz
                  </p>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg font-mono text-sm break-all">
                    {getQuizUrl()}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MCQ Tab */}
      {activeTab === 'mcq' && (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Round Questions</h3>
                <p className="text-sm text-gray-500">Manage questions separately for each round</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={selectedRound === 1 ? 'primary' : 'secondary'}
                  onClick={() => setSelectedRound(1)}
                >
                  Round 1
                </Button>
                <Button
                  variant={selectedRound === 2 ? 'primary' : 'secondary'}
                  onClick={() => setSelectedRound(2)}
                >
                  Round 2
                </Button>
              </div>
            </div>
          </Card>
          {/* Add Question Form */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Question</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <Input
                  placeholder="What is the shortcut for..."
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options (select correct answer)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {newQuestion.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        newQuestion.correctIndex === i
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setNewQuestion({ ...newQuestion, correctIndex: i })}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          newQuestion.correctIndex === i
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {newQuestion.correctIndex === i && (
                          <svg
                            className="w-4 h-4 text-white"
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
                        )}
                      </div>
                      <Input
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        className="flex-1"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const opts = [...newQuestion.options];
                          opts[i] = e.target.value;
                          setNewQuestion({ ...newQuestion, options: opts });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddQuestion}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Question
                </Button>
              </div>
            </div>
          </Card>

          {/* Questions List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Round {selectedRound} Questions ({filteredQuestions.length})
            </h3>
            {filteredQuestions.length === 0 ? (
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
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>No questions added yet</p>
                <p className="text-sm mt-1">Add questions above to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-400">Q{idx + 1}</span>
                          <p className="font-medium text-gray-900">{q.questionText}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              className={`text-sm px-3 py-1.5 rounded-lg ${
                                i === q.correctIndex
                                  ? 'bg-emerald-100 text-emerald-700 font-medium'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {i === q.correctIndex && '✓ '}
                              {opt}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Live Leaderboard</h3>
              <div className="flex items-center gap-2">
                <Badge variant="success">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                  Real-time
                </Badge>
                <Button variant="secondary" onClick={handleReset}>
                  Reset Leaderboard
                </Button>
              </div>
            </div>

            {safeLeaderboard.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p>No participants yet</p>
                <p className="text-sm mt-1">Leaderboard will update in real-time</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                  <h4 className="text-sm font-semibold text-gray-700">Leaderboard</h4>
                  <span className="text-xs text-gray-500">Sorted by score</span>
                </div>
                <ul className="divide-y divide-gray-100">
                  {safeLeaderboard.map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between px-4 py-3 transition-all duration-300 hover:bg-gray-50"
                      style={{
                        animation: 'leaderboardFade 240ms ease',
                        animationDelay: `${i * 40}ms`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">Participant</div>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">{p.score}</div>
                    </li>
                  ))}
                </ul>
                <style jsx>{`
                  @keyframes leaderboardFade {
                    from {
                      opacity: 0;
                      transform: translateY(6px);
                    }
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }
                `}</style>
              </div>
            )}
          </Card>
        </div>
      )}
      <ConfirmDialog />
    </div>
  );
}
