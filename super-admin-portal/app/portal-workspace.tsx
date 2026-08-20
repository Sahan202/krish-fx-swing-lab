'use client';
import type { ReactNode } from 'react';
import DashboardNav from './dashboard/dashboard-nav';
export default function PortalWorkspace({ children }: { children: ReactNode }) { return <main className="admin-workspace min-h-screen bg-[#030914] text-slate-100"><div className="flex min-h-screen flex-col lg:flex-row"><DashboardNav /><section className="min-w-0 flex-1 p-5 sm:p-7 lg:p-10">{children}</section></div></main>; }
