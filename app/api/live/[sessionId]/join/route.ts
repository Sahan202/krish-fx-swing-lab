import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function isAllowedZoomUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === 'https:' && (host === 'zoom.us' || host.endsWith('.zoom.us') || host === 'zoomgov.com' || host.endsWith('.zoomgov.com'));
  } catch { return false; }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.url));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Live classroom server is not configured.' }, { status: 503 });
  const admin = createAdminClient(url, key, { auth: { persistSession: false } });
  const { data: profile } = await admin.from('profiles').select('role,approval_status').eq('id', user.id).maybeSingle();
  const isSuperAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  if (!isSuperAdmin && (profile?.role !== 'student' || profile.approval_status !== 'approved')) return NextResponse.json({ error: 'Your student account is not approved.' }, { status: 403 });
  const { sessionId } = await params;
  const { data: liveSession } = await admin.from('live_sessions').select('course_id,status,zoom_join_url').eq('id', sessionId).maybeSingle();
  if (!liveSession) return NextResponse.json({ error: 'Live class not found.' }, { status: 404 });
  if (liveSession.status === 'ended') return NextResponse.json({ error: 'This live class has ended.' }, { status: 410 });
  if (!isSuperAdmin) {
    const { data: enrollment } = await admin.from('enrollments').select('id').eq('student_id', user.id).eq('course_id', liveSession.course_id).maybeSingle();
    if (!enrollment) return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 403 });
  }
  if (!liveSession.zoom_join_url || !isAllowedZoomUrl(liveSession.zoom_join_url)) return NextResponse.json({ error: 'This Zoom class is not configured correctly.' }, { status: 503 });
  return NextResponse.redirect(liveSession.zoom_join_url, { status: 302 });
}
