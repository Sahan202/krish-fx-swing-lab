import { NextRequest, NextResponse } from 'next/server';
import { getActiveSession } from '@/lib/supabase/active-session';

export async function GET(request: NextRequest) {
  const activeSession = await getActiveSession(request);
  if (!activeSession) return NextResponse.json({ error: 'Your session is no longer active. Please sign in again.' }, { status: 401 });
  const { supabase, user } = activeSession;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['instructor', 'admin', 'super_admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Staff access is required.' }, { status: 403 });
  }

  const token = process.env.VIMEO_ACCESS_TOKEN;
  const userId = process.env.VIMEO_USER_ID;

  if (!token || !userId) {
    return NextResponse.json({ videos: [], configured: false, message: 'Vimeo is not configured yet.' });
  }

  const response = await fetch(`https://api.vimeo.com/users/${userId}/videos?per_page=50&sort=date&direction=desc`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.vimeo.*+json;version=3.4' },
    next: { revalidate: 300 },
  });

  if (!response.ok) return NextResponse.json({ error: 'Unable to load Vimeo videos.' }, { status: response.status });
  const data = await response.json();
  return NextResponse.json({ configured: true, videos: data.data ?? [] });
}
