import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@/index.css';
import SiteNav from '@/components/layout/site-nav';
import ThemeToggle from '@/components/layout/theme-toggle';
import SessionGuard from '@/components/layout/session-guard';
import SiteChrome from '@/components/layout/site-chrome';
import ThemeInitializer from '@/components/layout/theme-initializer';

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
    <html lang="en">
      <body><ThemeInitializer /><SessionGuard /><SiteChrome><SiteNav /><div className="fixed bottom-5 right-5 z-50"><ThemeToggle /></div></SiteChrome>{children}</body>
    </html>
  );
}
