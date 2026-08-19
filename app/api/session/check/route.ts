import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ valid: false }, { status: 401 });
  const cookie = (await import('next/headers')).cookies;
  const sessionId = (await cookie()).get('krish_session_id')?.value;
  const { data } = await supabase.from('active_sessions').select('session_id').eq('user_id', user.id).maybeSingle();
  if (!sessionId || !data || data.session_id !== sessionId) return NextResponse.json({ valid: false }, { status: 401 });
  return NextResponse.json({ valid: true });
}
