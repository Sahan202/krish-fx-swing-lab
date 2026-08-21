import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { recordSystemEvent } from '@/lib/audit';

async function sendApplicationThankYou(email: string, fullName: string) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.MAIL_FROM ?? user;
  if (!host || !user || !pass || !from) throw new Error('SMTP is not configured.');
  const port = Number(process.env.SMTP_PORT ?? 465);
  const siteUrl = process.env.MAIN_SITE_URL ?? 'https://www.krishfxswinglab.com';
  const transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Thank you for applying to Krish FX Swing Lab',
    text: `Hi ${fullName},\n\nThank you for applying to Krish FX Swing Lab. We received your application and it is now waiting for Super Admin approval.\n\nWe will email you again once your account access is ready.\n\n${siteUrl}`,
    html: `<div style="margin:0;padding:32px 16px;background:#eef5fb;font-family:Arial,Helvetica,sans-serif;color:#10233f"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 14px 42px rgba(15,40,70,.14)"><tr><td style="padding:30px 34px;background:#071b33"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="width:42px;height:42px;border-radius:12px;background:#00b8fe;color:#ffffff;text-align:center;font-size:22px;font-weight:800">K</td><td style="padding-left:12px;color:#ffffff;font-size:17px;font-weight:700">Krish FX <span style="color:#56d8ff">Swing Lab</span></td></tr></table><p style="margin:26px 0 0;color:#8ce7ff;font-size:11px;font-weight:700;letter-spacing:1.8px">APPLICATION RECEIVED</p><h1 style="margin:9px 0 0;color:#ffffff;font-size:29px;line-height:1.2">Thank you for applying.</h1></td></tr><tr><td style="padding:34px"><p style="margin:0;font-size:16px;line-height:1.6">Hi ${fullName.replace(/[&<>"']/g, '')},</p><p style="margin:18px 0 0;color:#52677f;font-size:15px;line-height:1.7">Your application has been received successfully and is now waiting for <strong style="color:#10233f">Super Admin approval</strong>.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0;background:#f0faff;border:1px solid #c7effc;border-radius:14px"><tr><td style="padding:18px"><p style="margin:0;color:#0784b3;font-size:12px;font-weight:700;letter-spacing:1px">WHAT HAPPENS NEXT</p><p style="margin:8px 0 0;color:#38536d;font-size:14px;line-height:1.6">We will review your details and email you again when your learning access is ready.</p></td></tr></table><p style="margin:0"><a href="${siteUrl}" style="display:inline-block;border-radius:10px;background:#00aee8;color:#ffffff;padding:13px 19px;font-size:14px;font-weight:700;text-decoration:none">Visit Krish FX Swing Lab →</a></p><p style="margin:30px 0 0;border-top:1px solid #e5edf4;padding-top:20px;color:#8193a5;font-size:12px;line-height:1.6">This is an automated confirmation from Krish FX Swing Lab. Please do not reply to this email.</p></td></tr></table></div>`,
  });
}

export async function POST(request: NextRequest) {
  let body: { fullName?: string; whatsappNumber?: string; badge?: number };
  try { body = await request.json() as { fullName?: string; whatsappNumber?: string; badge?: number }; }
  catch { return NextResponse.json({ error: 'Invalid application details.' }, { status: 400 }); }
  const fullName = body.fullName?.trim() ?? '';
  const whatsappNumber = body.whatsappNumber?.trim() ?? '';
  const badge = Number(body.badge);
  if (fullName.length < 2 || fullName.length > 100 || !/^[0-9+()\-\s]{7,25}$/.test(whatsappNumber) || ![1, 2, 3, 4].includes(badge)) return NextResponse.json({ error: 'Please complete all required fields with valid details.' }, { status: 400 });
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
  let emailWarning = '';
  try { await sendApplicationThankYou(user.email, fullName); }
  catch (emailError) { console.error('Google application thank-you email failed', emailError); emailWarning = 'Application submitted, but the thank-you email could not be sent.'; }
  return NextResponse.json({ success: true, emailWarning });
}
