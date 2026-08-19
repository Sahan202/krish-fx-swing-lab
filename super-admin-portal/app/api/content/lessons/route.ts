import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Portal server configuration is missing.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, error } = await adminClient().from('lessons').insert({ course_id: body.courseId, title: body.title, description: body.description || null, vdocipher_video_id: body.videoId || null, lesson_order: Number(body.order) || 1 }).select().single();
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ lesson: data });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create lesson.' }, { status: 500 }); }
}
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { error } = await adminClient().from('lessons').update({ title: body.title, description: body.description || null, vdocipher_video_id: body.videoId || null, lesson_order: Number(body.order) || 1 }).eq('id', body.id);
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update lesson.' }, { status: 500 }); }
}
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const { error } = await adminClient().from('lessons').delete().eq('id', id);
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete lesson.' }, { status: 500 }); }
}
