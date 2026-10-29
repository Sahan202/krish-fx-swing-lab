import { createHash, randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { recordCurrentUserEvent } from '@/lib/audit';

const LANDING_ORIGINS = new Set([
  'https://react-template-main-wheat.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);
const DEVICE_COOKIE = 'krish_device_id';

type AuthCookie = { name: string; value: string; options: CookieOptions };

function returnToLanding(origin: string, code: string) {
  const target = new URL('/', origin);
  target.searchParams.set('login_error', code);
  return NextResponse.redirect(target, 303);
}

function applyAuthCookies(response: NextResponse, cookies: AuthCookie[]) {
  cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || !LANDING_ORIGINS.has(origin)) {
    return NextResponse.json({ error: 'Untrusted login origin.' }, { status: 403 });
  }

  const form = await request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!email || !password) return returnToLanding(origin, 'invalid');

  const authCookies = new Map<string, AuthCookie>();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items: AuthCookie[]) => items.forEach((cookie) => authCookies.set(cookie.name, cookie)),
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return returnToLanding(origin, 'invalid');

  const { data: profile } = await supabase
    .from('profiles')
    .select('approval_status,role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return applyAuthCookies(returnToLanding(origin, 'removed'), [...authCookies.values()]);
  }
  if (profile.approval_status === 'pending') {
    await supabase.auth.signOut();
    return applyAuthCookies(returnToLanding(origin, 'pending'), [...authCookies.values()]);
  }
  if (profile.approval_status !== 'approved') {
    await supabase.auth.signOut();
    return applyAuthCookies(returnToLanding(origin, 'rejected'), [...authCookies.values()]);
  }

  const deviceId = request.cookies.get(DEVICE_COOKIE)?.value ?? randomUUID();
  const deviceHash = createHash('sha256').update(deviceId).digest('hex');
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? null;
  const { data: deviceAllowed, error: deviceError } = await supabase.rpc('register_lms_device', {
    p_device_hash: deviceHash,
    p_ip_address: ipAddress,
    p_user_agent: request.headers.get('user-agent'),
  });
  if (deviceError || !deviceAllowed) {
    await supabase.auth.signOut();
    return applyAuthCookies(returnToLanding(origin, deviceError ? 'session' : 'device'), [...authCookies.values()]);
  }

  const sessionId = randomUUID();
  const { error: sessionError } = await supabase.from('active_sessions').upsert({
    user_id: data.user.id,
    session_id: sessionId,
    device_id_hash: deviceHash,
    updated_at: new Date().toISOString(),
  });
  if (sessionError) {
    await supabase.auth.signOut();
    return applyAuthCookies(returnToLanding(origin, 'session'), [...authCookies.values()]);
  }

  await recordCurrentUserEvent({
    action: 'SIGNED_IN',
    targetType: 'lms_session',
    targetId: data.user.id,
    details: { source: 'landing_email_password', device_hash_prefix: deviceHash.slice(0, 12) },
  });

  const destination = data.user.user_metadata?.must_change_password
    ? '/change-password'
    : profile.role === 'admin'
      ? '/super-admin'
      : '/dashboard';
  const response = applyAuthCookies(
    NextResponse.redirect(new URL(destination, request.url), 303),
    [...authCookies.values()],
  );
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
