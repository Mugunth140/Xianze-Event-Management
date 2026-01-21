'use client';

import { useEffect, useState } from 'react';
import Badge from '../ui/Badge';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'coordinator' | 'member';
  assignedEvent?: string;
}

interface TopbarProps {
  user: User;
  onMenuClick: () => void;
  onLogout: () => void;
}

export default function Topbar({ user, onMenuClick, onLogout }: TopbarProps) {
  const [projectorMode, setProjectorMode] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    // Load projector mode preference
    const saved = localStorage.getItem('projectorMode');
    if (saved === 'true') {
      setProjectorMode(true);
      document.documentElement.classList.add('projector-mode');
    }

    // Update time every second
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleProjectorMode = () => {
    const newValue = !projectorMode;
    setProjectorMode(newValue);
    localStorage.setItem('projectorMode', String(newValue));
    if (newValue) {
      document.documentElement.classList.add('projector-mode');
    } else {
      document.documentElement.classList.remove('projector-mode');
    }
  };

  return (
    <header className="admin-topbar sticky top-0 z-20 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left side - Menu & Role */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Role indicator */}
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant={user.role} dot>
              {user.role}
            </Badge>
            {user.role === 'coordinator' && user.assignedEvent && (
              <Badge variant="purple">{user.assignedEvent}</Badge>
            )}
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Time display */}
          <span className="hidden md:block text-sm font-medium text-gray-500">{currentTime}</span>

          {/* Projector mode toggle */}
          <button
            onClick={toggleProjectorMode}
            className={`p-2 rounded-lg transition-colors ${
              projectorMode
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-500 hover:text-primary-600 hover:bg-primary-50'
            }`}
            title={projectorMode ? 'Disable projector mode' : 'Enable projector mode'}
            aria-label="Toggle projector mode"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
