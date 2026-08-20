import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import ContentManager from './content-manager';
import PortalWorkspace from '../portal-workspace';

export default async function ContentPage() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = key ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key) : null;
  const [{ data: courses }, { data: lessons }, { data: sections }] = admin ? await Promise.all([
    admin.from('courses').select('id,title').order('created_at'),
    admin.from('lessons').select('id,course_id,section_id,title,description,vdocipher_video_id,lesson_order').order('lesson_order'),
    admin.from('course_sections').select('id,course_id,title,description,section_order').order('section_order'),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];
  return <PortalWorkspace><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Control center</Link><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Content studio</p><h1 className="mt-2 text-4xl font-bold text-white">Courses, sub-courses & videos</h1><p className="mt-2 text-slate-400">Create sub-courses inside a course, then put unlimited lessons and VdoCipher videos inside each one.</p><ContentManager courses={courses ?? []} lessons={lessons ?? []} sections={sections ?? []}/></div></PortalWorkspace>;
}
