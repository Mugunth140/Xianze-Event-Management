'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { getApiUrl } from '@/lib/api';

export default function PaperSubmissionPage() {
  const [formData, setFormData] = useState({
    member1: '',
    member2: '',
    college: '',
    topic: '',
    phone: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!file) {
      setError('Please upload your presentation slides');
      setLoading(false);
      return;
    }

    const data = new FormData();
    data.append('member1', formData.member1);
    data.append('member2', formData.member2);
    data.append('college', formData.college);
    data.append('topic', formData.topic);
    data.append('phone', formData.phone);
    data.append('slides', file);

    try {
      const res = await fetch(getApiUrl('/paper-presentation/submit'), {
        method: 'POST',
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Submission failed');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-600"
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
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Submission Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your paper has been submitted successfully. You will be notified about the presentation
            schedule.
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Paper Presentation Submission
          </h1>
          <p className="text-gray-600">
            Submit your research paper for XIANZE 2K26 Paper Presentation event
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700 border border-amber-200">
              PDF/PPT/PPTX only — ready for slideshow
            </span>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-1.5 text-sm font-semibold text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors"
            >
              View event rules →
            </Link>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600">
              {error}
            </div>
          )}

          {/* Team Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Member 1 Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.member1}
                onChange={(e) => setFormData({ ...formData, member1: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="First member name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Member 2 Name (Optional)
              </label>
              <input
                type="text"
                value={formData.member2}
                onChange={(e) => setFormData({ ...formData, member2: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Second member name"
              />
            </div>
          </div>

          {/* College */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              College Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.college}
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Your college/university name"
            />
          </div>

          {/* Paper Topic */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Paper Topic / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Enter your paper topic"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Your phone number"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Presentation Slides <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept=".ppt,.pptx,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                </div>
                {file ? (
                  <p className="text-primary-600 font-medium">{file.name}</p>
                ) : (
                  <p className="text-gray-500">Click to upload PDF, PPT or PPTX (max 15MB)</p>
                )}
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              For best presentation experience, we recommend uploading a <strong>PDF</strong>.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Paper'
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          One submission per team. Contact support if you need to update your submission.
        </p>
      </div>
    </div>
  );
}
