import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { createClient } from './server';

/**
 * Confirms Supabase authentication, the single active session marker, and the
 * registered device binding for protected route handlers.
 */
export async function getActiveSession(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const sessionId = request.cookies.get('krish_session_id')?.value;
  if (!sessionId) return null;

  const { data: activeSession } = await supabase
    .from('active_sessions')
    .select('session_id,device_id_hash')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!activeSession || activeSession.session_id !== sessionId) return null;

  if (activeSession.device_id_hash) {
    const deviceId = request.cookies.get('krish_device_id')?.value;
    const deviceHash = deviceId ? createHash('sha256').update(deviceId).digest('hex') : '';
    if (deviceHash !== activeSession.device_id_hash) return null;
  }

  return { user, supabase };
}