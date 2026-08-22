import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ valid: false }, { status: 401 });
  const cookieStore = await cookies();
  const deviceId = cookieStore.get('krish_device_id')?.value;
  const sessionId = cookieStore.get('krish_session_id')?.value;
  const { data } = await supabase.from('active_device_sessions').select('session_id').eq('user_id', user.id).eq('device_id', deviceId ?? '').maybeSingle();
  if (!deviceId || !sessionId || !data || data.session_id !== sessionId) return NextResponse.json({ valid: false }, { status: 401 });
  return NextResponse.json({ valid: true });
}