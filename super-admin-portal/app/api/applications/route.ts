import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { audit, requirePermission } from '@/lib/admin-audit';
import { brandedEmail } from '@/lib/branded-email';

export async function PATCH(request: NextRequest) {
  const body = await request.json() as { id?: string; action?: 'approve' | 'reject' };
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!body.id || !body.action || !key) return NextResponse.json({ error: 'Application/action or server configuration is missing.' }, { status: 400 });
  const actor = await requirePermission(request, 'manage_applications');
  if (!actor) return NextResponse.json({ error: 'You do not have application approval permission.' }, { status: 403 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: application, error } = await admin.from('student_applications').select('*').eq('id', body.id).single();
  if (error || !application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  if (body.action === 'reject') {
    const { error: updateError } = await admin.from('student_applications').update({ status: 'rejected' }).eq('id', body.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    let emailWarning = '';
    try {
      const resendKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
      if (!resendKey || !from) throw new Error('Resend is not configured.');
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [application.email], subject: 'Update on your Krish FX Swing Lab application', text: `Hi ${application.full_name},\n\nThank you for applying to Krish FX Swing Lab. Unfortunately, your application was not approved at this time.\n\nIf you need more information, please contact support.`, html: brandedEmail({ eyebrow: 'APPLICATION UPDATE', title: 'An update on your application', name: application.full_name, message: 'Thank you for applying to Krish FX Swing Lab. Unfortunately, your application was not approved at this time.', noticeTitle: 'NEED MORE INFORMATION?', notice: 'Please contact support if you need help or further details.' }) }) });
      if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
    } catch (emailError) {
      console.error('Rejection email failed', emailError);
      emailWarning = `Application rejected, but email could not be sent: ${emailError instanceof Error ? emailError.message : 'unknown error'}`;
    }
    await audit(actor, 'APPLICATION_REJECTED', 'student_application', body.id, { email: application.email, fullName: application.full_name });
    return NextResponse.json({ status: 'rejected', emailWarning });
  }
  const password = `Kfx!${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}a1`;
  const created = await admin.auth.admin.createUser({ email: application.email, password, email_confirm: true, user_metadata: { full_name: application.full_name, must_change_password: true } });
  let userId = created.data.user?.id;
  if (!userId && created.error?.message.toLowerCase().includes('already')) { const users = await admin.auth.admin.listUsers(); userId = users.data.users.find((item) => item.email?.toLowerCase() === application.email.toLowerCase())?.id; if (userId) await admin.auth.admin.updateUserById(userId, { password, user_metadata: { must_change_password: true } }); }
  if (!userId) return NextResponse.json({ error: created.error?.message ?? 'Could not create account.' }, { status: 400 });
  const { error: profileError } = await admin.from('profiles').upsert({ id: userId, full_name: application.full_name, phone: application.whatsapp_number, whatsapp_number: application.whatsapp_number, badge: application.badge, role: 'student', approval_status: 'approved' });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  await admin.from('student_applications').update({ status: 'approved' }).eq('id', body.id);
  await audit(actor, 'APPLICATION_APPROVED', 'student_application', body.id, { email: application.email, fullName: application.full_name, studentId: userId, badge: application.badge });
  let emailWarning = '';
  try {
    const resendKey = process.env.RESEND_API_KEY; const from = process.env.RESEND_FROM_EMAIL;
    if (!resendKey || !from) throw new Error('Resend is not configured.');
    const loginUrl = `${process.env.MAIN_SITE_URL ?? 'https://www.krishfxswinglab.com'}/login`;
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [application.email], subject: 'Your Krish FX Swing Lab account is approved', text: `Welcome to Krish FX Swing Lab\n\nHi ${application.full_name},\n\nYour application has been approved.\n\nStudent login: ${loginUrl}\nEmail: ${application.email}\nTemporary password: ${password}\n\nFor security, please change this password after you sign in.`, html: brandedEmail({ eyebrow: 'ACCESS APPROVED', title: 'Your learning access is ready', name: application.full_name, message: 'Your application has been approved. Use the secure details below to sign in to your learning space.', details: [{ label: 'Email', value: application.email }, { label: 'Temporary password', value: password }], noticeTitle: 'SECURITY NOTE', notice: 'Change this temporary password after you sign in.', actionUrl: loginUrl, actionLabel: 'Open student login' }) }) });
    if (!response.ok) { const details = await response.text(); throw new Error(`Resend rejected the email (${response.status}): ${details}`); }
  } catch (error) { console.error('Approval email failed', error); emailWarning = `Account approved, but email could not be sent: ${error instanceof Error ? error.message : 'unknown error'}`; }
  return NextResponse.json({ status: 'approved', temporaryPassword: password, emailWarning });
}
