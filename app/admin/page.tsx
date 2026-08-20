import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminLessons from '@/components/admin/admin-lessons';
import Link from 'next/link';

type Lesson = { id: string; title: string; vdocipher_video_id: string | null; course_id: string; courses: { title: string }[] | null };
type Course = { id: string; title: string };

export default async function AdminPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).single();
  if (!profile || !['admin', 'instructor'].includes(profile.role)) redirect('/dashboard');
  const { data: lessons } = await supabase.from('lessons').select('id,title,vdocipher_video_id,course_id,courses(title)').order('lesson_order');
  const { data: courses } = await supabase.from('courses').select('id,title').order('title');
  const { data: students } = await supabase.from('profiles').select('id,full_name,phone,created_at').eq('role', 'student').order('created_at', { ascending: false });
  return <><AdminLessons lessons={(lessons ?? []) as Lesson[]} courses={(courses ?? []) as Course[]} role={profile.role} /><div className="mx-auto max-w-5xl px-6 pb-12"><Link href="/admin/students" className="inline-flex rounded-xl bg-[#00b8fe] px-5 py-3 text-sm font-bold text-white">Manage students separately →</Link></div></>;
}
