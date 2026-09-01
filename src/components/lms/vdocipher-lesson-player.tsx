'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Circle, LockKeyhole, PlayCircle, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Lesson = { id: string; section_id?: string | null; title: string; description: string | null; vdocipher_video_id: string | null; lesson_order: number; duration_seconds: number | null };
type Section = { id: string; title: string; description: string | null; section_order: number };

export default function VdoCipherLessonPlayer({ course, lessons, sections = [], completedLessonIds, restrictedLessonIds = [] }: { course: { title: string; description: string | null; level: string }; lessons: Lesson[]; sections?: Section[]; completedLessonIds: string[]; restrictedLessonIds?: string[] }) {
  const orderedSections = [...sections].sort((a, b) => a.section_order - b.section_order);
  const sectionIds = new Set(orderedSections.map((section) => section.id));
  const otherLessons = lessons.filter((item) => !item.section_id || !sectionIds.has(item.section_id)).sort((a, b) => a.lesson_order - b.lesson_order);
  const firstSectionId = otherLessons.length ? 'general' : orderedSections.find((section) => lessons.some((item) => item.section_id === section.id))?.id ?? '';
  const initialLesson = firstSectionId === 'general' ? otherLessons[0] : lessons.find((item) => item.section_id === firstSectionId);
  const [activeId, setActiveId] = useState(initialLesson?.id ?? lessons[0]?.id ?? '');
  const [activeSectionId, setActiveSectionId] = useState(firstSectionId);
  const [playerUrl, setPlayerUrl] = useState('');
  const playerUrlRef = useRef('');
  const [playbackError, setPlaybackError] = useState('');
  const [completed, setCompleted] = useState(new Set(completedLessonIds));
  const restricted = new Set(restrictedLessonIds);
  const [saving, setSaving] = useState(false);
  const [showWebinarNotice, setShowWebinarNotice] = useState(false);
  const webinarNoticeShown = useRef(false);
  const fullscreenRef = useRef<HTMLElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lesson = lessons.find((item) => item.id === activeId);
  const activeGroup = (activeSectionId === 'general' ? otherLessons : lessons.filter((item) => item.section_id === activeSectionId)).sort((a, b) => a.lesson_order - b.lesson_order);
  const activeSection = orderedSections.find((section) => section.id === activeSectionId);

  useEffect(() => {
    const webinarNoticeKey = 'krish-webinar-notice-seen';
    if (!window.localStorage.getItem(webinarNoticeKey)) {
      window.localStorage.setItem(webinarNoticeKey, 'true');
      webinarNoticeShown.current = true;
      setShowWebinarNotice(true);
    }
    if (!webinarNoticeShown.current) return;
    const timer = window.setTimeout(() => setShowWebinarNotice(false), 6000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false; setPlayerUrl(''); setPlaybackError('');
    if (!lesson?.vdocipher_video_id) return;
    fetch('/api/vdocipher/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: lesson.vdocipher_video_id }) })
      .then(async (response) => {
        const data = await response.json() as { otp?: string; playbackInfo?: string; error?: string };
        if (!response.ok) throw new Error(data.error || 'Video is not available.');
        return data;
      })
      .then((data) => { if (!cancelled && data.otp && data.playbackInfo) { const url = `https://player.vdocipher.com/v2/?otp=${data.otp}&playbackInfo=${data.playbackInfo}`; playerUrlRef.current = url; setPlayerUrl(url); } })
      .catch((error: unknown) => { if (!cancelled) setPlaybackError(error instanceof Error ? error.message : 'Video is not available.'); });
    return () => { cancelled = true; };
  }, [lesson]);

  useEffect(() => {
    const hidePlayer = () => setPlayerUrl('');
    const restorePlayer = () => {
      if (!document.hidden && playerUrlRef.current) setPlayerUrl(playerUrlRef.current);
    };
    const handleVisibilityChange = () => { if (document.hidden) hidePlayer(); else restorePlayer(); };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', hidePlayer);
    window.addEventListener('focus', restorePlayer);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', hidePlayer);
      window.removeEventListener('focus', restorePlayer);
    };
  }, []);
  async function markComplete() { if (!lesson) return; setSaving(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (user) { await supabase.from('student_progress').upsert({ student_id: user.id, lesson_id: lesson.id, completed: true, watched_seconds: lesson.duration_seconds ?? 0 }, { onConflict: 'student_id,lesson_id' }); setCompleted((current) => new Set([...current, lesson.id])); } setSaving(false); }
  function selectSet(id: string, group: Lesson[]) { setActiveSectionId(id); if (group[0]) setActiveId(group[0].id); }
  if (!lesson) return <main className="grid min-h-screen place-items-center bg-[#07111f] text-white"><p>No lessons added yet.</p></main>;

  const setCard = (id: string, title: string, description: string | null, group: Lesson[]) => <button key={id} type="button" onClick={() => selectSet(id, group)} className={`lms-set-card w-full rounded-2xl border p-4 text-left transition ${activeSectionId === id ? 'lms-set-card-active border-cyan-400/60 bg-cyan-400/10' : 'border-white/10 bg-[#0c1b2e] hover:border-cyan-400/35'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{title}</p>{description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{description}</p>}</div><PlayCircle className={`size-5 shrink-0 ${activeSectionId === id ? 'text-cyan-300' : 'text-slate-500'}`}/></div><p className="mt-3 text-xs font-semibold uppercase tracking-[.12em] text-cyan-300">{group.length} {group.length === 1 ? 'video' : 'videos'}</p></button>;
  return <>{showWebinarNotice && createPortal(<div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/65 p-4 backdrop-blur-md sm:p-6"><div className="webinar-notice-enter relative w-full max-w-[430px] overflow-hidden rounded-[1.75rem] border border-white/15 bg-gradient-to-b from-[#102541] to-[#081528] shadow-[0_28px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(103,232,249,0.08)]"><img src="/krish-webinar-popup.jpeg" alt="Weekly webinar" className="h-36 w-full object-cover sm:h-40" /><div className="border-t border-white/10 bg-gradient-to-br from-cyan-400/[.08] via-transparent to-blue-500/[.06] p-5 sm:p-6"><p className="!text-sm !font-semibold !leading-7 !text-white sm:!text-[15px]">ඔබට පැන නැගෙන සියලු ගැටලු සෑම සතියකදීම පවත්වනු ලබන webinar එකේදී ඇසිය හැකිය.</p><button type="button" onClick={() => setShowWebinarNotice(false)} className="!mt-5 inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 !text-xs !font-bold !text-cyan-200 shadow-sm transition hover:bg-cyan-300/20">Close</button></div></div></div>, document.body)}<main ref={fullscreenRef} className="lms-premium relative min-h-screen bg-[#07111f] text-white"><header className="lms-header border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5"><div className="mx-auto flex max-w-7xl items-center justify-between"><Link href="/dashboard" className="lms-back-link text-sm text-amber-400">← Dashboard</Link><span className="lms-level text-sm text-slate-400">{course.level}</span></div></header><div className="lms-layout mx-auto grid max-w-7xl gap-8 px-5 py-8 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_380px]"><section className="lms-lesson-panel"><p className="lms-course-label text-sm font-semibold uppercase tracking-[.18em] text-amber-400">{course.title}</p><h1 className="lms-lesson-title mt-3 text-3xl font-bold sm:text-4xl">{lesson.title}</h1><div className="lms-player-shell relative mt-7 aspect-video overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#0c1b2e]">{playerUrl ? <iframe ref={(node) => { iframeRef.current = node; if (node) { node.setAttribute('disablepictureinpicture', ''); node.setAttribute('disableremoteplayback', ''); } }} className="size-full" src={playerUrl} allow="autoplay; encrypted-media; fullscreen" title={lesson.title} /> : <div className="grid size-full place-items-center text-center"><div><Video className={`mx-auto size-10 ${playbackError ? 'text-rose-400' : 'text-amber-400'}`} /><p className={`mt-4 font-medium ${playbackError ? 'text-rose-300' : ''}`}>{playbackError || (lesson.vdocipher_video_id ? 'Loading secure video…' : 'Video not connected yet')}</p></div></div>}</div><p className="lms-description mt-6 leading-7 text-slate-300">{lesson.description}</p><button onClick={markComplete} disabled={saving || completed.has(lesson.id)} className="lms-complete-button mt-7 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-[#07111f] disabled:opacity-60">{completed.has(lesson.id) ? 'Lesson completed' : saving ? 'Saving…' : 'Mark as complete'}</button></section><aside className="lms-sidebar space-y-5"><div className="lms-side-panel rounded-[1.5rem] border border-white/10 bg-white/[.04] p-4"><h2 className="lms-side-heading px-2 pb-3 font-semibold">Sub-courses</h2><div className="space-y-3">{otherLessons.length > 0 && setCard('general', '3rd Batch', null, otherLessons)}{orderedSections.map((section) => setCard(section.id, section.title, section.description, lessons.filter((item) => item.section_id === section.id).sort((a, b) => a.lesson_order - b.lesson_order)))}</div></div><div className="lms-side-panel rounded-[1.5rem] border border-white/10 bg-white/[.04] p-4"><p className="px-2 text-xs font-bold uppercase tracking-[.14em] text-amber-300">{activeSection?.title ?? '3rd Batch'}</p><h2 className="px-2 pb-2 pt-1 font-semibold">Videos</h2>{activeGroup.map((item, index) => <button key={item.id} onClick={() => setActiveId(item.id)} className={`lms-video-button flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${item.id === lesson.id ? 'lms-video-button-active border-cyan-400/40 bg-cyan-400/10 text-white' : 'border-transparent text-slate-300 hover:bg-white/5'}`}>{completed.has(item.id) ? <CheckCircle2 className="size-5 shrink-0 text-emerald-400" /> : <Circle className="size-5 shrink-0 text-slate-500" />}<span className="min-w-0 flex-1"><span className="block">Video {index + 1} — {item.title}</span>{restricted.has(item.id) && <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-rose-400/25 bg-rose-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-300"><LockKeyhole className="size-3" />Not Approved</span>}</span></button>)}</div></aside></div></main></>;
}
