import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import ContentManager from './content-manager';
export const dynamic = 'force-dynamic';
export default async function ContentPage(){const key=process.env.SUPABASE_SERVICE_ROLE_KEY;const admin=key?createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key):null;const [{data:courses},{data:lessons}]=admin?await Promise.all([admin.from('courses').select('id,title'),admin.from('lessons').select('id,title,description,vdocipher_video_id,lesson_order').order('lesson_order')]):[{data:[]},{data:[]}];return <main className="min-h-screen px-6 py-12"><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm text-blue-400">← Dashboard</Link><h1 className="mt-6 text-4xl font-bold">Lessons / videos</h1><p className="mt-2 text-slate-400">Add, edit and connect VdoCipher videos from this portal.</p><ContentManager courses={courses??[]} lessons={lessons??[]}/></div></main>;}
