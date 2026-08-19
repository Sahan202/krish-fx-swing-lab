'use client';
import { useEffect } from 'react';
import { supabaseBrowser } from '../../lib/supabase';

export default function ActivityTracker() {
  useEffect(() => { void (async () => { const { data: { session } } = await supabaseBrowser().auth.getSession(); if (!session?.access_token) return; const response = await fetch('/api/audit/login', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } }); if (!response.ok) console.error('Audit login tracking failed:', await response.text()); })(); }, []);
  return null;
}
