import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { recordCurrentUserEvent } from '@/lib/audit';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const cookieStore = await cookies();
  const deviceId = cookieStore.get('krish_device_id')?.value ?? crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const { data: existing } = await supabase.from('active_device_sessions').select('device_id').eq('user_id', user.id);
  const ownsDevice = (existing ?? []).some((item) => item.device_id === deviceId);
  if (!ownsDevice && (existing?.length ?? 0) >= 2) return NextResponse.json({ error: 'This account is already active on two devices. Sign out from one device before signing in here.' }, { status: 409 });
  const { error } = await supabase.from('active_device_sessions').upsert({ user_id: user.id, device_id: deviceId, session_id: sessionId, updated_at: new Date().toISOString() }, { onConflict: 'user_id,device_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await recordCurrentUserEvent({ action: 'SIGNED_IN', targetType: 'lms_session', targetId: user.id, details: { source: 'email_password_or_google', deviceLimit: 2 } });
  const response = NextResponse.json({ ok: true });
  response.cookies.set('krish_device_id', deviceId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 31536000 });
  response.cookies.set('krish_session_id', sessionId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 2592000 });
  return response;
}