import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { recordCurrentUserEvent } from '@/lib/audit';

const DEVICE_COOKIE = 'krish_device_id';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const loginUrl = new URL('/login', url.origin);
  if (!code) {
    loginUrl.searchParams.set('error', 'Google sign-in did not return an authorization code.');
    return NextResponse.redirect(loginUrl);
  }

  const requestCookies = request.headers.get('cookie')?.split(';').map((item) => {
    const [name, ...value] = item.trim().split('=');
    return { name, value: value.join('=') };
  }) ?? [];
  const cookieResponse = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => requestCookies,
        setAll: (items: { name: string; value: string; options: CookieOptions }[]) =>
          items.forEach(({ name, value, options }) => cookieResponse.cookies.set(name, value, options)),
      },
    },
  );
  const redirect = (destination: URL) => {
    const response = NextResponse.redirect(destination);
    cookieResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  };

  const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    loginUrl.searchParams.set('error', 'Google sign-in failed. Please try again.');
    return redirect(loginUrl);
  }

  const user = exchangeData.user;
  if (!user) return redirect(loginUrl);
  const { data: profile } = await supabase
    .from('profiles')
    .select('approval_status,role,full_name,whatsapp_number,badge')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.approval_status === 'pending' || profile.approval_status === 'rejected') {
    if (profile?.approval_status !== 'rejected') return redirect(new URL('/google-onboarding', url.origin));
    await supabase.auth.signOut();
    loginUrl.searchParams.set('error', 'Your application was not approved.');
    return redirect(loginUrl);
  }

  const deviceId = requestCookies.find((cookie) => cookie.name === DEVICE_COOKIE)?.value ?? randomUUID();
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
    loginUrl.searchParams.set(
      'error',
      deviceError
        ? 'Could not verify this device.'
        : 'This account already has two registered devices. Contact support to reset them.',
    );
    return redirect(loginUrl);
  }

  const sessionId = randomUUID();
  const { error: sessionError } = await supabase.from('active_sessions').upsert({
    user_id: user.id,
    session_id: sessionId,
    device_id_hash: deviceHash,
    updated_at: new Date().toISOString(),
  });
  if (sessionError) {
    await supabase.auth.signOut();
    loginUrl.searchParams.set('error', 'Could not start a secure session.');
    return redirect(loginUrl);
  }

  await recordCurrentUserEvent({
    action: 'SIGNED_IN',
    targetType: 'lms_session',
    targetId: user.id,
    details: { source: 'google', device_hash_prefix: deviceHash.slice(0, 12) },
  });

  const destination = user.user_metadata?.must_change_password
    ? '/change-password'
    : profile.role === 'admin'
      ? '/super-admin'
      : '/dashboard';
  const response = redirect(new URL(destination, url.origin));
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