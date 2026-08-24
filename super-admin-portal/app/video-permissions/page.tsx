import Link from 'next/link';
import PortalWorkspace from '../portal-workspace';
import Manager from './video-permissions-manager';
import { serviceClient } from '@/lib/admin-audit';
export const dynamic = 'force-dynamic';
export default async function Page() {
  const admin = serviceClient();
  const [{ data: students }, { data: courses }, { data: lessons }, { data: sections }] = await Promise.all([
    admin.from('profiles').select('id,full_name,phone').eq('role', 'student').order('full_name'),
    admin.from('courses').select('id,title').order('title'),
    admin.from('lessons').select('id,course_id,section_id,title,lesson_order').order('lesson_order'),
    admin.from('course_sections').select('id,course_id,title,description,section_order').order('section_order'),
  ]);
  return <PortalWorkspace><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Control center</Link><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Secure video access</p><h1 className="mt-2 text-4xl font-bold text-white">Video Permissions</h1><p className="mt-2 text-slate-400">Select a student, course, and the exact videos they may view.</p><Manager students={students ?? []} courses={courses ?? []} lessons={lessons ?? []} sections={sections ?? []}/></div></PortalWorkspace>;
}
