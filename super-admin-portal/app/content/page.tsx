import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import ContentManager from './content-manager';
import PortalWorkspace from '../portal-workspace';
export const dynamic = 'force-dynamic';
export default async function ContentPage(){const key=process.env.SUPABASE_SERVICE_ROLE_KEY;const admin=key?createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key):null;const [{data:courses},{data:lessons}]=admin?await Promise.all([admin.from('courses').select('id,title'),admin.from('lessons').select('id,title,description,vdocipher_video_id,lesson_order').order('lesson_order')]):[{data:[]},{data:[]}];return <PortalWorkspace><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Control center</Link><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Content studio</p><h1 className="mt-2 text-4xl font-bold text-white">Lessons & videos</h1><p className="mt-2 text-slate-400">Create, edit and connect VdoCipher lesson content.</p><ContentManager courses={courses??[]} lessons={lessons??[]}/></div></PortalWorkspace>;}
