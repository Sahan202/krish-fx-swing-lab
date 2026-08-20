'use client';
import { useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase';
export default function StudentActions({ id }: { id: string }) {
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  async function request(path:string, method:string) { const { data:{session} }=await supabaseBrowser().auth.getSession(); return fetch(path,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token??''}`},body:JSON.stringify({id})}); }
  async function reset() { if (!window.confirm('Generate a new password for this student?')) return; setBusy(true); setMessage(''); const response = await request('/api/students/reset','POST'); const data = await response.json(); setMessage(response.ok ? `New password: ${data.password}${data.emailWarning ? ` · ${data.emailWarning}` : ' · Email sent.'}` : data.error); setBusy(false); }
  async function remove() { if (!window.confirm('Delete this student permanently? This cannot be undone.')) return; setBusy(true); setMessage(''); const response = await request('/api/students/delete','DELETE'); const data = await response.json(); if (response.ok) { setMessage('Student deleted.'); window.location.reload(); return; } setMessage(data.error); setBusy(false); }
  return <div className="flex flex-wrap gap-2"><button onClick={() => void reset()} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">{busy ? 'Working…' : 'Edit / reset password'}</button><button onClick={() => void remove()} disabled={busy} className="rounded-lg border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300">Delete student</button>{message && <span className="text-xs text-amber-300">{message}</span>}</div>;
}
