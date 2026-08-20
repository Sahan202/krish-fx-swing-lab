import { NextRequest, NextResponse } from 'next/server';
import { audit, requirePermission, serviceClient } from '@/lib/admin-audit';
export async function DELETE(request: NextRequest) {
  const actor = await requirePermission(request, 'manage_students'); const { id } = await request.json() as { id?: string };
  if (!actor) return NextResponse.json({ error: 'You do not have student management permission.' }, { status: 403 }); if (!id) return NextResponse.json({ error: 'Student ID is missing.' }, { status: 400 });
  const admin = serviceClient();
  const { data: student } = await admin.from('profiles').select('full_name,phone,role').eq('id', id).maybeSingle();
  if (!student || student.role !== 'student') return NextResponse.json({ error: 'Only student accounts can be deleted here.' }, { status: 404 });
  const { data: authUser } = await admin.auth.admin.getUserById(id);
  const email = authUser.user?.email?.toLowerCase();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message || 'Supabase could not delete this account.' }, { status: error.status && error.status >= 500 ? 500 : 400 });
  if (email) {
    const { error: applicationError } = await admin.from('student_applications').delete().eq('email', email);
    if (applicationError) return NextResponse.json({ error: 'Account was deleted, but its application history could not be cleared. Please retry.' }, { status: 500 });
  }
  await audit(actor, 'STUDENT_DELETED', 'student', id, { ...student, email }); return NextResponse.json({ ok: true });
}
