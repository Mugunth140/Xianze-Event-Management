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
  timeLimit: number;
  order: number;
}

interface Participant {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  round1Score: number;
  lastSubmitTime: string | null;
  round2Status: 'pending' | 'qualified' | 'eliminated';
  round3Rank: number | null;
  round3Score: number | null;
}

interface RoundState {
  round1Status: 'waiting' | 'active' | 'completed';
  currentQuestionId: number | null;
  questionStartedAt: string | null;
}

interface Stats {
  totalQuestions: number;
  totalParticipants: number;
  qualified: number;
  eliminated: number;
}

type Tab = 'round1' | 'round2' | 'round3';

export default function BugSmashPage() {
  const [activeTab, setActiveTab] = useState<Tab>('round1');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [roundState, setRoundState] = useState<RoundState | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New question form
  const [newQuestion, setNewQuestion] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    timeLimit: 30,
  });

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const [questionsRes, leaderboardRes, stateRes, statsRes] = await Promise.all([
        fetch(getApiUrl('/bug-smash/questions'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/bug-smash/leaderboard')),
        fetch(getApiUrl('/bug-smash/state'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl('/bug-smash/stats'), { headers: { Authorization: `Bearer ${token}` } }),
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
    // Poll for updates every 5 seconds during active round
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
      await fetch(getApiUrl('/bug-smash/questions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...newQuestion,
          options: validOptions,
        }),
      });
      setNewQuestion({
        questionText: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        timeLimit: 30,
      });
      fetchData();
    } catch {
      setError('Failed to add question');
    }
  };

  const handleStartRound = async () => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl('/bug-smash/round1/start'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleEndRound = async () => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl('/bug-smash/round1/end'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleSetCurrentQuestion = async (id: number) => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/bug-smash/round1/question/${id}`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchData();
  };

  const handleRound2Status = async (id: number, status: 'qualified' | 'eliminated') => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/bug-smash/round2/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchData();
  };

  const handleRound3Result = async (id: number, rank: number) => {
    const token = localStorage.getItem('token');
    await fetch(getApiUrl(`/bug-smash/round3/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rank }),
    });
    fetchData();
  };

  if (loading) return <PageLoader message="Loading Bug Smash..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Bug Smash" subtitle="Debugging competition - MCQ Round + Manual Finals" />

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<span className="text-2xl">❓</span>}
            value={stats.totalQuestions}
            label="Questions"
            iconColor="text-primary-600"
          />
          <StatCard
            icon={<span className="text-2xl">👥</span>}
            value={stats.totalParticipants}
            label="Participants"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<span className="text-2xl">✅</span>}
            value={stats.qualified}
            label="Qualified"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={<span className="text-2xl">❌</span>}
            value={stats.eliminated}
            label="Eliminated"
            iconColor="text-red-500"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['round1', 'round2', 'round3'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            {tab === 'round1'
              ? 'Round 1 (MCQ)'
              : tab === 'round2'
                ? 'Round 2 (Shortlist)'
                : 'Round 3 (Finals)'}
          </button>
        ))}
      </div>

      {/* Round 1 - MCQ */}
      {activeTab === 'round1' && (
        <div className="space-y-6">
          {/* Round Controls */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Round Status</h3>
                <Badge variant={roundState?.round1Status === 'active' ? 'success' : 'warning'}>
                  {roundState?.round1Status || 'waiting'}
                </Badge>
              </div>
              <div className="flex gap-2">
                {roundState?.round1Status !== 'active' ? (
                  <Button onClick={handleStartRound}>Start Round 1</Button>
                ) : (
                  <Button variant="danger" onClick={handleEndRound}>
                    End Round 1
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Add Question */}
          <Card className="p-4 space-y-4">
            <h3 className="font-semibold">Add Question</h3>
            <Input
              placeholder="Question text..."
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
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600">Time (s):</label>
              <Input
                type="number"
                className="w-20"
                value={newQuestion.timeLimit}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, timeLimit: parseInt(e.target.value) || 30 })
                }
              />
              <Button onClick={handleAddQuestion}>Add Question</Button>
            </div>
          </Card>

          {/* Questions List */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Questions ({questions.length})</h3>
            <div className="space-y-2">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className={`p-3 rounded-lg border ${
                    roundState?.currentQuestionId === q.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
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
                    {roundState?.round1Status === 'active' && (
                      <Button size="sm" onClick={() => handleSetCurrentQuestion(q.id)}>
                        Show
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Leaderboard</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((p, i) => (
                  <tr key={p.id}>
                    <td className="font-bold">{i + 1}</td>
                    <td>{p.name}</td>
                    <td>
                      <Badge variant="purple">{p.round1Score}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Round 2 - Shortlist */}
      {activeTab === 'round2' && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Shortlist Participants</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((p, i) => (
                <tr key={p.id}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.round1Score}</td>
                  <td>
                    <Badge
                      variant={
                        p.round2Status === 'qualified'
                          ? 'success'
                          : p.round2Status === 'eliminated'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {p.round2Status}
                    </Badge>
                  </td>
                  <td className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRound2Status(p.id, 'qualified')}
                    >
                      ✅
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRound2Status(p.id, 'eliminated')}
                    >
                      ❌
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Round 3 - Finals */}
      {activeTab === 'round3' && (
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Final Results (Qualified Only)</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Final Rank</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard
                .filter((p) => p.round2Status === 'qualified')
                .map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      {p.round3Rank ? (
                        <Badge variant="purple">#{p.round3Rank}</Badge>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {[1, 2, 3].map((rank) => (
                          <Button
                            key={rank}
                            size="sm"
                            variant={p.round3Rank === rank ? 'primary' : 'secondary'}
                            onClick={() => handleRound3Result(p.id, rank)}
                          >
                            #{rank}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
