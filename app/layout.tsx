import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/index.css';
import SiteNav from '@/components/layout/site-nav';
import ThemeToggle from '@/components/layout/theme-toggle';
import SessionGuard from '@/components/layout/session-guard';

export const metadata: Metadata = {
  title: 'Krish FX Swing Lab',
  description: 'Master the markets with a clear, structured swing trading system.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><SessionGuard /><SiteNav />{children}<div className="fixed bottom-5 right-5 z-50"><ThemeToggle /></div></body>
    </html>
  );
}
