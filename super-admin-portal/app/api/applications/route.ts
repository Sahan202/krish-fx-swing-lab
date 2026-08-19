import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { audit, requireAdmin } from '@/lib/admin-audit';

export async function PATCH(request: NextRequest) {
  const body = await request.json() as { id?: string; action?: 'approve' | 'reject' };
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!body.id || !body.action || !key) return NextResponse.json({ error: 'Application/action or server configuration is missing.' }, { status: 400 });
  const actor = await requireAdmin(request);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: application, error } = await admin.from('student_applications').select('*').eq('id', body.id).single();
  if (error || !application) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  if (body.action === 'reject') { const { error: updateError } = await admin.from('student_applications').update({ status: 'rejected' }).eq('id', body.id); if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 }); await audit(actor, 'APPLICATION_REJECTED', 'student_application', body.id, { email: application.email, fullName: application.full_name }); return NextResponse.json({ status: 'rejected' }); }
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
  try { const host = process.env.SMTP_HOST; const user = process.env.SMTP_USER; const pass = process.env.SMTP_PASS; const from = process.env.MAIL_FROM ?? user; if (!host || !user || !pass || !from) throw new Error('SMTP is not configured.'); const port = Number(process.env.SMTP_PORT ?? 465); const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }); await transporter.sendMail({ from, to: application.email, subject: 'Your Krish FX Swing Lab account is approved', html: `<h2>Welcome to Krish FX Swing Lab</h2><p>Your application has been approved.</p><p><a href="${process.env.MAIN_SITE_URL ?? 'http://localhost:3000'}/login">Open student login</a></p><p>Email: ${application.email}<br/>Temporary password: <strong>${password}</strong></p>` }); } catch { emailWarning = 'Account approved, but SMTP email could not be sent.'; }
  return NextResponse.json({ status: 'approved', temporaryPassword: password, emailWarning });
}
