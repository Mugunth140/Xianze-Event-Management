import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'E-Certificates',
  description: 'Download your Xianze 2026 event participation certificates',
};

export default function ECertificatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
