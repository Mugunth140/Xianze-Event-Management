import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events | XIANZE',
  description:
    'Explore all events at XIANZE - Technical challenges, competitions, and fun activities',
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="events-layout">
      {/* 
        TODO: Add events navigation/header here
        - Event category filters
        - Search functionality
        - Registration status indicator
      */}
      {children}
    </div>
  );
}
