'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/signup' || pathname.startsWith('/auth/')) return null;
  return <>{children}</>;
}
