'use client';
import { FormEvent, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function login(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(''); const client = supabaseBrowser(); const { error: authError } = await client.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message); else { const { data: { session } } = await client.auth.getSession(); await fetch('/api/audit/login', { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token ?? ''}` } }); window.location.href = '/dashboard'; }
    setLoading(false);
  }
  return <main className="grid min-h-screen place-items-center px-6"><form onSubmit={login} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"><p className="text-sm font-bold uppercase tracking-[.2em] text-blue-600">Secure portal</p><h1 className="mt-3 text-3xl font-bold">Super admin login</h1><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" className="mt-8 w-full rounded-xl border border-blue-100 px-4 py-3" /><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="mt-3 w-full rounded-xl border border-blue-100 px-4 py-3" />{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={loading} className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Signing in…' : 'Continue'}</button></form></main>;
}
