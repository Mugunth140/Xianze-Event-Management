'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

// Generate a unique visitor ID using fingerprinting
function generateVisitorId(): string {
  // Try to get existing visitor ID from localStorage
  if (typeof window !== 'undefined') {
    const existingId = localStorage.getItem('xianze_visitor_id');
    if (existingId) return existingId;
  }

  // Generate new visitor ID based on browser fingerprint
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  // Add random component for uniqueness
  const visitorId = `${Math.abs(hash).toString(36)}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

  // Store in localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('xianze_visitor_id', visitorId);
    } catch {
      // localStorage might be disabled
    }
  }

  return visitorId;
}

// Generate session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  try {
    const sessionData = sessionStorage.getItem('xianze_session');
    if (sessionData) {
      const { id, lastActive } = JSON.parse(sessionData);
      if (Date.now() - lastActive < SESSION_TIMEOUT) {
        // Update last active time
        sessionStorage.setItem('xianze_session', JSON.stringify({ id, lastActive: Date.now() }));
        return id;
      }
    }

    // Create new session
    const newSessionId = `s-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    sessionStorage.setItem(
      'xianze_session',
      JSON.stringify({ id: newSessionId, lastActive: Date.now() })
    );
    return newSessionId;
  } catch {
    return `s-${Date.now().toString(36)}`;
  }
}

// Detect device type
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return 'mobile';
  }
  return 'desktop';
}

// Parse browser name from user agent
function getBrowser(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR/')) return 'Opera';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'IE';

  return 'Other';
}

// Parse OS from user agent
function getOS(): string {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent;

  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS X')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';

  return 'Other';
}

// Track page view
async function trackPageView(path: string, referrer: string | null): Promise<void> {
  try {
    const payload = {
      visitorId: generateVisitorId(),
      sessionId: getSessionId(),
      path,
      referrer: referrer || document.referrer || null,
      userAgent: navigator.userAgent,
      browser: getBrowser(),
      os: getOS(),
      deviceType: getDeviceType(),
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
    };

    await fetch(`${API_URL}/analytics/visitors/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Use keepalive to ensure request completes even if page navigates away
      keepalive: true,
    });
  } catch {
    // Silently fail - analytics should never break the app
  }
}

// Update page duration
async function updateDuration(path: string, duration: number): Promise<void> {
  try {
    const payload = {
      visitorId: generateVisitorId(),
      sessionId: getSessionId(),
      path,
      duration: Math.round(duration),
    };

    await fetch(`${API_URL}/analytics/visitors/duration`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silently fail
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const pageEntryTime = useRef<number>(Date.now());
  const lastPathname = useRef<string>('');

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith('/admin')) return;

    const currentPath = pathname;
    const referrer = lastPathname.current || null;

    // Track page view
    trackPageView(currentPath, referrer);

    // Reset entry time
    pageEntryTime.current = Date.now();
    lastPathname.current = currentPath;

    // Send duration when leaving page
    const handleBeforeUnload = () => {
      const duration = (Date.now() - pageEntryTime.current) / 1000;
      if (duration > 1) {
        // Only track if user was on page for more than 1 second
        updateDuration(currentPath, duration);
      }
    };

    // Handle visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const duration = (Date.now() - pageEntryTime.current) / 1000;
        if (duration > 1) {
          updateDuration(currentPath, duration);
        }
      } else {
        // Reset entry time when tab becomes visible again
        pageEntryTime.current = Date.now();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Send duration when navigating to a different page
      const duration = (Date.now() - pageEntryTime.current) / 1000;
      if (duration > 1) {
        updateDuration(currentPath, duration);
      }
    };
  }, [pathname]);

  // This component doesn't render anything
  return null;
}
