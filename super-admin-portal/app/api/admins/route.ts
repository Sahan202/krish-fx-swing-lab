import { NextRequest, NextResponse } from 'next/server';
import { audit, requireSuperAdmin, serviceClient } from '@/lib/admin-audit';

type Permissions = { manage_students?: boolean; manage_content?: boolean; manage_applications?: boolean; view_reports?: boolean };
export async function POST(request: NextRequest) {
  try {
    const actor = await requireSuperAdmin(request); if (!actor) return NextResponse.json({ error: 'Only the Super Admin can create Main Admin accounts.' }, { status: 403 });
    const body = await request.json() as { fullName?: string; email?: string; password?: string; permissions?: Permissions };
    if (!body.fullName || !body.email || !body.password || body.password.length < 8) return NextResponse.json({ error: 'Name, email, and a password of at least 8 characters are required.' }, { status: 400 });
    const client = serviceClient(); const created = await client.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true, user_metadata: { full_name: body.fullName } });
    if (created.error || !created.data.user) return NextResponse.json({ error: created.error?.message ?? 'Could not create admin account.' }, { status: 400 });
    const id = created.data.user.id; const permissions = body.permissions ?? {};
    const { error: profileError } = await client.from('profiles').upsert({ id, full_name: body.fullName, role: 'admin', approval_status: 'approved' }); if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
    const { error: permissionError } = await client.from('admin_permissions').upsert({ user_id: id, manage_students: Boolean(permissions.manage_students), manage_content: Boolean(permissions.manage_content), manage_applications: Boolean(permissions.manage_applications), view_reports: Boolean(permissions.view_reports), updated_at: new Date().toISOString() }); if (permissionError) return NextResponse.json({ error: permissionError.message }, { status: 400 });
    await audit(actor, 'MAIN_ADMIN_CREATED', 'admin_account', id, { fullName: body.fullName, email: body.email, permissions });
    return NextResponse.json({ admin: { id, email: body.email, fullName: body.fullName } });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create admin.' }, { status: 500 }); }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireSuperAdmin(request); if (!actor) return NextResponse.json({ error: 'Only the Super Admin can change permissions.' }, { status: 403 });
    const body = await request.json() as { id?: string; permissions?: Permissions }; if (!body.id) return NextResponse.json({ error: 'Admin ID is required.' }, { status: 400 });
    const permissions = body.permissions ?? {}; const { error } = await serviceClient().from('admin_permissions').upsert({ user_id: body.id, manage_students: Boolean(permissions.manage_students), manage_content: Boolean(permissions.manage_content), manage_applications: Boolean(permissions.manage_applications), view_reports: Boolean(permissions.view_reports), updated_at: new Date().toISOString() });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 }); await audit(actor, 'MAIN_ADMIN_PERMISSIONS_UPDATED', 'admin_account', body.id, { permissions }); return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update permissions.' }, { status: 500 }); }
}


export async function DELETE(request: NextRequest) {   try {     const actor = await requireSuperAdmin(request); if (!actor) return NextResponse.json({ error: 'Only the Super Admin can delete Main Admin accounts.' }, { status: 403 });     const body = await request.json() as { id?: string }; if (!body.id || body.id === actor.id) return NextResponse.json({ error: 'A valid different admin ID is required.' }, { status: 400 });     const client = serviceClient(); await client.from('admin_permissions').delete().eq('user_id', body.id); const { error } = await client.auth.admin.deleteUser(body.id);     if (error) return NextResponse.json({ error: error.message }, { status: 400 });     await audit(actor, 'MAIN_ADMIN_DELETED', 'admin_account', body.id); return NextResponse.json({ ok: true });   } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete admin.' }, { status: 500 }); } }