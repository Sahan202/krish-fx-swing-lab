import { NextRequest, NextResponse } from 'next/server';
import { recordCurrentUserEvent } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const body = await request.json() as { action?: string; targetType?: string; targetId?: string; details?: Record<string, unknown> };
  if (!body.action || !body.targetType) return NextResponse.json({ error: 'Event details are missing.' }, { status: 400 });
  await recordCurrentUserEvent({ action: body.action, targetType: body.targetType, targetId: body.targetId, details: body.details });
  return NextResponse.json({ ok: true });
}
