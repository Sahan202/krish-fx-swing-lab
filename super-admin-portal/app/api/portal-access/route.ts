import { NextRequest, NextResponse } from 'next/server';
import { serviceClient } from '@/lib/admin-audit';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const client = serviceClient(); const { data: auth } = await client.auth.getUser(token); if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await client.from('profiles').select('role').eq('id', auth.user.id).maybeSingle();
  const role = profile?.role;
  if (!['admin', 'super_admin'].includes(role ?? '')) return NextResponse.json({ error: 'Not an administrator' }, { status: 403 });
  const { data: permissions } = role === 'admin' ? await client.from('admin_permissions').select('manage_students,manage_content,manage_applications,view_reports').eq('user_id', auth.user.id).maybeSingle() : { data: { manage_students: true, manage_content: true, manage_applications: true, view_reports: true } };
  return NextResponse.json({ role, permissions: permissions ?? { manage_students: false, manage_content: false, manage_applications: false, view_reports: false } });
}
