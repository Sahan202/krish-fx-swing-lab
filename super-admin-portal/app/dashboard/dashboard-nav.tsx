'use client';

import Link from 'next/link';
import { BookOpen, FileCheck2, LayoutDashboard, ShieldCheck, UsersRound, UserRoundCog, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase';

type Permissions = { manage_students: boolean; manage_content: boolean; manage_applications: boolean; view_reports: boolean };
const none: Permissions = { manage_students: false, manage_content: false, manage_applications: false, view_reports: false };
const item = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[.06] hover:text-white';

export default function DashboardNav() {
  const [role, setRole] = useState(''); const [permissions, setPermissions] = useState<Permissions>(none);
  useEffect(() => { void (async () => { const { data: { session } } = await supabaseBrowser().auth.getSession(); if (!session) return; const response = await fetch('/api/portal-access', { headers: { Authorization: `Bearer ${session.access_token}` } }); if (!response.ok) return; const data = await response.json() as { role: string; permissions: Permissions }; setRole(data.role); setPermissions(data.permissions); })(); }, []);
  const superAdmin = role === 'super_admin';
  return <aside className="flex w-full shrink-0 flex-col border-b border-slate-800/80 bg-[#07101d]/95 p-5 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-6"><Link href="/dashboard" className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-blue-600 font-black text-slate-950 shadow-lg shadow-cyan-500/20">K</span><span><b className="block text-[15px] text-white">Krish FX</b><span className="text-[11px] font-bold uppercase tracking-[.18em] text-cyan-300">Admin Studio</span></span></Link><div className="mt-9"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.22em] text-slate-500">Workspace</p><nav className="grid gap-1"><Link href="/dashboard" className={`${item} bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/10`}><LayoutDashboard className="size-4" />Overview</Link>{(superAdmin || permissions.manage_students) && <Link href="/students" className={item}><UsersRound className="size-4" />Students</Link>}{(superAdmin || permissions.manage_content) && <Link href="/content" className={item}><BookOpen className="size-4" />Courses & lessons</Link>}{(superAdmin || permissions.manage_applications) && <Link href="/dashboard#applications" className={item}><FileCheck2 className="size-4" />Applications</Link>}{(superAdmin || permissions.view_reports) && <Link href="/reports" className={item}><ShieldCheck className="size-4" />Audit reports</Link>}{superAdmin && <Link href="/admins" className={item}><UserRoundCog className="size-4" />Main admins</Link>}</nav></div><div className="mt-auto hidden rounded-2xl border border-cyan-300/15 bg-cyan-400/[.05] p-4 lg:block"><Sparkles className="size-5 text-cyan-300" /><p className="mt-3 text-sm font-bold text-white">Control with clarity</p><p className="mt-1 text-xs leading-5 text-slate-400">Students, access and learning content in one secure workspace.</p></div></aside>;
}
