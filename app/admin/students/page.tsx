import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import StudentManager from '@/components/admin/student-manager';

export default async function AdminStudentsPage() {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect('/login'); const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single(); if (profile?.role !== 'admin') redirect('/dashboard'); const { data: students } = await supabase.from('profiles').select('id,full_name,phone,created_at').eq('role', 'student').order('created_at', { ascending: false });
  return <main className="min-h-screen bg-[#f8fbff] px-6 py-12 text-[#09213f] lg:px-8"><div className="mx-auto max-w-5xl"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#0d62c7]">Admin area</p><h1 className="mt-2 text-4xl font-bold">Students</h1><p className="mt-2 text-slate-500">Create, update, reset passwords, and remove student accounts.</p></div><Link href="/admin" className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-[#0d62c7]">← Content management</Link></div><StudentManager students={students ?? []} /></div></main>;
}
