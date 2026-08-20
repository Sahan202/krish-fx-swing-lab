import crypto from 'node:crypto';
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
  return NextResponse.json({ success: true });
}
