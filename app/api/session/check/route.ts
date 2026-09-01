import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ valid: false }, { status: 401 });

  const sessionId = request.cookies.get('krish_session_id')?.value;
  const deviceId = request.cookies.get('krish_device_id')?.value;
  const { data } = await supabase
    .from('active_sessions')
    .select('session_id,device_id_hash')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!sessionId || !data || data.session_id !== sessionId) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  // Rows created before the device migration remain valid until the next login.
  if (data.device_id_hash) {
    const deviceHash = deviceId ? createHash('sha256').update(deviceId).digest('hex') : '';
    if (deviceHash !== data.device_id_hash) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }
  }

  return NextResponse.json({ valid: true });
}