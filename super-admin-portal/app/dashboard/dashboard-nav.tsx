'use client';

import Link from 'next/link';
import { BookOpen, FileCheck2, LayoutDashboard, ShieldCheck, UsersRound, UserRoundCog, KeyRound, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabaseBrowser } from '../../lib/supabase';
import LogoutButton from '../logout-button';

type Permissions = { manage_students: boolean; manage_content: boolean; manage_applications: boolean; view_reports: boolean };
const none: Permissions = { manage_students: false, manage_content: false, manage_applications: false, view_reports: false };
const item = 'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/[.06] hover:text-white';

export default function DashboardNav() {
  const [role, setRole] = useState(''); const [permissions, setPermissions] = useState<Permissions>(none);
  const pathname = usePathname();
  useEffect(() => { void (async () => { const { data: { session } } = await supabaseBrowser().auth.getSession(); if (!session) return; const response = await fetch('/api/portal-access', { headers: { Authorization: `Bearer ${session.access_token}` } }); if (!response.ok) return; const data = await response.json() as { role: string; permissions: Permissions }; setRole(data.role); setPermissions(data.permissions); })(); }, []);
  const superAdmin = role === 'super_admin';
  const active = (path: string) => `${item} ${pathname === path ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20' : ''}`;
  return <aside className="admin-sidebar flex w-full shrink-0 flex-col border-b border-slate-800/80 bg-[#07101d]/95 p-5 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r lg:p-6"><Link href="/dashboard" className="flex items-center gap-3"><span className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-cyan-500/20"><img src="/krish-fx-logo.jpeg" alt="Krish FX Swing Lab" className="size-full object-cover" /></span><span><b className="block text-[15px] text-white">Krish FX</b><span className="text-[11px] font-bold uppercase tracking-[.18em] text-cyan-300">Admin Studio</span></span></Link><div className="mt-9"><p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.22em] text-slate-500">Workspace</p><nav className="grid gap-1"><Link href="/dashboard" className={active('/dashboard')}><LayoutDashboard className="size-4" />Overview</Link>{(superAdmin || permissions.manage_students) && <Link href="/students" className={active('/students')}><UsersRound className="size-4" />Students</Link>}{(superAdmin || permissions.manage_content) && <Link href="/content" className={active('/content')}><BookOpen className="size-4" />Courses & lessons</Link>}{(superAdmin || permissions.manage_applications) && <Link href="/dashboard#applications" className={active('/dashboard')}><FileCheck2 className="size-4" />Applications</Link>}{(superAdmin || permissions.view_reports) && <Link href="/reports" className={active('/reports')}><ShieldCheck className="size-4" />Audit reports</Link>}{superAdmin && <Link href="/admins" className={active('/admins')}><UserRoundCog className="size-4" />Main admins</Link>}{superAdmin && <Link href="/password-activity" className={active('/password-activity')}><KeyRound className="size-4" />Password activity</Link>}</nav></div><div className="mt-auto space-y-4 pt-8"><div className="hidden rounded-2xl border border-cyan-300/15 bg-cyan-400/[.05] p-4 lg:block"><Sparkles className="size-5 text-cyan-300" /><p className="mt-3 text-sm font-bold text-white">Control with clarity</p><p className="mt-1 text-xs leading-5 text-slate-400">Students, access and learning content in one secure workspace.</p></div><LogoutButton /></div></aside>;
}
