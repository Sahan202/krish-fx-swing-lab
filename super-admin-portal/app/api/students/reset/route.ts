import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { audit, requirePermission, serviceClient } from '@/lib/admin-audit';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character] ?? character));
}

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
  const result = await admin.auth.admin.updateUserById(id, { password });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });

  const email = authUser.user.email;
  let emailWarning = '';
  try {
    const resendKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!resendKey || !from) throw new Error('Resend is not configured.');
    const loginUrl = `${process.env.MAIN_SITE_URL ?? 'https://www.krishfxswinglab.com'}/login`;
    const safeName = escapeHtml(student.full_name ?? 'Student');
    const safePassword = escapeHtml(password);
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Your Krish FX Swing Lab password was reset',
        text: `Hi ${student.full_name ?? 'Student'},\n\nA Super Admin reset your Krish FX Swing Lab password.\n\nStudent login: ${loginUrl}\nEmail: ${email}\nNew temporary password: ${password}\n\nFor security, change this password after signing in.`,
        html: `<main style="font-family:Arial,sans-serif;color:#10233f;max-width:560px;margin:auto;padding:32px"><p style="color:#00aee8;font-weight:700;letter-spacing:1px">KRISH FX SWING LAB</p><h2>Your password was reset</h2><p>Hi ${safeName},</p><p>A Super Admin created a new temporary password for your student account.</p><p><a href="${loginUrl}" style="display:inline-block;background:#00b8fe;color:#fff;padding:13px 18px;border-radius:8px;font-weight:700;text-decoration:none">Open student login</a></p><div style="background:#f1f5f9;padding:16px;border-radius:10px"><strong>Email:</strong> ${escapeHtml(email)}<br/><strong>New temporary password:</strong> ${safePassword}</div><p style="color:#64748b;font-size:13px">For security, change this password after you sign in.</p></main>`,
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
