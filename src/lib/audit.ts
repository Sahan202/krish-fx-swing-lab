import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

type EventInput = { action: string; targetType: string; targetId?: string | null; details?: Record<string, unknown> };
function admin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createServiceClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
export async function recordCurrentUserEvent(input: EventInput) {
  const service = admin(); if (!service) return;
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).maybeSingle();
  await service.from('admin_audit_logs').insert({ actor_id: user.id, actor_email: user.email ?? null, actor_role: profile?.role ?? 'student', action: input.action, target_type: input.targetType, target_id: input.targetId ?? null, details: input.details ?? {} });
}
export async function recordSystemEvent(input: EventInput & { email?: string | null; role?: string | null }) {
  const service = admin(); if (!service) return;
  await service.from('admin_audit_logs').insert({ actor_email: input.email ?? null, actor_role: input.role ?? 'visitor', action: input.action, target_type: input.targetType, target_id: input.targetId ?? null, details: input.details ?? {} });
}
