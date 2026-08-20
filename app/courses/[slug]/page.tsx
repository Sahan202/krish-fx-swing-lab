import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import VdoCipherLessonPlayer from '@/components/lms/vdocipher-lesson-player';
import EnrollButton from '@/components/lms/enroll-button';

type Lesson = { id: string; section_id: string | null; title: string; description: string | null; vimeo_video_id: string | null; vdocipher_video_id: string | null; lesson_order: number; duration_seconds: number | null };

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: course } = await supabase.from('courses').select('id,title,description,level,lessons(id,section_id,title,description,vimeo_video_id,vdocipher_video_id,lesson_order,duration_seconds)').eq('slug', slug).single();
  if (!course) notFound();
  const lessons = ((course.lessons ?? []) as Lesson[]).sort((a, b) => a.lesson_order - b.lesson_order);
  const { data: progress } = await supabase.from('student_progress').select('lesson_id,completed').eq('student_id', user.id).in('lesson_id', lessons.map((lesson) => lesson.id));
  const { data: enrollment } = await supabase.from('enrollments').select('id').eq('student_id', user.id).eq('course_id', course.id).maybeSingle();
  const { data: sections } = await supabase.from('course_sections').select('id,title,description,section_order').eq('course_id', course.id).order('section_order');
  return <><div className="bg-[#07111f] px-6 py-8 text-white"><div className="mx-auto flex max-w-7xl items-center justify-between"><div><p className="text-sm text-amber-400">{course.level}</p><h1 className="mt-2 text-3xl font-bold">{course.title}</h1></div><EnrollButton courseId={course.id} enrolled={Boolean(enrollment)} /></div><p className="mx-auto mt-4 max-w-7xl text-slate-400">{course.description}</p></div><VdoCipherLessonPlayer course={{ title: course.title, description: course.description, level: course.level }} lessons={lessons} sections={sections ?? []} completedLessonIds={(progress ?? []).filter((item) => item.completed).map((item) => item.lesson_id)} /></>;
}
