'use client';

import { events } from '@/data/events';
import { apiRequest, createSubmitDebounce } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';

// Exclude fun games (Gaming) from certificate events
const certificateEvents = events.filter((e) => e.name !== 'Gaming');

const canSubmit = createSubmitDebounce(3000);

export default function CertificateComplaintPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    events: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleEventToggle = (eventName: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventName)
        ? prev.events.filter((e) => e !== eventName)
        : [...prev.events, eventName],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (formData.events.length === 0) {
      setError('Please select at least one event');
      return;
    }

    if (!canSubmit()) {
      setError('Please wait a few seconds before submitting again');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/certificates/complaints', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          events: formData.events,
        }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Request Submitted</h2>
          <p className="text-gray-400 mb-6">
            Your certificate request has been submitted successfully. We&apos;ll review it and get
            back to you soon.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/e-certificates"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all text-center"
            >
              Back to E-Certificates
            </Link>
            <Link href="/" className="text-gray-400 hover:text-gray-300 text-sm transition-colors">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 pt-24 pb-8 sm:px-6 lg:px-8 text-center">
          <Link
            href="/e-certificates"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to E-Certificates
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
            Request Certificate
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            If you haven&apos;t received your certificate for an event, fill out the form below and
            we&apos;ll look into it.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 pb-20 sm:px-6">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Registered Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-900/60 border border-gray-600/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                required
                autoComplete="email"
              />
            </div>

            {/* Events Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Select the event(s) you need the certificate for
              </label>
              <div className="space-y-2">
                {certificateEvents.map((event) => (
                  <label
                    key={event.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      formData.events.includes(event.name)
                        ? 'bg-violet-500/10 border-violet-500/40 text-white'
                        : 'bg-gray-900/40 border-gray-700/30 text-gray-300 hover:border-gray-600/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.name)}
                      onChange={() => handleEventToggle(event.name)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-violet-500 focus:ring-violet-500/30 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium">{event.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
