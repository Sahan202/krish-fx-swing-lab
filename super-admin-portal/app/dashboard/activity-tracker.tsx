'use client';
import { useEffect } from 'react';
import { supabaseBrowser } from '../../lib/supabase';

export default function ActivityTracker() {
  useEffect(() => { void (async () => { const { data: { session } } = await supabaseBrowser().auth.getSession(); if (!session?.access_token) return; await fetch('/api/audit/login', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } }); })(); }, []);
  return null;
}
