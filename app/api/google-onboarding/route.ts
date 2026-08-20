import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { recordSystemEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  let body: { fullName?: string; whatsappNumber?: string; badge?: number };
  try { body = await request.json() as { fullName?: string; whatsappNumber?: string; badge?: number }; }
  catch { return NextResponse.json({ error: 'Invalid application details.' }, { status: 400 }); }
  const fullName = body.fullName?.trim() ?? '';
  const whatsappNumber = body.whatsappNumber?.trim() ?? '';
  const badge = Number(body.badge);
  if (fullName.length < 2 || fullName.length > 100 || !/^[0-9+()\-\s]{7,25}$/.test(whatsappNumber) || ![1, 2, 3].includes(badge)) return NextResponse.json({ error: 'Please complete all required fields with valid details.' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Google sign-in session expired. Please sign in again.' }, { status: 401 });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'Application service is not configured.' }, { status: 500 });
  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profile } = await admin.from('profiles').select('approval_status').eq('id', user.id).maybeSingle();
  if (profile?.approval_status === 'approved') return NextResponse.json({ error: 'This account is already approved.' }, { status: 400 });
  const { data: existingApplication } = await admin.from('student_applications').select('id,status').eq('email', user.email).maybeSingle();
  if (existingApplication?.status === 'rejected') return NextResponse.json({ error: 'Your application was not approved. Please contact support.' }, { status: 403 });
  if (existingApplication?.status === 'approved') return NextResponse.json({ error: 'This account is already approved. Please sign in again.' }, { status: 400 });
  const applicationWrite = existingApplication
    ? await admin.from('student_applications').update({ full_name: fullName, whatsapp_number: whatsappNumber, badge, status: 'pending' }).eq('id', existingApplication.id).select('id').single()
    : await admin.from('student_applications').insert({ full_name: fullName, email: user.email, whatsapp_number: whatsappNumber, badge }).select('id').single();
  const { data, error } = applicationWrite;
  if (error || !data) return NextResponse.json({ error: 'Could not submit your application. Please try again.' }, { status: 400 });
  const { error: profileError } = await admin.from('profiles').update({ full_name: fullName, whatsapp_number: whatsappNumber, badge, approval_status: 'pending' }).eq('id', user.id);
  if (profileError) return NextResponse.json({ error: 'Your details were received but could not be linked to your account. Please contact support.' }, { status: 500 });
  await recordSystemEvent({ action: 'GOOGLE_STUDENT_APPLICATION_CREATED', targetType: 'student_application', targetId: data.id, email: user.email, role: 'applicant', details: { fullName, badge, provider: 'google' } });
  return NextResponse.json({ success: true });
}
