'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

interface CurrentQuestion {
  id: number;
  questionText: string;
  options: string[];
  timeLimit: number;
  startedAt: string;
}

interface Participant {
  id: number;
  email: string;
  name: string;
  round1Score: number;
}

export default function BugSmashEventPage() {
  const [email, setEmail] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; score: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // Fetch current state
  const fetchState = useCallback(async () => {
    try {
      const questionRes = await fetch(getApiUrl('/bug-smash/current-question'));
      const questionData = await questionRes.json();

      if (questionData.data) {
        const newQuestion = questionData.data as CurrentQuestion;

        // If it's a new question, reset state
        if (!currentQuestion || currentQuestion.id !== newQuestion.id) {
          setCurrentQuestion(newQuestion);
          setSelectedAnswer(null);
          setSubmitted(false);
          setLastResult(null);

          // Calculate time left
          const startTime = new Date(newQuestion.startedAt).getTime();
          const elapsed = (Date.now() - startTime) / 1000;
          setTimeLeft(Math.max(0, newQuestion.timeLimit - elapsed));
        }
      } else {
        setCurrentQuestion(null);
      }
    } catch {
      // Ignore polling errors
    }
  }, [currentQuestion]);

  // Poll for updates
  useEffect(() => {
    if (!participant) return;

    fetchState();
    const interval = setInterval(fetchState, 2000);
    return () => clearInterval(interval);
  }, [participant, fetchState]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleJoin = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setJoining(true);
    setError('');

    try {
      // Try to get existing registration data
      const regRes = await fetch(getApiUrl(`/register/email/${encodeURIComponent(email)}`));
      let name = email.split('@')[0];
      let phone = '';

      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.data) {
          name = regData.data.name || name;
          phone = regData.data.phone || '';
        }
      }

      // Join Bug Smash
      const joinRes = await fetch(getApiUrl('/bug-smash/join'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone }),
      });

      const joinData = await joinRes.json();
      if (joinData.success) {
        setParticipant(joinData.data);
      } else {
        setError('Failed to join. Please try again.');
      }
    } catch {
      setError('Failed to join. Please check your connection.');
    } finally {
      setJoining(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null || !currentQuestion || !participant) return;

    try {
      const res = await fetch(getApiUrl(`/bug-smash/submit/${currentQuestion.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          selectedIndex: selectedAnswer,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setLastResult(data.data);
        setParticipant((prev) => (prev ? { ...prev, round1Score: data.data.score } : null));
      } else {
        setError(data.message || 'Failed to submit');
      }
    } catch {
      setError('Failed to submit answer');
    }
  };

  // Join screen
  if (!participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🐛 Bug Smash</h1>
            <p className="text-gray-600 mt-2">Debugging Competition</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {joining ? 'Joining...' : 'Join Competition'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting screen
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Welcome, {participant.name}!</h1>
          <p className="text-xl text-gray-300 mb-8">Waiting for the round to start...</p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/10 rounded-xl">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span>Your Score: {participant.round1Score}</span>
          </div>
        </div>
      </div>
    );
  }

  // Question screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 text-white">
          <div>
            <span className="text-gray-400">Score:</span>{' '}
            <span className="font-bold text-2xl">{participant.round1Score}</span>
          </div>
          <div
            className={`text-3xl font-mono font-bold ${
              timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'
            }`}
          >
            {Math.floor(timeLeft)}s
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !submitted && setSelectedAnswer(index)}
                disabled={submitted}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                  submitted
                    ? lastResult?.isCorrect && selectedAnswer === index
                      ? 'border-green-500 bg-green-50'
                      : !lastResult?.isCorrect && selectedAnswer === index
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 opacity-50'
                    : selectedAnswer === index
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>
        </div>

        {/* Submit or Result */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null || timeLeft <= 0}
            className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Answer
          </button>
        ) : (
          <div
            className={`p-6 rounded-xl text-center ${
              lastResult?.isCorrect ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            <div className="text-4xl mb-2">{lastResult?.isCorrect ? '✅' : '❌'}</div>
            <p className="text-xl font-bold">{lastResult?.isCorrect ? 'Correct!' : 'Wrong!'}</p>
            <p className="opacity-80">Waiting for next question...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-center">{error}</div>
        )}
      </div>
    </div>
  );
}
