'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '../lib/supabase';

export default function PortalSessionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [ready, setReady] = useState(pathname === '/login' || pathname === '/');
  useEffect(() => { void (async () => {
    if (pathname === '/login' || pathname === '/') { setReady(true); return; }
    const client = supabaseBrowser(); const { data: { user } } = await client.auth.getUser();
    if (!user) { router.replace('/login'); return; }
    const { data: { session } } = await client.auth.getSession(); const response = await fetch('/api/portal-access', { headers: { Authorization: `Bearer ${session?.access_token ?? ''}` } });
    if (!response.ok) { await client.auth.signOut(); router.replace('/login'); return; }
    const access = await response.json() as { role: string; permissions: { manage_students: boolean; manage_content: boolean; manage_applications: boolean; view_reports: boolean } };
    if (access.role === 'admin') {
      const permissions = access.permissions;
      const allowed = pathname === '/students' ? permissions?.manage_students : pathname === '/content' ? permissions?.manage_content : pathname === '/reports' ? permissions?.view_reports : true;
      if (!allowed) { router.replace('/dashboard'); return; }
    }
    setReady(true);
  })(); }, [pathname, router]);
  if (!ready) return <main className="grid min-h-screen place-items-center text-sm text-slate-400">Checking secure Super Admin session…</main>;
  return <>{children}</>;
}
