import { NextRequest, NextResponse } from 'next/server';
import { audit, requireAdmin, serviceClient } from '@/lib/admin-audit';

export async function POST(request: NextRequest) {
  try { const actor = await requireAdmin(request); if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const body = await request.json(); const { data, error } = await serviceClient().from('lessons').insert({ course_id: body.courseId, title: body.title, description: body.description || null, vdocipher_video_id: body.videoId || null, lesson_order: Number(body.order) || 1 }).select().single(); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); await audit(actor, 'LESSON_CREATED', 'lesson', data.id, { title: data.title, courseId: data.course_id, videoId: data.vdocipher_video_id, order: data.lesson_order }); return NextResponse.json({ lesson: data }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create lesson.' }, { status: 500 }); }
}
export async function PATCH(request: NextRequest) {
  try { const actor = await requireAdmin(request); if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const body = await request.json(); const values = { title: body.title, description: body.description || null, vdocipher_video_id: body.videoId || null, lesson_order: Number(body.order) || 1 }; const { error } = await serviceClient().from('lessons').update(values).eq('id', body.id); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); await audit(actor, 'LESSON_UPDATED', 'lesson', body.id, values); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update lesson.' }, { status: 500 }); }
}
export async function DELETE(request: NextRequest) {
  try { const actor = await requireAdmin(request); if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); const { id } = await request.json(); const { data: existing } = await serviceClient().from('lessons').select('title,vdocipher_video_id').eq('id', id).maybeSingle(); const { error } = await serviceClient().from('lessons').delete().eq('id', id); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); await audit(actor, 'LESSON_DELETED', 'lesson', id, existing ?? {}); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete lesson.' }, { status: 500 }); }
}
