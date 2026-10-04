import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import StudentList from './student-list';
import PortalWorkspace from '../portal-workspace';
export const dynamic = 'force-dynamic';
export default async function StudentsPage() { const key = process.env.SUPABASE_SERVICE_ROLE_KEY; const admin = key ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null; const { data: students } = admin ? await admin.from('profiles').select('id,full_name,phone,badge,approval_status,created_at').eq('role', 'student').order('created_at', { ascending: false }) : { data: [] }; return <PortalWorkspace><div className="mx-auto max-w-6xl"><Link href="/dashboard" className="text-sm font-semibold text-cyan-300">← Control center</Link><p className="mt-8 text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Learner directory</p><h1 className="mt-2 text-4xl font-bold text-white">Students</h1><p className="mt-2 text-slate-400">Manage learner records, access and passwords from one secure workspace.</p><StudentList students={students ?? []} /></div></PortalWorkspace>; }
