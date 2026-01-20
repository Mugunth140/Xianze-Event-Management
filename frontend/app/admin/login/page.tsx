'use client';

import { getApiUrl } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import '../admin.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Store token and user info
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 50%, #f0e8ff 100%)',
      }}
    >
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(109, 64, 212, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <div className="admin-glass-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 shadow-lg shadow-primary-500/25">
              <span className="text-white font-bold text-2xl">X</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Sign in to access the admin dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {error}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="admin-input"
                placeholder="Enter username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="admin-input"
                placeholder="Enter password"
              />
            </div>

            <button type="submit" disabled={loading} className="admin-btn admin-btn-primary w-full">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-400">
            XIANZE 2K26 • Technical Symposium
          </p>
        </div>
      </div>
    </div>
  );
}
