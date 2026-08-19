import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  const { id } = (await request.json()) as { id?: string };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!id || !url || !key) return NextResponse.json({ error: 'Student ID or server configuration is missing.' }, { status: 400 });

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    if (error.status === 404 || error.code === 'user_not_found') {
      const { error: profileError } = await admin.from('profiles').delete().eq('id', id);
      if (!profileError) return NextResponse.json({ ok: true, warning: 'Auth account was already absent; profile removed.' });
    }
    console.error('Student delete failed:', error.message, error.status, error.code);
    return NextResponse.json({ error: error.message || 'Supabase could not delete this account.' }, { status: error.status && error.status >= 500 ? 500 : 400 });
  }
  return NextResponse.json({ ok: true });
}
