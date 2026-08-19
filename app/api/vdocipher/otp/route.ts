import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { videoId } = await request.json() as { videoId?: string };
  if (!videoId || !/^[a-zA-Z0-9_-]+$/.test(videoId)) return NextResponse.json({ error: 'A valid VdoCipher video ID is required.' }, { status: 400 });
  const secret = process.env.VDOCIPHER_API_SECRET;
  if (!secret) return NextResponse.json({ error: 'VdoCipher is not configured.' }, { status: 500 });
  const response = await fetch(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { method: 'POST', headers: { Authorization: `Apisecret ${secret}`, 'Content-Type': 'application/json' }, cache: 'no-store' });
  const data: unknown = await response.json();
  if (!response.ok) return NextResponse.json({ error: 'VdoCipher OTP request failed.' }, { status: response.status });
  return NextResponse.json(data);
}
