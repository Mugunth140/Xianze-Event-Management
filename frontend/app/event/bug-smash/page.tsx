'use client';

import { getApiUrl } from '@/lib/api';
import { useCallback, useEffect, useState } from 'react';

interface NextQuestion {
  id: number;
  questionText: string;
  options: string[];
  roundStartedAt: string;
  roundDuration: number; // minutes
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
  const [currentQuestion, setCurrentQuestion] = useState<NextQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundEnded, setRoundEnded] = useState(false);
  const [waitingForRound, setWaitingForRound] = useState(false);

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(false);

  // Fetch next question
  const fetchNextQuestion = useCallback(async () => {
    if (!participant) return;
    setLoadingQuestion(true);
    setSubmitted(false);
    setSelectedAnswer(null);

    try {
      const res = await fetch(getApiUrl('/bug-smash/next-question'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: participant.id }),
      });
      const data = await res.json();

      if (data.data) {
        setWaitingForRound(false);
        const question = data.data as NextQuestion;
        setCurrentQuestion(question);

        // Calculate global time left
        const startTime = new Date(question.roundStartedAt).getTime();
        const durationMs = question.roundDuration * 60 * 1000;
        const endTime = startTime + durationMs;
        const remaining = (endTime - Date.now()) / 1000;

        if (remaining <= 0) {
          setRoundEnded(true);
          setCurrentQuestion(null);
        } else {
          setTimeLeft(remaining);
        }
      } else if (data.message === 'Round is not active') {
        setWaitingForRound(true);
        setCurrentQuestion(null);
      } else {
        // No more questions or round ended
        setCurrentQuestion(null);
        if (!waitingForRound) {
          // check if we are just done with questions or round inactive
          // relying on data.data being null usually means done with ALL questions
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingQuestion(false);
    }
  }, [participant, waitingForRound]);

  // Initial fetch on join
  useEffect(() => {
    if (participant && !currentQuestion && !roundEnded) {
      fetchNextQuestion();
    }
  }, [participant, currentQuestion, roundEnded, fetchNextQuestion]);

  // Poll while waiting for round
  useEffect(() => {
    if (!waitingForRound) return;
    const interval = setInterval(fetchNextQuestion, 5000);
    return () => clearInterval(interval);
  }, [waitingForRound, fetchNextQuestion]);

  // Global Timer
  useEffect(() => {
    if (timeLeft <= 0 || roundEnded) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setRoundEnded(true);
          setCurrentQuestion(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, roundEnded]);

  const handleJoin = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setJoining(true);
    setError('');

    try {
      // Try to get existing registration
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

    setSubmitted(true); // optimistically disable

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
        // Fetch next Immediately
        fetchNextQuestion();
      } else {
        setError(data.message || 'Failed to submit');
        setSubmitted(false);
      }
    } catch {
      setError('Failed to submit answer');
      setSubmitted(false);
    }
  };

  // 1. Join Screen
  if (!participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🐛 Bug Smash</h1>
            <p className="text-gray-600 mt-2">Exam Mode</p>
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
              {joining ? 'Joining...' : 'Join Exam'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Waiting for Round Start
  if (waitingForRound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Welcome, {participant.name}</h1>
          <p className="text-xl text-gray-300 mb-8 animate-pulse">
            Waiting for admin to start the round...
          </p>
        </div>
      </div>
    );
  }

  // 3. Round Ended / All Done
  if (roundEnded || (!currentQuestion && !loadingQuestion)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-6">🎉 Round Completed!</h1>
          <p className="text-xl text-gray-300">You have finished the exam or time has run out.</p>
          <p className="mt-4 text-gray-400">Please wait for the results.</p>
        </div>
      </div>
    );
  }

  // 4. Question Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6 text-white">
          <div>
            <span className="text-gray-400">Participant:</span>{' '}
            <span className="font-bold">{participant.name}</span>
          </div>
          <div
            className={`text-2xl font-mono font-bold ${timeLeft <= 60 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}
          >
            ⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>

        {currentQuestion && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 break-words">
              {currentQuestion.questionText}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => !submitted && setSelectedAnswer(index)}
                  disabled={submitted}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                    selectedAnswer === index
                      ? 'border-primary-600 bg-primary-50 ring-1 ring-primary-600'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${submitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + index)}.</span>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null || submitted}
          className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitted ? 'Saving...' : 'Submit & Next'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-center">{error}</div>
        )}
      </div>
    </div>
  );
}
