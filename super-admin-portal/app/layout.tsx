import './globals.css';
import type { ReactNode } from 'react';
import PortalSessionGuard from './portal-session-guard';
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body><PortalSessionGuard>{children}</PortalSessionGuard></body></html>; }
