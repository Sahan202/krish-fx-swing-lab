'use client';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '../lib/supabase';

export default function LogoutButton() {
  const pathname = usePathname(); const router = useRouter();
  if (pathname === '/' || pathname === '/login') return null;
  async function logout() { await supabaseBrowser().auth.signOut(); router.replace('/login'); router.refresh(); }
  return <button onClick={() => void logout()} className="inline-flex w-full items-center justify-center rounded-xl border border-rose-400/40 bg-rose-400/[.06] px-4 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white">Logout</button>;
}
