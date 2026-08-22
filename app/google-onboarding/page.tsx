'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronLeft, Clock3, Mail, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type PageState = 'loading' | 'form' | 'submitted' | 'error';

export default function GoogleOnboardingPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [badge, setBadge] = useState('1');
  const [state, setState] = useState<PageState>('loading');
  const [message, setMessage] = useState('Preparing your Google account…');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const client = createClient();
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user?.email) {
        setMessage('Your Google sign-in session has expired. Please return to login and try again.');
        setState('error');
        return;
      }
      const { data: profile } = await client.from('profiles').select('approval_status,role,full_name,whatsapp_number,badge').eq('id', user.id).maybeSingle();
      if (profile?.approval_status === 'approved') {
        const started = await fetch('/api/session/register', { method: 'POST' });
        if (started.ok) { window.location.replace(profile.role === 'admin' ? '/super-admin' : '/dashboard'); return; }
        setMessage('Could not start your secure session. Please try again.'); setState('error'); return;
      }
      if (profile?.approval_status === 'rejected') {
        await client.auth.signOut({ scope: 'local' });
        setMessage('Your application was not approved. Please contact support.'); setState('error'); return;
      }
      setEmail(user.email);
      setFullName(profile?.full_name || String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''));
      setWhatsappNumber(profile?.whatsapp_number ?? '');
      setBadge(String(profile?.badge ?? 1));
      setMessage(''); setState('form');
    })();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (fullName.trim().length < 2 || whatsappNumber.trim().length < 7) { setMessage('Please enter your full name and a valid WhatsApp number.'); return; }
    setSubmitting(true); setMessage('');
    try {
      const response = await fetch('/api/google-onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fullName, whatsappNumber, badge: Number(badge) }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) { setMessage(data.error ?? 'Could not submit your application.'); return; }
      await createClient().auth.signOut({ scope: 'local' });
      setState('submitted');
    } catch { setMessage('Could not submit your application. Check your connection and try again.'); }
    finally { setSubmitting(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-[#07111f] px-5 py-10 text-white sm:px-6"><section className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl shadow-black/30"><div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/10 to-transparent px-6 py-5 sm:px-8"><Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-cyan-300 transition hover:text-cyan-200"><ChevronLeft className="size-4" /> Back to sign in</Link></div><div className="p-6 sm:p-8">{state === 'loading' && <div className="py-12 text-center"><div className="mx-auto size-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" /><p className="mt-5 text-sm text-slate-300">{message}</p></div>}{state === 'submitted' && <div className="py-7 text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300"><CheckCircle2 className="size-8" /></span><p className="mt-7 text-xs font-bold uppercase tracking-[.2em] text-emerald-300">Application received</p><h1 className="mt-3 text-3xl font-bold">Thanks, we have your details.</h1><p className="mx-auto mt-4 max-w-md leading-7 text-slate-300">Your application is now waiting for Super Admin approval. Once approved, sign in again with the same Google account to open your learning dashboard.</p><div className="mx-auto mt-7 flex max-w-md items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-left text-sm text-amber-100"><Clock3 className="mt-0.5 size-5 shrink-0 text-amber-300" />Your course access stays locked until approval is complete.</div><Link href="/login" className="mt-7 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Return to sign in</Link></div>}{state === 'error' && <div className="py-7 text-center"><span className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-400/10 text-rose-300"><ShieldCheck className="size-8" /></span><h1 className="mt-6 text-2xl font-bold">Google sign-in needs attention</h1><p className="mt-3 leading-7 text-slate-300">{message}</p><Link href="/login" className="mt-7 inline-flex rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950">Back to sign in</Link></div>}{state === 'form' && <><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Google account application</p><h1 className="mt-3 text-3xl font-bold">Complete your student details</h1><p className="mt-3 leading-7 text-slate-400">Your Google account is connected. Fill in these details and send them to the Super Admin for approval.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-semibold text-slate-200">Full name *<input required minLength={2} maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Kasun Perera" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300" /></label><label className="block text-sm font-semibold text-slate-200">Google email <span className="text-slate-500">(verified)</span><span className="relative mt-2 flex"><Mail className="pointer-events-none absolute left-4 top-3.5 size-4 text-slate-500" /><input readOnly value={email} className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-slate-400" /></span></label><label className="block text-sm font-semibold text-slate-200">WhatsApp number *<input required minLength={7} maxLength={25} value={whatsappNumber} onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="+94 71 123 4567" className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300" /></label><label className="block text-sm font-semibold text-slate-200">Batch<select value={badge} onChange={(event) => setBadge(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-cyan-300"><option value="1">1st Batch</option><option value="2">2nd Batch</option><option value="3">3rd Batch</option><option value="4">4th Batch</option></select></label>{message && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">{message}</p>}<button disabled={submitting || !email} className="w-full rounded-xl bg-cyan-400 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Sending application…' : 'Submit for Super Admin approval'}</button></form></>}</div></section></main>;
}
