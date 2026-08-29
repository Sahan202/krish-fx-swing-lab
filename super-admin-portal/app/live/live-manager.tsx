'use client';

import { CalendarDays, ExternalLink, Trash2, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';

type Course = { id: string; title: string };
type Session = { id: string; course_id: string; title: string; zoom_join_url: string; status: 'scheduled' | 'live' | 'ended'; scheduled_at: string | null; courses?: { title: string } | null };
const field = 'rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none focus:border-cyan-400';

export default function LiveManager({ courses }: { courses: Course[] }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ courseId: courses[0]?.id ?? '', title: '', zoomJoinUrl: '', scheduledAt: '' });

  const api = useCallback(async (options: RequestInit = {}) => {
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    const response = await fetch('/api/live', { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}`, ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }, []);
  const load = useCallback(() => api().then((data) => setSessions(data.sessions)), [api]);
  useEffect(() => { void load().catch((error: Error) => setMessage(error.message)); }, [load]);

  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      await api({ method: 'POST', body: JSON.stringify(form) });
      setForm({ ...form, title: '', zoomJoinUrl: '', scheduledAt: '' });
      setMessage('Zoom class scheduled.');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not schedule class.'); }
    finally { setBusy(false); }
  }

  async function changeStatus(sessionId: string, status: Session['status']) {
    setBusy(true); setMessage('');
    try { await api({ method: 'PATCH', body: JSON.stringify({ sessionId, status }) }); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not update class.'); }
    finally { setBusy(false); }
  }

  async function remove(session: Session) {
    if (!window.confirm(`Delete "${session.title}"? Students will lose access immediately.`)) return;
    setBusy(true); setMessage('');
    try {
      await api({ method: 'DELETE', body: JSON.stringify({ sessionId: session.id }) });
      setMessage('Zoom class deleted from the LMS and database.');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not delete class.'); }
    finally { setBusy(false); }
  }

  return <div className="mt-8 space-y-7">
    <form onSubmit={create} className="grid gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/[.05] p-5 md:grid-cols-2">
      <label className="text-sm font-semibold text-slate-300">Course<select required value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })} className={`${field} mt-2 w-full`}>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
      <label className="text-sm font-semibold text-slate-300">Class title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Weekly market review" className={`${field} mt-2 w-full`} /></label>
      <label className="text-sm font-semibold text-slate-300">Zoom join URL<input required type="url" value={form.zoomJoinUrl} onChange={(event) => setForm({ ...form, zoomJoinUrl: event.target.value })} placeholder="https://zoom.us/j/..." className={`${field} mt-2 w-full`} /></label>
      <label className="text-sm font-semibold text-slate-300">Scheduled date and time<input required type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className={`${field} mt-2 w-full`} /></label>
      <button disabled={busy || !courses.length} className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-40 md:col-span-2">{busy ? 'Saving...' : 'Schedule Zoom class'}</button>
    </form>
    {message && <p role="status" className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-200">{message}</p>}
    <div className="grid gap-4 lg:grid-cols-2">{sessions.map((session) => <article key={session.id} className="rounded-2xl border border-slate-700 bg-[#081322] p-5">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">{session.courses?.title}</p><h2 className="mt-2 text-xl font-bold text-white">{session.title}</h2></div><Video className="size-5 text-cyan-300" /></div>
      <p className="mt-4 flex items-center gap-2 text-sm text-slate-400"><CalendarDays className="size-4" />{session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Not scheduled'}</p>
      <a href={session.zoom_join_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">Open host link <ExternalLink className="size-4" /></a>
      <div className="mt-5 flex flex-wrap gap-2">{session.status !== 'live' && session.status !== 'ended' && <button disabled={busy} onClick={() => void changeStatus(session.id, 'live')} className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white">Mark live</button>}{session.status === 'live' && <button disabled={busy} onClick={() => void changeStatus(session.id, 'ended')} className="rounded-xl border border-rose-400 px-4 py-2 text-sm font-bold text-rose-300">End class</button>}<span className="rounded-xl bg-white/5 px-4 py-2 text-sm font-bold uppercase text-slate-300">{session.status}</span><button disabled={busy} onClick={() => void remove(session)} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-rose-400/40 px-4 py-2 text-sm font-bold text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-40"><Trash2 className="size-4" />Delete class</button></div>
    </article>)}{!sessions.length && <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-500 lg:col-span-2">No Zoom classes scheduled yet.</p>}</div>
  </div>;
}
