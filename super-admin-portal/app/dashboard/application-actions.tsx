'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Copy, ShieldCheck, X } from 'lucide-react';
import { supabaseBrowser } from '../../lib/supabase';

export default function ApplicationActions({ id, status }: { id: string; status: string }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  async function act(action: 'approve' | 'reject') {
    if (!window.confirm(action === 'approve' ? 'Approve this student and generate access?' : 'Reject this application and notify the student?')) return;
    setBusy(true); setMessage('');
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    const response = await fetch('/api/applications', { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` }, body: JSON.stringify({ id, action }) });
    const data = await response.json() as { error?: string; temporaryPassword?: string; emailWarning?: string };
    if (response.ok && action === 'approve') setGeneratedPassword(data.temporaryPassword ?? '');
    setMessage(response.ok ? action === 'approve' ? (data.emailWarning ?? 'Student approved and email sent.') : (data.emailWarning ?? 'Application rejected and email sent.') : (data.error ?? 'Could not update this application.'));
    setBusy(false);
  }

  if (status !== 'pending') return <span className="rounded-full border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs text-slate-400">Processed</span>;
  return <><div className="flex flex-wrap items-center justify-end gap-2"><div className="admin-approval-control"><span className="admin-approval-label">Student access</span><div className="relative"><ShieldCheck className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-cyan-200" /><select disabled={busy} defaultValue="" onChange={(event) => { const action = event.target.value as 'approve' | 'reject'; if (action) void act(action); event.target.value = ''; }} className="admin-action-select rounded-2xl border border-blue-300/50 bg-[#0b1b31] py-3 pl-11 pr-12 text-sm font-bold text-white outline-none shadow-lg shadow-blue-950/20 focus:border-blue-300"><option value="" disabled>{busy ? 'Updating access…' : 'Choose an action'}</option><option value="approve">Approve & generate access</option><option value="reject">Reject application</option></select><ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-cyan-100/70" /></div></div>{message && <span className="w-full rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2.5 text-xs text-amber-200">{message}</span>}</div>{generatedPassword && <div role="dialog" aria-modal="true" aria-label="Generated student password" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-5 backdrop-blur-sm"><section className="w-full max-w-md rounded-3xl border border-cyan-300/25 bg-[#071525] p-6 shadow-2xl shadow-black/50"><div className="flex items-start justify-between gap-4"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="size-6" /></span><button onClick={() => setGeneratedPassword('')} className="rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close password dialog"><X className="size-5" /></button></div><p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Student approved</p><h2 className="mt-2 text-2xl font-bold text-white">Temporary password created</h2><p className="mt-2 text-sm leading-6 text-slate-400">This password was sent to the student by email. Copy it only if you need to share it securely.</p><div className="mt-6 flex items-center gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.06] p-4"><code className="min-w-0 flex-1 break-all text-base font-bold tracking-wide text-cyan-100">{generatedPassword}</code><button onClick={() => void navigator.clipboard.writeText(generatedPassword)} className="grid size-10 shrink-0 place-items-center rounded-xl bg-cyan-400 text-slate-950 hover:bg-cyan-300" aria-label="Copy password"><Copy className="size-4" /></button></div><button onClick={() => setGeneratedPassword('')} className="mt-6 w-full rounded-xl border border-white/10 py-3 text-sm font-bold text-white hover:bg-white/5">Done</button></section></div>}</>;
}
