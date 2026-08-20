import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { recordSystemEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.json() as { fullName?: string; whatsappNumber?: string; badge?: number };
  if (!body.fullName?.trim() || !body.whatsappNumber?.trim() || ![1, 2].includes(Number(body.badge))) return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Google sign-in session expired. Please sign in again.' }, { status: 401 });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'Application service is not configured.' }, { status: 500 });
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profile } = await admin.from('profiles').select('approval_status').eq('id', user.id).maybeSingle();
  if (profile?.approval_status === 'approved') return NextResponse.json({ error: 'This account is already approved.' }, { status: 400 });
  const { data, error } = await admin.from('student_applications').insert({ full_name: body.fullName.trim(), email: user.email, whatsapp_number: body.whatsappNumber.trim(), badge: Number(body.badge) }).select('id').single();
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Your application is already pending review.' : error.message }, { status: 400 });
  await admin.from('profiles').update({ full_name: body.fullName.trim(), whatsapp_number: body.whatsappNumber.trim(), badge: Number(body.badge), approval_status: 'pending' }).eq('id', user.id);
  await recordSystemEvent({ action: 'GOOGLE_STUDENT_APPLICATION_CREATED', targetType: 'student_application', targetId: data.id, email: user.email, role: 'applicant', details: { fullName: body.fullName.trim(), badge: Number(body.badge), provider: 'google' } });
  return NextResponse.json({ success: true });
}
