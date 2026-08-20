import './globals.css';
import type { ReactNode } from 'react';
import PortalSessionGuard from './portal-session-guard';
import LogoutButton from './logout-button';
export default function RootLayout({ children }: { children: ReactNode }) { return <html lang="en"><body><PortalSessionGuard><LogoutButton />{children}</PortalSessionGuard></body></html>; }
