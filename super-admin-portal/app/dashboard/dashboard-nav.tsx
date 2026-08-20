'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase';

type Permissions = { manage_students: boolean; manage_content: boolean; manage_applications: boolean; view_reports: boolean };
const none: Permissions = { manage_students: false, manage_content: false, manage_applications: false, view_reports: false };

export default function DashboardNav() {
  const [role, setRole] = useState(''); const [permissions, setPermissions] = useState<Permissions>(none);
  useEffect(() => { void (async () => { const client = supabaseBrowser(); const { data: { user } } = await client.auth.getUser(); if (!user) return; const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle(); setRole(profile?.role ?? ''); if (profile?.role === 'admin') { const { data } = await client.from('admin_permissions').select('manage_students,manage_content,manage_applications,view_reports').eq('user_id', user.id).maybeSingle(); if (data) setPermissions(data); } })(); }, []);
  const superAdmin = role === 'super_admin';
  return <nav className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    {(superAdmin || permissions.manage_students) && <Link href="/students" className="rounded-2xl bg-blue-600 p-6 text-lg font-bold text-white">Students</Link>}
    {(superAdmin || permissions.manage_content) && <Link href="/content" className="rounded-2xl bg-slate-900 p-6 text-lg font-bold text-white">Courses & Lessons</Link>}
    {(superAdmin || permissions.manage_applications) && <Link href="/dashboard" className="rounded-2xl border border-slate-700 p-6 text-lg font-bold text-blue-300">Applications</Link>}
    {(superAdmin || permissions.view_reports) && <Link href="/reports" className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-lg font-bold text-emerald-300">Audit reports</Link>}
    {superAdmin && <Link href="/admins" className="rounded-2xl border border-violet-400/30 bg-violet-400/10 p-6 text-lg font-bold text-violet-300">Main Admins</Link>}
  </nav>;
}
