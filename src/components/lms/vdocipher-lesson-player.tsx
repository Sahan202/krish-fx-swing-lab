'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Circle, PlayCircle, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Lesson = { id: string; section_id?: string | null; title: string; description: string | null; vdocipher_video_id: string | null; lesson_order: number; duration_seconds: number | null };
type Section = { id: string; title: string; description: string | null; section_order: number };

export default function VdoCipherLessonPlayer({ course, lessons, sections = [], completedLessonIds }: { course: { title: string; description: string | null; level: string }; lessons: Lesson[]; sections?: Section[]; completedLessonIds: string[] }) {
  const orderedSections = [...sections].sort((a, b) => a.section_order - b.section_order);
  const sectionIds = new Set(orderedSections.map((section) => section.id));
  const otherLessons = lessons.filter((item) => !item.section_id || !sectionIds.has(item.section_id)).sort((a, b) => a.lesson_order - b.lesson_order);
  const firstSectionId = otherLessons.length ? 'general' : orderedSections.find((section) => lessons.some((item) => item.section_id === section.id))?.id ?? '';
  const initialLesson = firstSectionId === 'general' ? otherLessons[0] : lessons.find((item) => item.section_id === firstSectionId);
  const [activeId, setActiveId] = useState(initialLesson?.id ?? lessons[0]?.id ?? '');
  const [activeSectionId, setActiveSectionId] = useState(firstSectionId);
  const [playerUrl, setPlayerUrl] = useState('');
  const [completed, setCompleted] = useState(new Set(completedLessonIds));
  const [saving, setSaving] = useState(false);
  const [showWebinarNotice, setShowWebinarNotice] = useState(true);
  const fullscreenRef = useRef<HTMLElement>(null);
  const lesson = lessons.find((item) => item.id === activeId);
  const activeGroup = (activeSectionId === 'general' ? otherLessons : lessons.filter((item) => item.section_id === activeSectionId)).sort((a, b) => a.lesson_order - b.lesson_order);
  const activeSection = orderedSections.find((section) => section.id === activeSectionId);

  useEffect(() => {
    setShowWebinarNotice(true);
    const timer = window.setTimeout(() => setShowWebinarNotice(false), 10000);
    return () => window.clearTimeout(timer);
  }, [lesson?.id]);

  useEffect(() => {
    if (!playerUrl) return;
    const showTimer = window.setTimeout(() => {
      setShowWebinarNotice(true);
      window.setTimeout(() => setShowWebinarNotice(false), 10000);
    }, 10000);
    return () => window.clearTimeout(showTimer);
  }, [playerUrl]);

  useEffect(() => {
    let cancelled = false; setPlayerUrl('');
    if (!lesson?.vdocipher_video_id) return;
    fetch('/api/vdocipher/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: lesson.vdocipher_video_id }) }).then((response) => response.json()).then((data: { otp?: string; playbackInfo?: string }) => { if (!cancelled && data.otp && data.playbackInfo) setPlayerUrl(`https://player.vdocipher.com/v2/?otp=${data.otp}&playbackInfo=${data.playbackInfo}`); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [lesson]);

  async function toggleFullscreen() {
    if (!fullscreenRef.current) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await fullscreenRef.current.requestFullscreen();
  }

  async function markComplete() { if (!lesson) return; setSaving(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (user) { await supabase.from('student_progress').upsert({ student_id: user.id, lesson_id: lesson.id, completed: true, watched_seconds: lesson.duration_seconds ?? 0 }, { onConflict: 'student_id,lesson_id' }); setCompleted((current) => new Set([...current, lesson.id])); } setSaving(false); }
  function selectSet(id: string, group: Lesson[]) { setActiveSectionId(id); if (group[0]) setActiveId(group[0].id); }
  if (!lesson) return <main className="grid min-h-screen place-items-center bg-[#07111f] text-white"><p>No lessons added yet.</p></main>;

  const setCard = (id: string, title: string, description: string | null, group: Lesson[]) => <button key={id} type="button" onClick={() => selectSet(id, group)} className={`w-full rounded-2xl border p-4 text-left transition ${activeSectionId === id ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-[#0c1b2e] hover:border-cyan-400/35'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{title}</p>{description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{description}</p>}</div><PlayCircle className={`size-5 shrink-0 ${activeSectionId === id ? 'text-cyan-300' : 'text-slate-500'}`}/></div><p className="mt-3 text-xs font-semibold uppercase tracking-[.12em] text-cyan-300">{group.length} {group.length === 1 ? 'video' : 'videos'}</p></button>;
  return <main ref={fullscreenRef} className="relative min-h-screen bg-[#07111f] text-white">{showWebinarNotice && <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,430px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-cyan-300/30 bg-[#0b1b31] shadow-2xl shadow-black/50"><img src="/krish-webinar-popup.jpeg" alt="Weekly webinar" className="h-28 w-full object-cover" /><div className="p-4"><p className="!text-sm !font-semibold !leading-6 !text-white">ඔබට පැන නැගෙන සියලු ගැටලු සෑම සතියකදීම පවත්වනු ලබන webinar එකේදී ඇසිය හැකිය.</p><button type="button" onClick={() => setShowWebinarNotice(false)} className="!mt-3 !text-xs !font-semibold !text-cyan-300">Close</button></div></div>}<header className="border-b border-white/10 px-6 py-5"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/dashboard" className="text-sm text-amber-400">← Dashboard</Link><span className="text-sm text-slate-400">{course.level}</span></div></header><div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1fr_360px]"><section><p className="text-sm font-semibold uppercase tracking-[.18em] text-amber-400">{course.title}</p><h1 className="mt-3 text-3xl font-bold">{lesson.title}</h1><div className="relative mt-7 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#0c1b2e]"><button type="button" onClick={() => void toggleFullscreen()} className="absolute right-3 top-3 z-10 rounded-lg bg-black/70 px-3 py-2 text-xs font-semibold text-white hover:bg-black/90">Fullscreen</button>{playerUrl ? <iframe className="size-full" src={playerUrl} allow="encrypted-media; fullscreen" allowFullScreen title={lesson.title} /> : <div className="grid size-full place-items-center text-center"><div><Video className="mx-auto size-10 text-amber-400" /><p className="mt-4 font-medium">{lesson.vdocipher_video_id ? 'Loading secure video…' : 'Video not connected yet'}</p></div></div>}</div><p className="mt-6 leading-7 text-slate-300">{lesson.description}</p><button onClick={markComplete} disabled={saving || completed.has(lesson.id)} className="mt-7 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-[#07111f] disabled:opacity-60">{completed.has(lesson.id) ? 'Lesson completed' : saving ? 'Saving…' : 'Mark as complete'}</button></section><aside className="space-y-4"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><h2 className="px-2 pb-3 font-semibold">Sub-courses</h2><div className="space-y-3">{otherLessons.length > 0 && setCard('general', 'Other lessons', null, otherLessons)}{orderedSections.map((section) => setCard(section.id, section.title, section.description, lessons.filter((item) => item.section_id === section.id).sort((a, b) => a.lesson_order - b.lesson_order)))}</div></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="px-2 text-xs font-bold uppercase tracking-[.14em] text-amber-300">{activeSection?.title ?? 'Other lessons'}</p><h2 className="px-2 pb-2 pt-1 font-semibold">Videos</h2>{activeGroup.map((item, index) => <button key={item.id} onClick={() => setActiveId(item.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${item.id === lesson.id ? 'border-cyan-400/40 bg-cyan-400/10 text-white' : 'border-transparent text-slate-300 hover:bg-white/5'}`}>{completed.has(item.id) ? <CheckCircle2 className="size-5 shrink-0 text-emerald-400" /> : <Circle className="size-5 shrink-0 text-slate-500" />}Video {index + 1} — {item.title}</button>)}</div></aside></div></main>;
}
