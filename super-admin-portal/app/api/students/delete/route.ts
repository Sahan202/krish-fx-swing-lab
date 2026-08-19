import { NextRequest, NextResponse } from 'next/server';
import { audit, requireAdmin, serviceClient } from '@/lib/admin-audit';
export async function DELETE(request: NextRequest) {
  const actor = await requireAdmin(request); const { id } = await request.json() as { id?: string };
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); if (!id) return NextResponse.json({ error: 'Student ID is missing.' }, { status: 400 });
  const admin = serviceClient(); const { data: student } = await admin.from('profiles').select('full_name,phone').eq('id', id).maybeSingle(); const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message || 'Supabase could not delete this account.' }, { status: error.status && error.status >= 500 ? 500 : 400 });
  await audit(actor, 'STUDENT_DELETED', 'student', id, student ?? {}); return NextResponse.json({ ok: true });
}
