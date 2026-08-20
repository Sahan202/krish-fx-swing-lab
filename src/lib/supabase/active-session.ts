import type { NextRequest } from 'next/server';
import { createClient } from './server';

/**
 * Confirms both Supabase authentication and this application's single-device
 * session marker. Use this in protected route handlers, not only in the UI.
 */
export async function getActiveSession(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const sessionId = request.cookies.get('krish_session_id')?.value;
  if (!sessionId) return null;

  const { data: activeSession } = await supabase
    .from('active_sessions')
    .select('session_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!activeSession || activeSession.session_id !== sessionId) return null;

  return { user, supabase };
}
