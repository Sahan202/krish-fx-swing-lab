import { NextRequest, NextResponse } from 'next/server';
import { type CookieOptions, createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll: (items: { name: string; value: string; options: CookieOptions }[]) => items.forEach(({ name, value, options }) => { request.cookies.set(name, value); response.cookies.set(name, value, options); }) } });
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('approval_status').eq('id', user.id).maybeSingle();
    const sessionCookie = request.cookies.get('krish_session_id')?.value;
    if (!profile || profile.approval_status !== 'approved' || !sessionCookie) {
      await supabase.auth.signOut();
      const redirect = NextResponse.redirect(new URL(`/login?reason=${!profile ? 'account-removed' : 'access-unavailable'}`, request.url));
      redirect.cookies.delete('krish_session_id');
      return redirect;
    }
    const { data: active } = await supabase.from('active_sessions').select('session_id').eq('user_id', user.id).maybeSingle();
    if (!active || active.session_id !== sessionCookie) {
      await supabase.auth.signOut();
      const redirect = NextResponse.redirect(new URL('/login?reason=other-device', request.url));
      redirect.cookies.delete('krish_session_id');
      return redirect;
    }
  }
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) return NextResponse.redirect(new URL('/login', request.url));
  return response;
}

export const config = { matcher: ['/dashboard/:path*', '/profile/:path*', '/courses/:path*', '/admin/:path*', '/api/vdocipher/:path*', '/api/videos/:path*', '/api/audit/:path*', '/api/admin/:path*'] };
