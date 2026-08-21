'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? '');
      const { data } = await supabase.from('profiles').select('full_name,phone,bio,role').eq('id', user.id).maybeSingle();
      if (data) { setFullName(data.full_name ?? ''); setPhone(data.phone ?? ''); setBio(data.bio ?? ''); setRole(data.role ?? 'student'); }
    });
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone, bio }).eq('id', user.id);
    setMessage(error ? error.message : 'Profile saved successfully.');
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordMessage('');
    if (newPassword.length < 8) { setPasswordMessage('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordMessage('Passwords do not match.'); return; }
    setPasswordSaving(true);
    const { error } = await createClient().auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) { setPasswordMessage(error.message); return; }
    await fetch('/api/audit/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'PASSWORD_CHANGED', targetType: 'student_password', targetId: email, details: { source: 'student_profile' } }) });
    setNewPassword(''); setConfirmPassword(''); setPasswordMessage('Password changed successfully.');
  }

  return <main className="min-h-screen bg-[#07111f] px-6 py-12 text-white"><div className="mx-auto max-w-xl space-y-6">
    <form onSubmit={save} className="rounded-3xl border border-white/10 bg-white/[.04] p-8">
      <Link href="/dashboard" className="text-sm text-amber-400">← Dashboard</Link><h1 className="mt-8 text-3xl font-bold">Student profile</h1>
      <div className="mt-6 grid gap-3 rounded-xl bg-blue-50 p-4 text-sm text-slate-600"><p><span className="font-semibold">Email:</span> {email || 'Loading…'}</p><p><span className="font-semibold">Account type:</span> <span className="capitalize">{role}</span></p></div>
      <label className="mt-8 block text-sm">Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3" /></label>
      <label className="mt-4 block text-sm">Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3" /></label>
      <label className="mt-4 block text-sm">About you<textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3" /></label>
      {message && <p className="mt-4 text-sm text-amber-300">{message}</p>}<button className="mt-6 rounded-xl bg-amber-400 px-5 py-3 font-semibold text-[#07111f]">Save profile</button>
    </form>
    {role === 'student' && <form onSubmit={changePassword} className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-cyan-300">Account security</p><h2 className="mt-2 text-2xl font-bold">Change your password</h2><p className="mt-2 text-sm leading-6 text-slate-400">Choose a password you will remember. Use at least 8 characters.</p><label className="mt-6 block text-sm">New password<input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3" /></label><label className="mt-4 block text-sm">Confirm new password<input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3" /></label>{passwordMessage && <p className="mt-4 text-sm text-cyan-200">{passwordMessage}</p>}<button disabled={passwordSaving} className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-[#07111f] disabled:opacity-60">{passwordSaving ? 'Changing password…' : 'Change password'}</button></form>}
  </div></main>;
}