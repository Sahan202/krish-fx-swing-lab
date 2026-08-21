'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import TurnstileWidget from '@/components/auth/turnstile-widget';

export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [badge, setBadge] = useState('1');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!turnstileToken) { setMessage('Please complete the security check first.'); return; }
    setLoading(true); setMessage('');
    try {
      const response = await fetch('/api/student-applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, email, whatsappNumber, badge: Number(badge), turnstileToken }) });
      const data = await response.json() as { error?: string };
      setMessage(response.ok ? 'Application submitted. Your details are now waiting for Super Admin approval.' : data.error ?? 'Could not submit your application.');
    } catch { setMessage('Could not submit your application. Please try again.'); }
    finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#07111f] px-5 py-10 text-white sm:px-6"><div className="mx-auto max-w-xl"><Link href="/login" className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200">← Back to sign in</Link><section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl shadow-black/25"><div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/10 to-transparent px-6 py-5 sm:px-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Create account</p><h1 className="mt-2 text-3xl font-bold">Start your learning journey</h1><p className="mt-3 leading-7 text-slate-400">Submit your details for Super Admin review. Login access is created after approval.</p></div><form onSubmit={submit} className="space-y-5 p-6 sm:p-8"><label className="block text-sm font-semibold text-slate-200">Full name *<input required minLength={2} maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Kasun Perera" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300" /></label><label className="block text-sm font-semibold text-slate-200">Email address *<input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300" /></label><label className="block text-sm font-semibold text-slate-200">WhatsApp number *<input required maxLength={25} value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="+94 71 123 4567" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300" /></label><label className="block text-sm font-semibold text-slate-200">Badge<select value={badge} onChange={(event) => setBadge(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300"><option value="1">Badge 1</option><option value="2">Badge 2</option><option value="3">Badge 3</option><option value="4">Badge 4</option></select></label><TurnstileWidget onToken={setTurnstileToken}/>{message && <p role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">{message}</p>}<button disabled={loading || !turnstileToken} className="w-full rounded-xl bg-cyan-400 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Submitting…' : 'Submit application'}</button><p className="text-center text-sm text-slate-400">Already approved? <Link href="/login" className="font-bold text-cyan-300">Sign in</Link></p></form></section></div></main>;
}
