'use client';

import { CalendarDays, ExternalLink, Video } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Session = { id: string; title: string; status: 'scheduled' | 'live'; scheduled_at: string | null; courses?: { title: string } | null };

export default function LiveClassroom() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState('');
  useEffect(() => {
    fetch('/api/live').then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load live classes.');
      setSessions(data.sessions ?? []);
    }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Could not load live classes.'));
  }, []);

  return <main className="live-premium min-h-screen bg-[#07111f] px-5 py-8 text-white sm:px-8 sm:py-10"><div className="live-shell mx-auto max-w-6xl">
    <div className="live-hero flex flex-wrap items-center justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Protected Zoom access</p><h1 className="mt-2 text-3xl font-bold">Live classes</h1><p className="mt-2 text-sm text-slate-400">Only approved students enrolled in the course can open a class.</p></div><Link href="/dashboard" className="live-back-link text-sm font-semibold text-amber-300">Back to dashboard</Link></div>
    {message && <p role="alert" className="mt-6 rounded-xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200">{message}</p>}
    <div className="live-grid mt-8 grid gap-5 md:grid-cols-2">{sessions.map((session) => <article key={session.id} className="live-session-card rounded-2xl border border-white/10 bg-white/[.04] p-6">
      <div className="flex items-start justify-between gap-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${session.status === 'live' ? 'bg-rose-500 text-white' : 'bg-white/10 text-slate-300'}`}>{session.status === 'live' ? 'LIVE NOW' : 'SCHEDULED'}</span><Video className="size-5 text-cyan-300" /></div>
      <h2 className="mt-5 text-xl font-bold">{session.title}</h2><p className="mt-1 text-sm text-slate-400">{session.courses?.title}</p>
      <p className="mt-4 flex items-center gap-2 text-sm text-slate-300"><CalendarDays className="size-4 text-cyan-300" />{session.scheduled_at ? new Intl.DateTimeFormat('en-LK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(session.scheduled_at)) : 'Time to be announced'}</p>
      <a href={`/api/live/${session.id}/join`} className="live-join-button mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">Join on Zoom <ExternalLink className="size-4" /></a>
    </article>)}{!sessions.length && !message && <p className="live-empty rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-400 md:col-span-2">No Zoom classes are scheduled for your courses.</p>}</div>
  </div></main>;
}
