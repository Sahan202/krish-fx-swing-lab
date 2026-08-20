'use client';
import { usePathname, useRouter } from 'next/navigation';
import { supabaseBrowser } from '../lib/supabase';

export default function LogoutButton() {
  const pathname = usePathname(); const router = useRouter();
  if (pathname === '/' || pathname === '/login') return null;
  async function logout() { await supabaseBrowser().auth.signOut(); router.replace('/login'); router.refresh(); }
  return <button onClick={() => void logout()} className="fixed right-5 top-5 z-50 rounded-xl border border-red-400/40 bg-slate-950/90 px-4 py-2 text-sm font-bold text-red-300 shadow-lg backdrop-blur hover:bg-red-500 hover:text-white">Logout</button>;
}
