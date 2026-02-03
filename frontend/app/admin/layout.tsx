'use client';

import { getApiUrl } from '@/lib/api';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import './admin.css';
import { Sidebar, Topbar } from './components/layout';
import { PageLoader } from './components/ui';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
  assignedEvents?: string[];
  tasks?: string[];
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on login page
  const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Skip auth check for login page
    if (isLoginPage) return;

    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/admin/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      router.push('/admin/login');
    }
  }, [pathname, router, isClient, isLoginPage]);

  useEffect(() => {
    if (!isClient || isLoginPage) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const syncProfile = async () => {
      try {
        const res = await fetch(getApiUrl('/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) return;

        const freshUser = await res.json();
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      } catch {
        // Ignore sync errors and fall back to local storage
      }
    };

    syncProfile();
  }, [isClient, isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/admin/login');
  };

  // Don't show layout on login page
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Wait for client-side hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-[var(--admin-bg-primary)] flex items-center justify-center">
        <PageLoader message="Initializing..." />
      </div>
    );
  }

  // Loading state - waiting for user data
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--admin-bg-primary)] flex items-center justify-center">
        <PageLoader message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f5ff 50%, #f0e8ff 100%)',
      }}
    >
      {/* Decorative background blobs */}
      <div
        className="fixed top-20 right-10 w-96 h-96 rounded-full opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(109, 64, 212, 0.15) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="fixed bottom-20 left-10 w-72 h-72 rounded-full opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Sidebar */}
      <Sidebar user={user} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:ml-64 min-h-screen flex flex-col relative z-10">
        {/* Topbar */}
        <Topbar
          user={user}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
