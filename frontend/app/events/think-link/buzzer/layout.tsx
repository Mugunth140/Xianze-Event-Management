import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Think & Link Buzzer',
  description: 'Real-time buzzer for Think & Link quiz rounds - XIANZE 2026',
};

export default function BuzzerLayout({ children }: { children: React.ReactNode }) {
  // Minimal layout for buzzer - no navbar/footer
  return <>{children}</>;
}
