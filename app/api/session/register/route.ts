import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { recordCurrentUserEvent } from '@/lib/audit';

const DEVICE_COOKIE = 'krish_device_id';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const deviceId = request.cookies.get(DEVICE_COOKIE)?.value ?? randomUUID();
  const deviceHash = createHash('sha256').update(deviceId).digest('hex');
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null;
  const userAgent = request.headers.get('user-agent');
  const { data: deviceAllowed, error: deviceError } = await supabase.rpc('register_lms_device', {
    p_device_hash: deviceHash,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
  });

  if (deviceError) return NextResponse.json({ error: 'Could not verify this device.' }, { status: 500 });
  if (!deviceAllowed) {
    return NextResponse.json({ error: 'This account already has two registered devices. Contact support to reset them.' }, { status: 403 });
  }

  const sessionId = randomUUID();
  const { error } = await supabase.from('active_sessions').upsert({
    user_id: user.id,
    session_id: sessionId,
    device_id_hash: deviceHash,
    updated_at: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await recordCurrentUserEvent({
    action: 'SIGNED_IN',
    targetType: 'lms_session',
    targetId: user.id,
    details: { source: 'email_password_or_google', device_hash_prefix: deviceHash.slice(0, 12) },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 31536000,
  });
  response.cookies.set('krish_session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2592000,
  });
  return response;
}