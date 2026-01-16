import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Xianze 2026',
  description:
    'Get in touch with the Xianze 2026 team. Reach out to student coordinators for queries regarding events, registration, or venue details at KG College of Arts and Science, Coimbatore.',
  keywords: [
    'Contact Xianze',
    'Event Coordinators',
    'KG College Address',
    'Symposium Help',
    'Student Coordinators',
    'Coimbatore Tech Event Contact',
  ],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
