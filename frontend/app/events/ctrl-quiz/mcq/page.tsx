'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

interface Question {
  id: number;
  questionText: string;
  options: string[];
  roundStartedAt: string;
  roundDuration: number;
  activeRound: number;
  status?: 'waiting' | 'active' | 'completed';
}

interface ShuffledOption {
  text: string;
  originalIndex: number;
}

interface SessionData {
  participantId: number;
  name: string;
  startedAt: number;
}

const SESSION_KEY = 'ctrl-quiz-session';
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export default function CtrlQuizMCQPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [roundComplete, setRoundComplete] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizNotActive, setQuizNotActive] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const teamName = session?.name || '';

  // Load session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const data: SessionData = JSON.parse(stored);
        const elapsed = Date.now() - data.startedAt;
        if (elapsed < SESSION_DURATION_MS) {
          setSession(data);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const shuffleOptions = (options: string[]) => {
    const shuffled = options.map((text, index) => ({ text, originalIndex: index }));
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Fetch next question when session is active
  const fetchNextQuestion = useCallback(async () => {
    if (!session) return;

    try {
      const res = await fetch(getApiUrl('/ctrl-quiz/next-question'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: session.participantId }),
      });

      const data = await res.json();

      if (!data.success && data.message === 'Quiz is not active') {
        setQuizNotActive(true);
        setCurrentQuestion(null);
        return;
      }

      setQuizNotActive(false);

      if (data.data === null) {
        const meta = data.meta || {};
        setActiveRound((prev) => meta.activeRound || prev || 1);
        setRoundComplete(true);
        setCurrentQuestion(null);
        if (meta.status === 'completed') {
          setQuizEnded(true);
        }
        if (meta.roundStartedAt && meta.roundDuration) {
          const startTime = new Date(meta.roundStartedAt).getTime();
          const endTime = startTime + meta.roundDuration * 60 * 1000;
          const remaining = Math.max(0, endTime - Date.now());
          setTimeRemaining(Math.floor(remaining / 1000));
        }
      } else {
        setRoundComplete(false);
        setQuizEnded(false);
        setCurrentQuestion(data.data);
        setActiveRound(data.data.activeRound || 1);
        setShuffledOptions(shuffleOptions(data.data.options || []));
        setSelectedAnswer(null);
        setSubmitted(false);

        // Calculate time remaining
        if (data.data.roundStartedAt && data.data.roundDuration) {
          const startTime = new Date(data.data.roundStartedAt).getTime();
          const endTime = startTime + data.data.roundDuration * 60 * 1000;
          const remaining = Math.max(0, endTime - Date.now());
          setTimeRemaining(Math.floor(remaining / 1000));
        }
      }
    } catch (err) {
      setError('Failed to load question');
    }
  }, [session]);

  useEffect(() => {
    if (session) {
      fetchNextQuestion();
    }
  }, [session, fetchNextQuestion]);

  useEffect(() => {
    if (!session || (!quizNotActive && !roundComplete)) return;
    const interval = setInterval(() => {
      fetchNextQuestion();
    }, 5000);
    return () => clearInterval(interval);
  }, [session, quizNotActive, roundComplete, fetchNextQuestion]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setRoundComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Join quiz
  const handleJoin = async () => {
    if (!name1.trim() || !name2.trim()) {
      setError('Both player names are required');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const combinedName = `${name1.trim()} & ${name2.trim()}`;
      const res = await fetch(getApiUrl('/ctrl-quiz/join'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: combinedName }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Failed to join quiz');
        return;
      }

      const sessionData: SessionData = {
        participantId: data.data.id,
        name: data.data.name,
        startedAt: Date.now(),
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      setSession(sessionData);
    } catch (err) {
      setError('Failed to join quiz. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  // Submit answer
  const handleSubmit = async () => {
    if (selectedAnswer === null || !currentQuestion || !session) return;

    const selectedOption = shuffledOptions[selectedAnswer];
    if (!selectedOption) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(getApiUrl(`/ctrl-quiz/submit/${currentQuestion.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: session.participantId,
          selectedIndex: selectedOption.originalIndex,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.message?.includes('Already submitted')) {
          fetchNextQuestion();
          return;
        }
        setError(data.message || 'Failed to submit answer');
        return;
      }

      setSubmitted(true);
      setQuestionsAnswered((prev) => prev + 1);

      // Wait a moment then load next question
      setTimeout(() => {
        fetchNextQuestion();
      }, 500);
    } catch (err) {
      setError('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Join form
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Ctrl + Quiz</h1>
            <p className="text-slate-500">Test your shortcut knowledge</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1">Player 1 *</label>
              <input
                type="text"
                value={name1}
                onChange={(e) => setName1(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="First player name"
              />
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1">Player 2 *</label>
              <input
                type="text"
                value={name2}
                onChange={(e) => setName2(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Second player name"
              />
            </div>
            <p className="text-sm text-slate-500">
              Enter both player names to join as a team. Up to 30 teams can participate.
            </p>
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-4 rounded-xl bg-slate-900 text-white font-semibold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Joining...
                </span>
              ) : (
                'Join Quiz'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz not active
  if (quizNotActive) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6">
            <svg
              className="w-10 h-10 text-amber-500"
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
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Quiz Not Active</h2>
          <p className="text-slate-600 text-lg mb-8">
            The quiz hasn&apos;t started yet. Please wait for the coordinator to begin.
          </p>
          <button
            onClick={fetchNextQuestion}
            className="px-8 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 transition-all"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz completed
  if (quizEnded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Quiz Completed!</h2>
          <p className="text-slate-600 text-lg mb-6">Great job, {teamName}!</p>
          <p className="text-slate-500 mb-8">Questions answered: {questionsAnswered}</p>
          <p className="text-slate-500 text-sm">Thanks for participating!</p>
        </div>
      </div>
    );
  }

  if (roundComplete) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 mb-6">
            <svg
              className="w-10 h-10 text-indigo-500"
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
          <h2 className="text-3xl font-bold text-slate-900 mb-3">Round {activeRound} Complete</h2>
          <p className="text-slate-600 text-lg mb-8">
            Please wait for the coordinator to start the next round.
          </p>
          <button
            onClick={fetchNextQuestion}
            className="px-8 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-100 transition-all"
          >
            Check Again
          </button>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="min-h-screen bg-slate-50 p-4">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center gap-3 mb-6 text-slate-600">
          <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold">
            {teamName ? teamName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div className="text-center">
            <p className="font-medium text-slate-900">{teamName}</p>
            <p className="text-xs text-slate-500">Round {activeRound}</p>
          </div>
          {timeRemaining !== null && (
            <div
              className={`px-4 py-2 rounded-lg font-mono font-bold ${
                timeRemaining < 60
                  ? 'bg-red-50 text-red-600 animate-pulse'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              ⏱ {formatTime(timeRemaining)}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Question Card */}
        {currentQuestion ? (
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-relaxed">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-3 mb-6">
              {shuffledOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !submitted && setSelectedAnswer(index)}
                  disabled={submitted}
                  className={`w-full p-4 rounded-2xl text-left font-medium transition-all border ${
                    selectedAnswer === index
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  } ${submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 mr-3 text-sm text-slate-600">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option.text}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={selectedAnswer === null || submitting || submitted}
              className="w-full py-4 rounded-xl bg-slate-900 text-white font-semibold text-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : submitted ? (
                'Loading next...'
              ) : (
                'Submit Answer'
              )}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-md">
            <div className="animate-spin w-12 h-12 border-4 border-slate-300 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-500">Loading question...</p>
          </div>
        )}
      </div>
    </div>
  );
}
