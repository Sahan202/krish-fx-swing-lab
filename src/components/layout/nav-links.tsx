'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  ['/', 'Home'],
  ['/student-results', 'Student Results'],
  ['/mentorship', 'Mentorship'],
  ['/contact', 'Contact Us'],
  ['/about', 'About'],
  ['/courses', 'Courses'],
  ['/dashboard', 'Dashboard'],
] as const;

export default function NavLinks({ canManage, role }: { canManage: boolean; role?: string }) {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const allLinks = role === 'student' ? links.filter(([href]) => href === '/dashboard') : links;
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  return <><div className="hidden items-center gap-2 text-sm md:flex">{allLinks.map(([href, label]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 transition ${isActive(href) ? 'bg-amber-400/15 font-semibold text-amber-400' : 'text-slate-300 hover:bg-white/5 hover:text-amber-400'}`}>{label}</Link>)}</div><div className="relative md:hidden"><button type="button" aria-label="Open navigation menu" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="grid size-10 place-items-center rounded-xl border border-amber-400/40 bg-amber-400/10 text-amber-300">{open ? <X className="size-5" /> : <Menu className="size-5" />}</button>{open && <div className="fixed right-3 top-[4.75rem] z-[100] w-[calc(100vw-1.5rem)] max-w-72 rounded-2xl border border-white/15 bg-[#0c1b2e] p-2 shadow-2xl shadow-black/40">{allLinks.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`block rounded-xl px-4 py-3 text-sm transition ${isActive(href) ? 'bg-amber-400/15 font-semibold text-amber-300' : 'text-slate-200 hover:bg-white/10 hover:text-amber-300'}`}>{label}</Link>)}</div>}</div></>;
}
