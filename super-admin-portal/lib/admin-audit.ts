import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export type AdminActor = { id: string; email: string | null };
export type Permission = 'manage_students' | 'manage_content' | 'manage_applications' | 'view_reports';
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
  const { data: profile } = await admin.from('profiles').select('role').eq('id', auth.user.id).maybeSingle(); if (!['admin', 'super_admin'].includes(profile?.role ?? '')) return null;
  return { id: auth.user.id, email: auth.user.email ?? null };
}
export async function requirePermission(request: NextRequest, permission: Permission): Promise<AdminActor | null> {
  const actor = await requireAdmin(request); if (!actor) return null;
  const client = serviceClient(); const { data: profile } = await client.from('profiles').select('role').eq('id', actor.id).maybeSingle();
  if (profile?.role === 'super_admin') return actor;
  const { data } = await client.from('admin_permissions').select('manage_students,manage_content,manage_applications,view_reports').eq('user_id', actor.id).maybeSingle();
  const permissions = data as Record<Permission, boolean> | null;
  return permissions?.[permission] ? actor : null;
}
export async function requireSuperAdmin(request: NextRequest): Promise<AdminActor | null> {
  const actor = await requireAdmin(request); if (!actor) return null;
  const { data: profile } = await serviceClient().from('profiles').select('role').eq('id', actor.id).maybeSingle();
  return profile?.role === 'super_admin' ? actor : null;
}
export async function audit(actor: AdminActor, action: string, targetType: string, targetId?: string, details: Record<string, unknown> = {}) {
  const client = serviceClient();
  const { data: profile } = await client.from('profiles').select('role').eq('id', actor.id).maybeSingle();
  const row = { actor_id: actor.id, actor_email: actor.email, actor_role: profile?.role ?? 'admin', action, target_type: targetType, target_id: targetId ?? null, details };
  const { error } = await client.from('admin_audit_logs').insert(row);
  // Older projects may not have a matching public.profiles row for the portal user.
  // Keep the event (and the original auth ID) instead of losing the audit entry.
  if (error?.code === '23503') {
    const { error: fallbackError } = await client.from('admin_audit_logs').insert({ ...row, actor_id: null, details: { ...details, auth_user_id: actor.id } });
    if (fallbackError) throw fallbackError;
  } else if (error) throw error;
}
