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
    const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') { await client.auth.signOut(); router.replace('/login'); return; }
    setReady(true);
  })(); }, [pathname, router]);
  if (!ready) return <main className="grid min-h-screen place-items-center text-sm text-slate-400">Checking secure Super Admin session…</main>;
  return <>{children}</>;
}
