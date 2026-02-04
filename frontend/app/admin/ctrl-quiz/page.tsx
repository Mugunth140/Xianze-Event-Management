'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/layout';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { StatCard } from '../components/ui/Card';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';

interface Question {
  id: number;
  questionText: string;
  options: string[];
  correctIndex: number;
  order: number;
}

interface Participant {
  id: number;
  email: string;
  name: string;
  score: number;
  lastSubmitTime: string | null;
}

interface RoundState {
  status: 'waiting' | 'active' | 'completed';
  roundDuration: number;
  startedAt: string | null;
}

interface Stats {
  totalQuestions: number;
  totalParticipants: number;
}

export default function CtrlQuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roundDuration, setRoundDuration] = useState(30);

  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

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
        body: JSON.stringify({ ...newQuestion, options: validOptions }),
      });
      setNewQuestion({ questionText: '', options: ['', '', '', ''], correctIndex: 0 });
      fetchData();
    } catch {
      setError('Failed to add question');
    }
  };

  const handleStart = async () => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl('/ctrl-quiz/start'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ duration: roundDuration }),
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

  if (loading) return <PageLoader message="Loading Ctrl + Quiz..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Ctrl + Quiz" subtitle="Technical Shortcut Quiz - Fast-paced MCQ" />

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
          {error}
          <button onClick={() => setError('')} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 12h.01M9.09 9a3 3 0 115.82 0c0 1.657-1.343 3-3 3h-.5"
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
        </div>
      )}

      {/* Quiz Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Quiz Status</h3>
            <Badge
              variant={
                roundState?.status === 'active'
                  ? 'success'
                  : roundState?.status === 'completed'
                    ? 'purple'
                    : 'warning'
              }
            >
              {roundState?.status || 'waiting'}
            </Badge>
            {roundState?.startedAt && roundState.status === 'active' && (
              <span className="ml-2 text-sm text-gray-500">
                Duration: {roundState.roundDuration}m
              </span>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {roundState?.status !== 'active' && roundState?.status !== 'completed' && (
              <>
                <Input
                  type="number"
                  className="w-20"
                  value={roundDuration}
                  onChange={(e) => setRoundDuration(parseInt(e.target.value) || 30)}
                  placeholder="Mins"
                />
                <Button onClick={handleStart}>Start Quiz</Button>
              </>
            )}
            {roundState?.status === 'active' && (
              <>
                <Button variant="secondary" onClick={handlePause}>
                  Pause
                </Button>
                <Button variant="danger" onClick={handleEnd}>
                  End Quiz
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Add Question */}
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold">Add Question</h3>
        <Input
          placeholder="What is the shortcut for..."
          value={newQuestion.questionText}
          onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-2">
          {newQuestion.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={newQuestion.correctIndex === i}
                onChange={() => setNewQuestion({ ...newQuestion, correctIndex: i })}
              />
              <Input
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => {
                  const opts = [...newQuestion.options];
                  opts[i] = e.target.value;
                  setNewQuestion({ ...newQuestion, options: opts });
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAddQuestion}>Add Question</Button>
        </div>
      </Card>

      {/* Questions List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Questions ({questions.length})</h3>
        <div className="space-y-2">
          {questions.map((q) => (
            <div key={q.id} className="p-3 rounded-lg border border-gray-200">
              <p className="font-medium">{q.questionText}</p>
              <p className="text-sm text-gray-500">
                {q.options.map((o, i) => (
                  <span
                    key={i}
                    className={i === q.correctIndex ? 'text-emerald-600 font-medium' : ''}
                  >
                    {o}
                    {i < q.options.length - 1 ? ' | ' : ''}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Live Leaderboard</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((p, i) => (
              <tr key={p.id}>
                <td className="font-bold">{i + 1}</td>
                <td>{p.name}</td>
                <td>
                  <Badge variant="purple">{p.score}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
