'use client';
import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
export default function SessionGuard() {
  useEffect(() => {
    const check = async () => { const response = await fetch('/api/session/check', { cache: 'no-store' }); if (response.status === 401) { await createClient().auth.signOut({ scope: 'local' }); window.location.href = '/login?reason=other-device'; } };
    const timer = window.setInterval(check, 15000); void check(); return () => window.clearInterval(timer);
  }, []);
  return null;
}
