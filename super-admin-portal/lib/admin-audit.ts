import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export type AdminActor = { id: string; email: string | null };
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Portal server configuration is missing.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}
export async function requireAuthenticatedUser(request: NextRequest): Promise<AdminActor | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''); if (!token) return null;
  const { data: auth } = await serviceClient().auth.getUser(token); if (!auth.user) return null;
  return { id: auth.user.id, email: auth.user.email ?? null };
}
export async function requireAdmin(request: NextRequest): Promise<AdminActor | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, ''); if (!token) return null;
  const admin = serviceClient(); const { data: auth } = await admin.auth.getUser(token); if (!auth.user) return null;
  const { data: profile } = await admin.from('profiles').select('role').eq('id', auth.user.id).maybeSingle(); if (profile?.role !== 'admin') return null;
  return { id: auth.user.id, email: auth.user.email ?? null };
}
export async function audit(actor: AdminActor, action: string, targetType: string, targetId?: string, details: Record<string, unknown> = {}) {
  const client = serviceClient();
  const row = { actor_id: actor.id, actor_email: actor.email, actor_role: 'admin', action, target_type: targetType, target_id: targetId ?? null, details };
  const { error } = await client.from('admin_audit_logs').insert(row);
  // Older projects may not have a matching public.profiles row for the portal user.
  // Keep the event (and the original auth ID) instead of losing the audit entry.
  if (error?.code === '23503') {
    const { error: fallbackError } = await client.from('admin_audit_logs').insert({ ...row, actor_id: null, details: { ...details, auth_user_id: actor.id } });
    if (fallbackError) throw fallbackError;
  } else if (error) throw error;
}
