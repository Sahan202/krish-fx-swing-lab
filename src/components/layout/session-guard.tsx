'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
export default function SessionGuard() {
  useEffect(() => {
    let checking = false;
    const check = async () => { if (checking || ['/login', '/signup'].includes(window.location.pathname)) return; checking = true; try { const response = await fetch('/api/session/check', { cache: 'no-store' }); if (response.status === 401 && window.location.pathname !== '/login') { await createClient().auth.signOut({ scope: 'local' }); window.location.replace('/login?reason=other-device'); } } finally { checking = false; } };
    const onVisibility = () => { if (!document.hidden) void check(); };
    const timer = window.setInterval(check, 3000);
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', onVisibility);
    void check(); return () => { window.clearInterval(timer); window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  return null;
}
