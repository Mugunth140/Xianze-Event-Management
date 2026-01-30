'use client';

import { apiRequest } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const EVENT_OPTIONS = [
  'Buildathon',
  'Bug Smash',
  'Paper Presentation',
  'Ctrl + Quiz',
  'Think & Link',
  'Gaming',
  'Code Hunt : Word Edition',
];

interface SpotFormData {
  name: string;
  email: string;
  course: string;
  branch: string;
  college: string;
  contact: string;
  event: string;
}

export default function SpotRegistrationPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState<SpotFormData>({
    name: '',
    email: '',
    course: '',
    branch: '',
    college: '',
    contact: '',
    event: '',
  });

  useEffect(() => {
    const loadState = async () => {
      try {
        const data = await apiRequest<{ success: boolean; enabled: boolean }>(
          '/spot-registration/state',
          { method: 'GET' }
        );
        setEnabled(Boolean(data.enabled));
      } catch {
        setEnabled(false);
      }
    };

    loadState();
  }, []);

  const handleChange = (field: keyof SpotFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSubmitStatus('idle');

    if (!enabled) {
      setSubmitStatus('error');
      setErrorMessage('Spot registration is currently closed.');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/spot-registration', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setSubmitStatus('success');
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (enabled === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-gray-600">
          Checking spot registration status...
        </div>
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-xl w-full rounded-3xl bg-white p-10 text-center shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Spot Registration Closed</h1>
          <p className="text-gray-600 mb-6">
            Spot registration is not open right now. Please contact the event desk for assistance.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-xl w-full rounded-3xl bg-white p-10 text-center shadow-sm border border-gray-200">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted</h1>
          <p className="text-gray-600 mb-6">
            Your spot registration is recorded. The team will verify and send your event pass email
            shortly.
          </p>
          <Link
            href="/events"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 mt-12">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-200 p-8 sm:p-10">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-3">Spot Registration</h1>
        <p className="text-center text-gray-600 mb-8">
          Fill in your details to register on the spot. payment will be collected at the
          registration desk.
        </p>

        {submitStatus === 'error' && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 mb-6">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => handleChange('course', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => handleChange('branch', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">College</label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => handleChange('college', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                value={formData.contact}
                onChange={(e) => handleChange('contact', e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
            <select
              value={formData.event}
              onChange={(e) => handleChange('event', e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="" disabled>
                Select an event
              </option>
              {EVENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Spot Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
