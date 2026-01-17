import ErrorBoundary from '@/components/ErrorBoundary';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import type { Metadata, Viewport } from 'next';
import { DM_Sans, Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'Xianze 2026',
    template: '%s | Xianze 2026',
  },
  description:
    'Xianze is a Technical Symposium hosted by KG College of Arts and Science. Join us for a day of technical events, workshops, and innovation.',
  keywords: [
    'Xianze',
    'Xianze 2026',
    'Technical Symposium',
    'KG College of Arts and Science',
    'KGCAS',
    'Coimbatore Events',
    'College Symposium',
    'Student Events',
    'Coding Competition',
    'Hackathon',
    'Technical Workshops',
  ],
  authors: [{ name: 'Xianze Team', url: 'https://xianze.tech' }],
  creator: 'mugunth140',
  publisher: 'mugunth140',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  metadataBase: new URL('https://xianze.tech'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Xianze 2026',
    description:
      'Join the ultimate inter-collegiate tech symposium. Compete, collaborate, and showcase your skills across coding, design, and innovation challenges.',
    url: 'https://xianze.tech',
    siteName: 'Xianze 2026',
    images: [
      {
        url: '/favicon/web-app-manifest-512x512.png',
        width: 1200,
        height: 630,
        alt: 'Xianze 2026 Symposium',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Xianze 2026 | National Level Technical Symposium',
    description:
      'Join the ultimate inter-collegiate tech symposium at KG College of Arts and Science.',
    creator: '@mugunth140',
    images: ['/favicon/web-app-manifest-512x512.png'],
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.ico' },
      { url: '/favicon/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [{ url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      {
        rel: 'manifest',
        url: '/favicon/site.webmanifest',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${dmSans.variable}`}>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ErrorBoundary>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: 'Xianze 2026',
                url: 'https://xianze.tech',
                potentialAction: {
                  '@type': 'SearchAction',
                  target: 'https://xianze.tech/events?q={search_term_string}',
                  'query-input': 'required name=search_term_string',
                },
              },
              {
                '@context': 'https://schema.org',
                '@type': 'SiteNavigationElement',
                name: ['Register', 'Events', 'Contact', 'FAQ'],
                url: [
                  'https://xianze.tech/register',
                  'https://xianze.tech/events',
                  'https://xianze.tech/contact',
                  'https://xianze.tech/faq',
                ],
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Event',
                name: 'Xianze 2026',
                startDate: '2026-03-15',
                endDate: '2026-03-15',
                eventStatus: 'https://schema.org/EventScheduled',
                eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
                location: {
                  '@type': 'Place',
                  name: 'KG College of Arts and Science',
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'KG Campus, Saravanampatti',
                    addressLocality: 'Coimbatore',
                    postalCode: '641035',
                    addressRegion: 'Tamil Nadu',
                    addressCountry: 'IN',
                  },
                },
                image: ['https://xianze.tech/favicon/web-app-manifest-512x512.png'],
                description:
                  'National Level Technical Symposium hosted by KG College of Arts and Science featuring coding competitions, hackathons, and technical workshops.',
                organizer: {
                  '@type': 'Organization',
                  name: 'mugunth140',
                  url: 'https://xianze.tech',
                },
              },
            ]),
          }}
        />
      </body>
    </html>
  );
}
