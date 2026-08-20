import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { audit, requirePermission } from '@/lib/admin-audit';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character));
}

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
      const safeName = escapeHtml(application.full_name);
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [application.email], subject: 'Update on your Krish FX Swing Lab application', text: `Hi ${application.full_name},\n\nThank you for applying to Krish FX Swing Lab. Unfortunately, your application was not approved at this time.\n\nIf you need more information, please contact support.`, html: `<main style="font-family:Arial,sans-serif;color:#10233f;max-width:560px;margin:auto;padding:32px"><p style="color:#00aee8;font-weight:700;letter-spacing:1px">KRISH FX SWING LAB</p><h2>Application update</h2><p>Hi ${safeName},</p><p>Thank you for applying to Krish FX Swing Lab. Unfortunately, your application was not approved at this time.</p><p>If you need more information, please contact support.</p></main>` }) });
      if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
    } catch (emailError) {
      console.error('Rejection email failed', emailError);
      emailWarning = `Application rejected, but email could not be sent: ${emailError instanceof Error ? emailError.message : 'unknown error'}`;
    }
    await audit(actor, 'APPLICATION_REJECTED', 'student_application', body.id, { email: application.email, fullName: application.full_name });
    return NextResponse.json({ status: 'rejected', emailWarning });
  }
  const password = `Kfx!${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}a1`;
  const created = await admin.auth.admin.createUser({ email: application.email, password, email_confirm: true, user_metadata: { full_name: application.full_name } });
  let userId = created.data.user?.id;
  if (!userId && created.error?.message.toLowerCase().includes('already')) { const users = await admin.auth.admin.listUsers(); userId = users.data.users.find((item) => item.email?.toLowerCase() === application.email.toLowerCase())?.id; if (userId) await admin.auth.admin.updateUserById(userId, { password }); }
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
    const safeName = escapeHtml(application.full_name); const safeEmail = escapeHtml(application.email); const safePassword = escapeHtml(password);
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [application.email], subject: 'Your Krish FX Swing Lab account is approved', text: `Welcome to Krish FX Swing Lab\n\nHi ${application.full_name},\n\nYour application has been approved.\n\nStudent login: ${loginUrl}\nEmail: ${application.email}\nTemporary password: ${password}\n\nFor security, please change this password after you sign in.`, html: `<main style="font-family:Arial,sans-serif;color:#10233f;max-width:560px;margin:auto;padding:32px"><p style="color:#00aee8;font-weight:700;letter-spacing:1px">KRISH FX SWING LAB</p><h2>Your learning access is approved</h2><p>Hi ${safeName},</p><p>Your application has been approved. Use the details below to sign in.</p><p><a href="${loginUrl}" style="display:inline-block;background:#00b8fe;color:#fff;padding:13px 18px;border-radius:8px;font-weight:700;text-decoration:none">Open student login</a></p><div style="background:#f1f5f9;padding:16px;border-radius:10px"><strong>Email:</strong> ${safeEmail}<br/><strong>Temporary password:</strong> ${safePassword}</div><p style="color:#64748b;font-size:13px">For security, please change this password after you sign in.</p></main>` }) });
    if (!response.ok) { const details = await response.text(); throw new Error(`Resend rejected the email (${response.status}): ${details}`); }
  } catch (error) { console.error('Approval email failed', error); emailWarning = `Account approved, but email could not be sent: ${error instanceof Error ? error.message : 'unknown error'}`; }
  return NextResponse.json({ status: 'approved', temporaryPassword: password, emailWarning });
}
