import { NextRequest, NextResponse } from 'next/server';
import { audit, requirePermission, serviceClient } from '@/lib/admin-audit';

export async function DELETE(request: NextRequest) {
  const actor = await requirePermission(request, 'manage_applications');
  if (!actor) return NextResponse.json({ error: 'You do not have application management permission.' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Application ID is missing.' }, { status: 400 });
  const client = serviceClient();
  const { data: application } = await client.from('student_applications').select('email,full_name,status').eq('id', id).maybeSingle();
  const { error } = await client.from('student_applications').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await audit(actor, 'APPLICATION_DELETED', 'student_application', id, application ?? {});
  return NextResponse.json({ success: true });
}
