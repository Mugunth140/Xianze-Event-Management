'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
  assignedEvents?: string[];
  tasks?: string[];
}

interface UseAuthReturn {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoordinator: boolean;
  isMember: boolean;
  logout: () => void;
  hasPermission: (requiredRole: 'admin' | 'coordinator' | 'member') => boolean;
}

export default function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid stored data, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    router.push('/admin/login');
  }, [router]);

  const hasPermission = useCallback(
    (requiredRole: 'admin' | 'coordinator' | 'member') => {
      if (!user) return false;

      const roleHierarchy = { admin: 3, coordinator: 2, member: 1 };
      return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    },
    [user]
  );

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isCoordinator: user?.role === 'coordinator',
    isMember: user?.role === 'member',
    logout,
    hasPermission,
  };
}
