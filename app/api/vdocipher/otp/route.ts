import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { videoId } = await request.json() as { videoId?: string };
  if (!videoId || !/^[a-zA-Z0-9_-]+$/.test(videoId)) return NextResponse.json({ error: 'A valid VdoCipher video ID is required.' }, { status: 400 });
  const { data: profile } = await supabase.from('profiles').select('role,approval_status').eq('id', user.id).maybeSingle();
  const staff = ['instructor', 'admin', 'super_admin'].includes(profile?.role ?? '');
  const { data: lesson } = await supabase.from('lessons').select('course_id,courses!inner(published)').eq('vdocipher_video_id', videoId).maybeSingle();
  if (!lesson || !lesson.courses?.published) return NextResponse.json({ error: 'Video is not available.' }, { status: 404 });
  if (!staff) {
    if (profile?.approval_status !== 'approved') return NextResponse.json({ error: 'Your account is not approved.' }, { status: 403 });
    const { data: enrollment } = await supabase.from('enrollments').select('id').eq('student_id', user.id).eq('course_id', lesson.course_id).maybeSingle();
    if (!enrollment) return NextResponse.json({ error: 'You are not enrolled in this course.' }, { status: 403 });
  }
  const secret = process.env.VDOCIPHER_API_SECRET;
  if (!secret) return NextResponse.json({ error: 'VdoCipher is not configured.' }, { status: 500 });
  const response = await fetch(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { method: 'POST', headers: { Authorization: `Apisecret ${secret}`, 'Content-Type': 'application/json' }, cache: 'no-store' });
  const data: unknown = await response.json();
  if (!response.ok) return NextResponse.json({ error: 'VdoCipher OTP request failed.' }, { status: response.status });
  return NextResponse.json(data);
}
