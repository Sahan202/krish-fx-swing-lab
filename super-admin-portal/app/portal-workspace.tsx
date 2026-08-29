'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import DashboardNav from './dashboard/dashboard-nav';
export default function PortalWorkspace({ children }: { children: ReactNode }) { return <main className="admin-workspace min-h-screen bg-[#030914] text-slate-100"><div className="flex min-h-screen flex-col lg:flex-row"><DashboardNav /><section className="min-w-0 flex-1 p-5 sm:p-7 lg:p-10"><div className="mb-5 flex justify-end"><Link href="/live" className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">Live classroom</Link></div>{children}</section></div></main>; }
