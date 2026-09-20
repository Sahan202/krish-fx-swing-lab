'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const links = [['/', 'Home'], ['/student-results', 'Student Results'], ['/mentorship', 'Mentorship'], ['/contact', 'Contact Us'], ['/about', 'About'], ['/courses', 'Courses'], ['/dashboard', 'Dashboard'], ['/live', 'Live Class']] as const;
export default function NavLinks({ role }: { canManage: boolean; role?: string }) {
  const pathname = usePathname() ?? '';
  const learningLinks = links.filter(([href]) => href === '/dashboard' || href === '/live');
  const allLinks = role === 'student' || role === 'admin' || role === 'super_admin' ? learningLinks : links;
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  return <><div className="hidden items-center gap-2 text-sm md:ml-auto md:flex">{allLinks.map(([href, label]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 transition ${isActive(href) ? 'bg-amber-400/15 font-semibold text-amber-400' : 'text-slate-300 hover:bg-white/5 hover:text-amber-400'}`}>{label}</Link>)}</div><div className="premium-mobile-nav-links flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto whitespace-nowrap md:hidden">{allLinks.map(([href, label]) => <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm transition ${isActive(href) ? 'bg-amber-400/15 font-semibold text-amber-300' : 'text-slate-300 hover:bg-white/5 hover:text-amber-300'}`}>{label}</Link>)}</div></>;
}
