import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createAdminClient(url, key, { auth: { persistSession: false } }) : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const admin = adminClient();
  if (!admin) return NextResponse.json({ error: 'Live classroom server is not configured.' }, { status: 503 });
  const { data: profile } = await admin.from('profiles').select('role,approval_status').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'student' || profile.approval_status !== 'approved') return NextResponse.json({ error: 'Your student account is not approved.' }, { status: 403 });
  const { data: enrollments } = await admin.from('enrollments').select('course_id').eq('student_id', user.id);
  const courseIds = (enrollments ?? []).map((item) => item.course_id);
  if (!courseIds.length) return NextResponse.json({ sessions: [] });
  const { data, error } = await admin.from('live_sessions').select('id,title,status,scheduled_at,courses(title)').in('course_id', courseIds).in('status', ['scheduled', 'live']).not('zoom_join_url', 'is', null).order('scheduled_at');
  if (error) return NextResponse.json({ error: 'Could not load live classes.' }, { status: 500 });
  return NextResponse.json({ sessions: data ?? [] });
}
