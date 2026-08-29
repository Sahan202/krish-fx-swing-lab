import PortalWorkspace from '../portal-workspace';
import { serviceClient } from '@/lib/admin-audit';
import LiveManager from './live-manager';

export default async function LivePage() {
  const { data: courses } = await serviceClient().from('courses').select('id,title').order('title');
  return <PortalWorkspace><div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Zoom scheduling</p><h1 className="mt-2 text-3xl font-bold text-white">Live classroom</h1><p className="mt-2 text-slate-400">Schedule Zoom classes and control when enrolled, approved students can join.</p><LiveManager courses={courses ?? []} /></div></PortalWorkspace>;
}
