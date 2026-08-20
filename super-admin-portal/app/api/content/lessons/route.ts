import { NextRequest, NextResponse } from 'next/server';
import { audit, requirePermission, serviceClient } from '@/lib/admin-audit';

function lessonValues(body: { title?: string; description?: string; videoId?: string; order?: string | number; sectionId?: string }) {
  return { title: String(body.title ?? '').trim(), description: body.description?.trim() || null, vdocipher_video_id: body.videoId?.trim() || null, lesson_order: Number(body.order) || 1, section_id: body.sectionId || null };
}
export async function POST(request: NextRequest) {
  try { const actor = await requirePermission(request, 'manage_content'); if (!actor) return NextResponse.json({ error: 'You do not have lesson/content permission.' }, { status: 403 }); const body = await request.json(); if (!body.courseId || !String(body.title ?? '').trim()) return NextResponse.json({ error: 'Course and lesson title are required.' }, { status: 400 }); const { data, error } = await serviceClient().from('lessons').insert({ course_id: body.courseId, ...lessonValues(body) }).select().single(); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); await audit(actor, 'LESSON_CREATED', 'lesson', data.id, { title: data.title, courseId: data.course_id, sectionId: data.section_id, videoId: data.vdocipher_video_id, order: data.lesson_order }); return NextResponse.json({ lesson: data }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create lesson.' }, { status: 500 }); }
}
export async function PATCH(request: NextRequest) {
  try { const actor = await requirePermission(request, 'manage_content'); if (!actor) return NextResponse.json({ error: 'You do not have lesson/content permission.' }, { status: 403 }); const body = await request.json(); if (!body.id || !String(body.title ?? '').trim()) return NextResponse.json({ error: 'Lesson title is required.' }, { status: 400 }); const values = lessonValues(body); const { error } = await serviceClient().from('lessons').update(values).eq('id', body.id); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); await audit(actor, 'LESSON_UPDATED', 'lesson', body.id, values); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not update lesson.' }, { status: 500 }); }
}
export async function DELETE(request: NextRequest) {
  try { const actor = await requirePermission(request, 'manage_content'); if (!actor) return NextResponse.json({ error: 'You do not have lesson/content permission.' }, { status: 403 }); const { id } = await request.json(); const { data: existing } = await serviceClient().from('lessons').select('title,vdocipher_video_id,section_id').eq('id', id).maybeSingle(); const { error } = await serviceClient().from('lessons').delete().eq('id', id); if (error) return NextResponse.json({ error: error.message }, { status: 400 }); await audit(actor, 'LESSON_DELETED', 'lesson', id, existing ?? {}); return NextResponse.json({ ok: true }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not delete lesson.' }, { status: 500 }); }
}
