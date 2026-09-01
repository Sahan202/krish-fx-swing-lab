import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/index.css';
import SiteNav from '@/components/layout/site-nav';
import SessionGuard from '@/components/layout/session-guard';
import SiteChrome from '@/components/layout/site-chrome';

export const metadata: Metadata = {
  title: 'Krish FX Swing Lab',
  description: 'Master the markets with a clear, structured swing trading system.',
  icons: {
    icon: '/krish-fx-logo.jpeg',
    shortcut: '/krish-fx-logo.jpeg',
    apple: '/krish-fx-logo.jpeg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="theme-dark">
      <body><SessionGuard /><SiteChrome><SiteNav /></SiteChrome>{children}</body>
    </html>
  );
}
