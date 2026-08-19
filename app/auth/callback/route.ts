import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get('code'); const loginUrl = new URL('/login', url.origin);
  if (!code) { loginUrl.searchParams.set('error', 'Google sign-in did not return an authorization code.'); return NextResponse.redirect(loginUrl); }
  const supabase = await createClient(); const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) { loginUrl.searchParams.set('error', 'Google sign-in failed. Please try again.'); return NextResponse.redirect(loginUrl); }
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.redirect(loginUrl);
  const { data: profile } = await supabase.from('profiles').select('approval_status,role').eq('id', user.id).maybeSingle();
  if (!profile || profile.approval_status === 'pending' || profile.approval_status === 'rejected') { await supabase.auth.signOut(); loginUrl.searchParams.set('error', profile?.approval_status === 'rejected' ? 'Your application was not approved.' : 'Your application is pending Super Admin approval.'); return NextResponse.redirect(loginUrl); }
  const sessionId = crypto.randomUUID(); const { error: sessionError } = await supabase.from('active_sessions').upsert({ user_id: user.id, session_id: sessionId, updated_at: new Date().toISOString() });
  if (sessionError) { await supabase.auth.signOut(); loginUrl.searchParams.set('error', 'Could not start a secure session.'); return NextResponse.redirect(loginUrl); }
  const response = NextResponse.redirect(new URL(profile.role === 'admin' ? '/super-admin' : '/dashboard', url.origin)); response.cookies.set('krish_session_id', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 2592000 }); return response;
}
