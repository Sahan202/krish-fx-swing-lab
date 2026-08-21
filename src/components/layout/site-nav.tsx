import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NavLinks from './nav-links';
import { LayoutDashboard, LogOut } from 'lucide-react';

export default async function SiteNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('profiles').select('role,full_name').eq('id', user.id).single() : { data: null };
  const canManage = ['admin', 'instructor', 'super_admin'].includes(profile?.role ?? '');
  const name = profile?.full_name?.trim() || user?.email?.split('@')[0] || 'Learner';
  const initial = name.charAt(0).toUpperCase();
  async function signOut() { 'use server'; const client = await createClient(); await client.auth.signOut(); redirect('/'); }

  return <header className="border-b border-white/10 bg-[#07111f] text-white">
    <nav className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5 lg:px-8">
      <Link href="/" className="group flex shrink-0 items-center gap-3 font-semibold tracking-tight"><span className="grid size-10 place-items-center overflow-hidden rounded-full bg-white"><img src="/krish-fx-logo.jpeg" alt="Krish FX Swing Lab" className="size-full object-cover" /></span><span className="hidden sm:inline">Krish FX <span className="text-amber-400">Swing Lab</span></span></Link>
      <NavLinks canManage={canManage} role={profile?.role ?? undefined} />
      {user ? <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Link href="/dashboard" className="hidden items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-[#07111f] shadow-lg shadow-amber-400/15 transition hover:-translate-y-0.5 hover:bg-amber-300 sm:inline-flex"><LayoutDashboard className="size-3.5" />My learning</Link>
        <div className="hidden max-w-52 items-center gap-2 rounded-full border border-white/10 bg-white/[.05] py-1.5 pl-1.5 pr-3 lg:flex" title={user.email ?? ''}>
          <span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-xs font-black text-[#07111f]">{initial}</span>
          <span className="min-w-0"><span className="block truncate text-xs font-semibold text-white">{name}</span><span className="block truncate text-[10px] text-slate-400">{user.email}</span></span>
        </div>
        <form action={signOut}><button aria-label="Log out" title="Log out" className="inline-flex items-center gap-1.5 rounded-full border border-red-400/40 bg-red-400/5 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500 hover:text-white"><LogOut className="size-3.5" /><span className="hidden sm:inline">Logout</span></button></form>
      </div> : <div className="flex shrink-0 items-center gap-2"><Link href="/login" className="hidden rounded-full px-3 py-2 text-sm font-medium text-slate-300 hover:text-amber-400 sm:inline-flex">Login</Link><Link href="/signup" className="rounded-full bg-amber-400 px-4 py-2.5 text-xs font-bold text-[#07111f] sm:px-5 sm:text-sm">Join the lab</Link></div>}
    </nav>
  </header>;
}
