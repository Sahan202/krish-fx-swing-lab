'use client';
import { useState } from 'react';
export default function StudentActions({ id }: { id: string }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function reset() {
    if (!window.confirm('Generate a new password for this student?')) return;
    setBusy(true); setMessage('');
    const response = await fetch('/api/students/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const data = await response.json(); setMessage(response.ok ? `New password: ${data.password}` : data.error); setBusy(false);
  }
  async function remove() {
    if (!window.confirm('Delete this student permanently? This cannot be undone.')) return;
    setBusy(true); setMessage('');
    const response = await fetch('/api/students/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (response.ok) { setMessage('Student deleted.'); window.location.reload(); return; }
    setMessage(data.error); setBusy(false);
  }
  return <div className="flex flex-wrap gap-2"><button onClick={() => void reset()} disabled={busy} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white">{busy ? 'Working…' : 'Edit / reset password'}</button><button onClick={() => void remove()} disabled={busy} className="rounded-lg border border-red-400/50 px-3 py-2 text-xs font-bold text-red-300">Delete student</button>{message && <span className="text-xs text-amber-300">{message}</span>}</div>;
}
