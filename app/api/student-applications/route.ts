import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { recordSystemEvent } from '@/lib/audit';

type ApplicationBody = {
  fullName?: unknown;
  email?: unknown;
  whatsappNumber?: unknown;
  badge?: unknown;
  turnstileToken?: unknown;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+()\-\s]{7,25}$/;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function getIp(request: NextRequest) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}

function bucket(secret: string, type: string, value: string) {
  return crypto.createHash('sha256').update(`${secret}:${type}:${value}`).digest('hex');
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: false, configurationError: true };
  const form = new URLSearchParams({ secret, response: token, remoteip: ip });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: form, cache: 'no-store',
  });
  if (!response.ok) return { ok: false, configurationError: false };
  const result = await response.json() as { success?: boolean };
  return { ok: result.success === true, configurationError: false };
}

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
  let body: ApplicationBody;
  try { body = await request.json() as ApplicationBody; }
  catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }

  const fullName = text(body.fullName);
  const email = text(body.email).toLowerCase();
  const whatsappNumber = text(body.whatsappNumber);
  const badge = Number(body.badge);
  const turnstileToken = text(body.turnstileToken);
  if (
    fullName.length < 2 || fullName.length > 100 || /[\u0000-\u001F]/.test(fullName)
    || !emailPattern.test(email) || email.length > 254
    || !phonePattern.test(whatsappNumber)
    || ![1, 2, 3].includes(badge)
    || turnstileToken.length < 20 || turnstileToken.length > 2048
  ) return NextResponse.json({ error: 'Please enter valid application details and complete the security check.' }, { status: 400 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // A separate salt is optional. The Turnstile secret is already server-only
  // and provides a safe fallback for hashing rate-limit bucket keys.
  const rateLimitSecret = process.env.SIGNUP_RATE_LIMIT_SALT || process.env.TURNSTILE_SECRET_KEY;
  if (!key || !url || !rateLimitSecret) return NextResponse.json({ error: 'Application security is not configured.' }, { status: 503 });

  const ip = getIp(request);
  const captcha = await verifyTurnstile(turnstileToken, ip);
  if (captcha.configurationError) return NextResponse.json({ error: 'Application security is not configured.' }, { status: 503 });
  if (!captcha.ok) return NextResponse.json({ error: 'Security verification failed. Please try again.' }, { status: 400 });

  const admin = createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: emailAllowed, error: emailLimitError } = await admin.rpc('consume_signup_rate_limit', {
    p_bucket_key: bucket(rateLimitSecret, 'email', email), p_max_attempts: 3, p_window_seconds: 3600,
  });
  const { data: ipAllowed, error: ipLimitError } = await admin.rpc('consume_signup_rate_limit', {
    p_bucket_key: bucket(rateLimitSecret, 'ip', ip), p_max_attempts: 5, p_window_seconds: 900,
  });
  if (emailLimitError || ipLimitError) return NextResponse.json({ error: 'Application security check is unavailable. Please try again later.' }, { status: 503 });
  if (!emailAllowed || !ipAllowed) return NextResponse.json({ error: 'Too many attempts. Please wait and try again later.' }, { status: 429 });

  const { data, error } = await admin.from('student_applications')
    .insert({ full_name: fullName, email, whatsapp_number: whatsappNumber, badge })
    .select('id').single();
  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await admin.from('student_applications').select('status').eq('email', email).maybeSingle();
      const messages = {
        pending: 'This email already has an application pending Super Admin approval.',
        approved: 'This email is already approved. Please use Sign in to access the LMS.',
        rejected: 'This email has a rejected application. Please contact support before applying again.',
      };
      return NextResponse.json({ error: messages[existing?.status as keyof typeof messages] ?? 'An application with this email already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not submit your application. Please try again.' }, { status: 400 });
  }

  await recordSystemEvent({ action: 'STUDENT_APPLICATION_CREATED', targetType: 'student_application', targetId: data.id, email, role: 'applicant', details: { fullName, badge } });
  let emailWarning = '';
  try { await sendApplicationThankYou(email, fullName); }
  catch (emailError) { console.error('Application thank-you email failed', emailError); emailWarning = 'Application submitted, but the thank-you email could not be sent.'; }
  return NextResponse.json({ success: true, emailWarning });
}
