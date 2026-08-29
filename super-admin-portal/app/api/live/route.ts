import { NextRequest, NextResponse } from 'next/server';
import { audit, requirePermission, serviceClient } from '@/lib/admin-audit';

function normalizeZoomUrl(value: unknown) {
  try {
    const url = new URL(String(value ?? '').trim());
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || !(host === 'zoom.us' || host.endsWith('.zoom.us') || host === 'zoomgov.com' || host.endsWith('.zoomgov.com'))) return null;
    return url.toString();
  } catch { return null; }
}

export async function GET(request: NextRequest) {
  const actor = await requirePermission(request, 'manage_content');
  if (!actor) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  const { data, error } = await serviceClient().from('live_sessions').select('id,course_id,title,zoom_join_url,status,scheduled_at,courses(title)').order('scheduled_at', { ascending: false });
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ sessions: data ?? [] });
}

export async function POST(request: NextRequest) {
  const actor = await requirePermission(request, 'manage_content');
  if (!actor) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  const body = await request.json();
  const title = String(body.title ?? '').trim();
  const zoomJoinUrl = normalizeZoomUrl(body.zoomJoinUrl);
  if (!body.courseId || !title || !zoomJoinUrl || !body.scheduledAt) return NextResponse.json({ error: 'Course, title, schedule and a valid Zoom join URL are required.' }, { status: 400 });
  const { data, error } = await serviceClient().from('live_sessions').insert({ course_id: body.courseId, title, zoom_join_url: zoomJoinUrl, scheduled_at: body.scheduledAt, created_by: actor.id }).select('id,course_id,title,zoom_join_url,status,scheduled_at,courses(title)').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await audit(actor, 'ZOOM_CLASS_SCHEDULED', 'live_session', data.id, { title, scheduled_at: data.scheduled_at });
  return NextResponse.json({ session: data });
}

export async function PATCH(request: NextRequest) {
  const actor = await requirePermission(request, 'manage_content');
  if (!actor) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  const body = await request.json();
  if (!body.sessionId || !['scheduled', 'live', 'ended'].includes(body.status)) return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  const { error } = await serviceClient().from('live_sessions').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', body.sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await audit(actor, 'ZOOM_CLASS_STATUS_CHANGED', 'live_session', body.sessionId, { status: body.status });
  return NextResponse.json({ ok: true });
}
export async function DELETE(request: NextRequest) {
  const actor = await requirePermission(request, 'manage_content');
  if (!actor) return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  const body = await request.json();
  const sessionId = String(body.sessionId ?? '').trim();
  if (!sessionId) return NextResponse.json({ error: 'Live class is required.' }, { status: 400 });

  const client = serviceClient();
  const { data: liveSession } = await client.from('live_sessions').select('id,title,scheduled_at').eq('id', sessionId).maybeSingle();
  if (!liveSession) return NextResponse.json({ error: 'Live class not found.' }, { status: 404 });

  const { error } = await client.from('live_sessions').delete().eq('id', sessionId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await audit(actor, 'ZOOM_CLASS_DELETED', 'live_session', sessionId, { title: liveSession.title, scheduled_at: liveSession.scheduled_at });
  return NextResponse.json({ ok: true });
}
