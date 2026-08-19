import { NextRequest, NextResponse } from 'next/server';
import { audit, requireAuthenticatedUser } from '@/lib/admin-audit';

export async function POST(request: NextRequest) {
  try {
    const actor = await requireAuthenticatedUser(request);
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await audit(actor, 'SIGNED_IN', 'super_admin_portal', actor.id, { source: 'password_login' });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: 'Could not record login.' }, { status: 500 }); }
}
