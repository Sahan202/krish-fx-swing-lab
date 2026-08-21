import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import PortalSessionGuard from './portal-session-guard';

export const metadata: Metadata = { title: 'Krish FX Admin Studio', icons: { icon: '/krish-fx-logo.jpeg', shortcut: '/krish-fx-logo.jpeg', apple: '/krish-fx-logo.jpeg' } };
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body><PortalSessionGuard>{children}</PortalSessionGuard></body></html>; }
