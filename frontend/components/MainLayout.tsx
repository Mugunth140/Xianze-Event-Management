'use client';

import AnalyticsTracker from '@/components/AnalyticsTracker';
import ErrorBoundary from '@/components/ErrorBoundary';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary>
      <AnalyticsTracker />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </ErrorBoundary>
  );
}
