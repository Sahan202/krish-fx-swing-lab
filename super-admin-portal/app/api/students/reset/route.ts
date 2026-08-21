import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { audit, requirePermission, serviceClient } from '@/lib/admin-audit';
import { brandedEmail } from '@/lib/branded-email';

export async function POST(request: NextRequest) {
  const actor = await requirePermission(request, 'manage_students');
  const { id } = await request.json() as { id?: string };
  if (!actor) return NextResponse.json({ error: 'You do not have student management permission.' }, { status: 403 });
  if (!id) return NextResponse.json({ error: 'Student ID is missing.' }, { status: 400 });

  const admin = serviceClient();
  const { data: student } = await admin.from('profiles').select('full_name,role').eq('id', id).maybeSingle();
  if (!student || student.role !== 'student') return NextResponse.json({ error: 'Student account not found.' }, { status: 404 });
  const { data: authUser, error: authUserError } = await admin.auth.admin.getUserById(id);
  if (authUserError || !authUser.user?.email) return NextResponse.json({ error: 'Could not find this student email address.' }, { status: 404 });

  const password = `Kfx!${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}a1`;
  const result = await admin.auth.admin.updateUserById(id, { password, user_metadata: { must_change_password: true } });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });

  const email = authUser.user.email;
  let emailWarning = '';
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!resendKey || !from) throw new Error('Resend is not configured.');
    const loginUrl = `${process.env.MAIN_SITE_URL ?? 'https://www.krishfxswinglab.com'}/login`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your Krish FX Swing Lab password was reset',
        text: `Hi ${student.full_name ?? 'Student'},\n\nA Super Admin reset your Krish FX Swing Lab password.\n\nStudent login: ${loginUrl}\nEmail: ${email}\nNew temporary password: ${password}\n\nFor security, change this password after signing in.`,
        html: brandedEmail({ eyebrow: 'PASSWORD RESET', title: 'Your new password is ready', name: student.full_name ?? 'Student', message: 'A Super Admin created a new temporary password for your student account.', details: [{ label: 'Email', value: email }, { label: 'New temporary password', value: password }], noticeTitle: 'SECURITY NOTE', notice: 'Change this temporary password after you sign in.', actionUrl: loginUrl, actionLabel: 'Open student login' }),
      }),
    });
    if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
  } catch (error) {
    console.error('Password reset email failed', error);
    emailWarning = `Password changed, but email could not be sent: ${error instanceof Error ? error.message : 'unknown error'}`;
  }

  await audit(actor, 'STUDENT_PASSWORD_RESET', 'student', id, { email });
  return NextResponse.json({ password, emailWarning });
}
